"""
API de Peso Corporal — Acompanha a evolução do peso ao longo do tempo
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime
import jwt
import os
from ..core.db import get_db
from ..core.models import WeightEntry, User
from ..core.schemas import WeightEntryIn, WeightEntryOut

router = APIRouter(prefix="/weight", tags=["weight"])

SECRET_KEY = os.getenv("SECRET_KEY", "laphis-secret-key-change-in-production")
ALGORITHM = "HS256"


def _get_user_id(token: str) -> int:
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


@router.get("", response_model=list[WeightEntryOut])
def list_weight_entries(
    token: str = None,
    limit: int = 60,
    db: Session = Depends(get_db),
):
    """Listar registos de peso (mais recente primeiro)"""
    user_id = _get_user_id(token)
    entries = (
        db.query(WeightEntry)
        .filter(WeightEntry.user_id == user_id)
        .order_by(WeightEntry.date.desc())
        .limit(limit)
        .all()
    )
    return [WeightEntryOut.model_validate(e) for e in entries]


@router.post("", response_model=WeightEntryOut)
def add_weight_entry(
    payload: WeightEntryIn,
    token: str = None,
    db: Session = Depends(get_db),
):
    """Registar novo peso (atualiza se já existir para o dia de hoje)"""
    user_id = _get_user_id(token)
    today = datetime.utcnow().strftime("%Y-%m-%d")

    # Verifica se já existe entrada para hoje
    existing = (
        db.query(WeightEntry)
        .filter(WeightEntry.user_id == user_id, WeightEntry.date == today)
        .first()
    )

    if existing:
        existing.weight_kg = payload.weight_kg
        existing.notes = payload.notes
        db.commit()
        db.refresh(existing)
        return WeightEntryOut.model_validate(existing)

    entry = WeightEntry(
        user_id=user_id,
        weight_kg=payload.weight_kg,
        date=today,
        notes=payload.notes,
        created_at=datetime.utcnow(),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return WeightEntryOut.model_validate(entry)


@router.delete("/{entry_id}")
def delete_weight_entry(
    entry_id: int,
    token: str = None,
    db: Session = Depends(get_db),
):
    """Apagar registo de peso"""
    user_id = _get_user_id(token)
    entry = (
        db.query(WeightEntry)
        .filter(WeightEntry.id == entry_id, WeightEntry.user_id == user_id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Registo não encontrado")

    db.delete(entry)
    db.commit()
    return {"ok": True, "detail": "Registo apagado"}


@router.get("/stats")
def weight_stats(token: str = None, db: Session = Depends(get_db)):
    """Estatísticas de peso (atual, mínimo, máximo, variação)"""
    user_id = _get_user_id(token)
    entries = (
        db.query(WeightEntry)
        .filter(WeightEntry.user_id == user_id)
        .order_by(WeightEntry.date.asc())
        .all()
    )

    if not entries:
        return {
            "current": None,
            "min": None,
            "max": None,
            "change": None,
            "total_entries": 0,
        }

    weights = [e.weight_kg for e in entries]
    return {
        "current": entries[-1].weight_kg,
        "min": min(weights),
        "max": max(weights),
        "change": round(entries[-1].weight_kg - entries[0].weight_kg, 1),
        "total_entries": len(entries),
        "first_date": entries[0].date,
        "last_date": entries[-1].date,
    }
