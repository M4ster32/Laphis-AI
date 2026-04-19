"""
API de Hidratação — Acompanha a ingestão de água diária
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import jwt
import os
from ..core.db import get_db
from ..core.models import WaterLog, User
from ..core.schemas import WaterLogIn, WaterLogOut, WaterDailyOut

router = APIRouter(prefix="/water", tags=["water"])

SECRET_KEY = os.getenv("SECRET_KEY", "laphis-secret-key-change-in-production")
ALGORITHM = "HS256"
GLASS_ML = 250  # 250ml por copo
DAILY_GOAL = 8  # 8 copos por dia


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


@router.get("/today", response_model=WaterDailyOut)
def get_today_water(token: str = None, db: Session = Depends(get_db)):
    """Obter progresso de água de hoje"""
    user_id = _get_user_id(token)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    record = (
        db.query(WaterLog)
        .filter(WaterLog.user_id == user_id, WaterLog.date == today)
        .first()
    )

    glasses = record.glasses if record else 0
    ml_total = glasses * GLASS_ML
    return WaterDailyOut(
        date=today,
        glasses=glasses,
        ml_total=ml_total,
        goal_glasses=DAILY_GOAL,
        percentage=round((glasses / DAILY_GOAL) * 100, 1) if DAILY_GOAL > 0 else 0,
    )


@router.post("/add", response_model=WaterDailyOut)
def add_water(
    payload: WaterLogIn,
    token: str = None,
    db: Session = Depends(get_db),
):
    """Adicionar copos de água ao dia de hoje"""
    user_id = _get_user_id(token)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    record = (
        db.query(WaterLog)
        .filter(WaterLog.user_id == user_id, WaterLog.date == today)
        .first()
    )

    if record:
        record.glasses += payload.glasses
        record.ml_total = record.glasses * GLASS_ML
    else:
        record = WaterLog(
            user_id=user_id,
            date=today,
            glasses=payload.glasses,
            ml_total=payload.glasses * GLASS_ML,
            created_at=datetime.now(timezone.utc),
        )
        db.add(record)

    db.commit()
    db.refresh(record)

    return WaterDailyOut(
        date=today,
        glasses=record.glasses,
        ml_total=record.ml_total,
        goal_glasses=DAILY_GOAL,
        percentage=round((record.glasses / DAILY_GOAL) * 100, 1),
    )


@router.post("/remove", response_model=WaterDailyOut)
def remove_water(token: str = None, db: Session = Depends(get_db)):
    """Remover 1 copo de água do dia de hoje"""
    user_id = _get_user_id(token)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    record = (
        db.query(WaterLog)
        .filter(WaterLog.user_id == user_id, WaterLog.date == today)
        .first()
    )

    if record and record.glasses > 0:
        record.glasses -= 1
        record.ml_total = record.glasses * GLASS_ML
        db.commit()
        db.refresh(record)

    glasses = record.glasses if record else 0
    return WaterDailyOut(
        date=today,
        glasses=glasses,
        ml_total=glasses * GLASS_ML,
        goal_glasses=DAILY_GOAL,
        percentage=round((glasses / DAILY_GOAL) * 100, 1) if DAILY_GOAL > 0 else 0,
    )


@router.get("/history")
def water_history(
    token: str = None,
    days: int = 7,
    db: Session = Depends(get_db),
):
    """Histórico de água dos últimos N dias"""
    user_id = _get_user_id(token)
    result = []

    for i in range(days - 1, -1, -1):
        d = (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d")
        record = (
            db.query(WaterLog)
            .filter(WaterLog.user_id == user_id, WaterLog.date == d)
            .first()
        )
        glasses = record.glasses if record else 0
        result.append({
            "date": d,
            "glasses": glasses,
            "ml_total": glasses * GLASS_ML,
            "goal_glasses": DAILY_GOAL,
            "percentage": round((glasses / DAILY_GOAL) * 100, 1) if DAILY_GOAL > 0 else 0,
        })

    return result
