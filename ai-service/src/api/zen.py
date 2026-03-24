"""
API de Sessões Zen — CRUD
Regista sessões de meditação e respiração do utilizador
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime
import jwt
import os
from ..core.db import get_db
from ..core.models import ZenSession, User
from ..core.schemas import ZenSessionIn, ZenSessionOut

router = APIRouter(prefix="/zen", tags=["zen"])

SECRET_KEY = os.getenv("SECRET_KEY", "laphis-secret-key-change-in-production")
ALGORITHM = "HS256"


def _get_user_id(token: str) -> int:
    """Extrair user_id do JWT token"""
    if not token:
        raise HTTPException(status_code=401, detail="Token required")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return int(user_id)
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.get("", response_model=list[ZenSessionOut])
def list_zen_sessions(
    token: str = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """Listar sessões zen do utilizador (mais recentes primeiro)"""
    user_id = _get_user_id(token)
    sessions = (
        db.query(ZenSession)
        .filter(ZenSession.user_id == user_id)
        .order_by(ZenSession.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [ZenSessionOut.model_validate(s) for s in sessions]


@router.post("", response_model=ZenSessionOut)
def create_zen_session(
    payload: ZenSessionIn,
    token: str = None,
    db: Session = Depends(get_db),
):
    """Guardar nova sessão zen"""
    user_id = _get_user_id(token)

    # Verificar que o user existe
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")

    session = ZenSession(
        user_id=user_id,
        type=payload.type,
        duration_min=payload.duration_min,
        mood_before=payload.mood_before,
        mood_after=payload.mood_after,
        notes=payload.notes,
        created_at=datetime.utcnow(),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return ZenSessionOut.model_validate(session)


@router.delete("/{session_id}")
def delete_zen_session(
    session_id: int,
    token: str = None,
    db: Session = Depends(get_db),
):
    """Apagar uma sessão zen"""
    user_id = _get_user_id(token)
    session = (
        db.query(ZenSession)
        .filter(ZenSession.id == session_id, ZenSession.user_id == user_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")

    db.delete(session)
    db.commit()
    return {"ok": True, "detail": "Sessão apagada"}


@router.get("/stats")
def zen_stats(token: str = None, db: Session = Depends(get_db)):
    """Obter estatísticas zen do utilizador"""
    user_id = _get_user_id(token)
    sessions = (
        db.query(ZenSession)
        .filter(ZenSession.user_id == user_id)
        .order_by(ZenSession.created_at.desc())
        .all()
    )

    total = len(sessions)
    total_minutes = sum(s.duration_min or 0 for s in sessions)
    breathing_count = sum(1 for s in sessions if s.type == "breathing")
    meditation_count = sum(1 for s in sessions if s.type == "meditation")

    # Mood distribution
    moods_after = [s.mood_after for s in sessions if s.mood_after]
    mood_dist = {}
    for m in moods_after:
        mood_dist[m] = mood_dist.get(m, 0) + 1

    return {
        "total_sessions": total,
        "total_minutes": total_minutes,
        "breathing_count": breathing_count,
        "meditation_count": meditation_count,
        "mood_distribution": [{"mood": k, "count": v} for k, v in mood_dist.items()],
    }
