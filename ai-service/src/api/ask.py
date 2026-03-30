from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import jwt, os
from ..core.db import get_db
from ..core.models import Profile, ChatMessage, ChatSession, User
from ..core.schemas import AskIn, AskOut, ProfileOut
from ..core.recommender import recommend

router = APIRouter(prefix="/ask", tags=["ask"])

SECRET_KEY = os.getenv("SECRET_KEY", "laphis-secret-key-change-in-production")
ALGORITHM = "HS256"
SESSION_TTL_DAYS = 7


def _load_profile(profile_id: int, db: Session) -> Profile:
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


def _get_or_create_session(user_id: int, session_id: int | None, db: Session) -> ChatSession:
    now = datetime.utcnow()
    if session_id:
        session = (
            db.query(ChatSession)
            .filter(ChatSession.id == session_id, ChatSession.user_id == user_id)
            .first()
        )
        if session and session.expires_at > now:
            return session

    session = ChatSession(
        user_id=user_id,
        title="Nova conversa",
        created_at=now,
        expires_at=now + timedelta(days=SESSION_TTL_DAYS),
    )
    db.add(session)
    db.flush()
    return session


@router.post("", response_model=AskOut)
def ask(payload: AskIn, db: Session = Depends(get_db)):
    profile = _load_profile(payload.profile_id, db)

    profile_out = ProfileOut(
        id=profile.id,
        name=profile.name,
        age=profile.age,
        sex=profile.sex,
        height_cm=profile.height_cm,
        weight_kg=profile.weight_kg,
        goal=profile.goal,
        level=profile.level,
        days_per_week=profile.days_per_week,
    )

    title, bullets = recommend(profile_out, payload.question)
    ai_text = f"{title}\n\n" + "\n".join(f"• {b}" if b and not b.startswith("•") else b for b in bullets)

    session_id = getattr(payload, 'session_id', None)
    session = _get_or_create_session(profile.user_id, session_id, db)

    if session.title == "Nova conversa" and len(payload.question) > 3:
        session.title = payload.question[:80]

    user_msg = ChatMessage(
        user_id=profile.user_id,
        session_id=session.id,
        role="user",
        content=payload.question,
        created_at=datetime.utcnow(),
    )
    db.add(user_msg)

    ai_msg = ChatMessage(
        user_id=profile.user_id,
        session_id=session.id,
        role="assistant",
        content=ai_text,
        created_at=datetime.utcnow(),
    )
    db.add(ai_msg)
    db.commit()

    return AskOut(
        title=title,
        bullets=bullets,
        disclaimer="Isto é uma sugestão geral e não substitui aconselhamento médico/nutricional.",
        session_id=session.id,
    )