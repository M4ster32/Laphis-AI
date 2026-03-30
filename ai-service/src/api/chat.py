from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
import jwt, os
from ..core.db import get_db
from ..core.models import User, Profile, ChatMessage, ChatSession
from ..core.schemas import (
    ChatHistoryOut, ChatMessageOut,
    ChatSessionOut, ChatSessionDetailOut,
)

router = APIRouter(prefix="/chat", tags=["chat"])

SECRET_KEY = os.getenv("SECRET_KEY", "laphis-secret-key-change-in-production")
ALGORITHM = "HS256"
SESSION_TTL_DAYS = 7


def _get_user_id(token: str) -> int:
    if not token:
        raise HTTPException(status_code=401, detail="Token required")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        uid = payload.get("sub")
        if not uid:
            raise HTTPException(status_code=401, detail="Invalid token")
        return int(uid)
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.get("/sessions", response_model=list[ChatSessionOut])
def list_sessions(token: str = None, db: Session = Depends(get_db)):
    user_id = _get_user_id(token)
    now = datetime.utcnow()
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == user_id, ChatSession.expires_at > now)
        .order_by(ChatSession.created_at.desc())
        .all()
    )
    result = []
    for s in sessions:
        count = db.query(func.count(ChatMessage.id)).filter(ChatMessage.session_id == s.id).scalar()
        result.append(ChatSessionOut(
            id=s.id, title=s.title,
            created_at=s.created_at, expires_at=s.expires_at,
            message_count=count,
        ))
    return result


@router.post("/sessions", response_model=ChatSessionOut)
def create_session(token: str = None, db: Session = Depends(get_db)):
    user_id = _get_user_id(token)
    now = datetime.utcnow()
    session = ChatSession(
        user_id=user_id,
        title="Nova conversa",
        created_at=now,
        expires_at=now + timedelta(days=SESSION_TTL_DAYS),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return ChatSessionOut(
        id=session.id, title=session.title,
        created_at=session.created_at, expires_at=session.expires_at,
        message_count=0,
    )


@router.get("/sessions/{session_id}", response_model=ChatSessionDetailOut)
def get_session(session_id: int, token: str = None, db: Session = Depends(get_db)):
    user_id = _get_user_id(token)
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == user_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return ChatSessionDetailOut(
        id=session.id, title=session.title,
        created_at=session.created_at, expires_at=session.expires_at,
        messages=[ChatMessageOut.model_validate(m) for m in messages],
    )


@router.put("/sessions/{session_id}/title")
def rename_session(session_id: int, title: str, token: str = None, db: Session = Depends(get_db)):
    user_id = _get_user_id(token)
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == user_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.title = title[:120]
    db.commit()
    return {"ok": True, "title": session.title}


@router.delete("/sessions/{session_id}")
def delete_session(session_id: int, token: str = None, db: Session = Depends(get_db)):
    user_id = _get_user_id(token)
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == user_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()
    return {"ok": True}


@router.get("/{profile_id}", response_model=ChatHistoryOut)
def get_chat_history(
    profile_id: int,
    page: int = 1,
    per_page: int = 50,
    db: Session = Depends(get_db),
):
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    user_id = profile.user_id
    total = db.query(ChatMessage).filter(ChatMessage.user_id == user_id).count()
    offset = (page - 1) * per_page
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == user_id)
        .order_by(ChatMessage.created_at.desc())
        .offset(offset)
        .limit(per_page)
        .all()
    )
    messages.reverse()

    return ChatHistoryOut(
        messages=[ChatMessageOut.model_validate(m) for m in messages],
        total=total, page=page, per_page=per_page,
    )


def cleanup_expired_sessions(db: Session):
    now = datetime.utcnow()
    expired = db.query(ChatSession).filter(ChatSession.expires_at <= now).all()
    count = len(expired)
    for s in expired:
        db.delete(s)
    if count > 0:
        db.commit()
    return count
