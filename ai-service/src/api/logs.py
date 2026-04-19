"""
API de Registos (Logs) — CRUD unificado para treinos e refeições
Utiliza autenticação por JWT token (query param)
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import jwt
import os
from ..core.db import get_db
from ..core.models import Profile, WorkoutLog, MealLog, User
from ..core.schemas import UnifiedLogIn, UnifiedLogOut

router = APIRouter(prefix="/logs", tags=["logs"])

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


def _get_profile_id(user_id: int, db: Session) -> int:
    """Obter profile_id a partir do user_id"""
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil não encontrado. Cria o teu perfil primeiro.")
    return profile.id


@router.get("", response_model=list[UnifiedLogOut])
def list_logs(
    token: str = None,
    limit: int = 100,
    offset: int = 0,
    log_type: str = None,
    db: Session = Depends(get_db),
):
    """
    Listar todos os registos do utilizador (treinos + refeições)
    Retorna lista unificada ordenada por data (mais recente primeiro)
    Filtro opcional: log_type=treino ou log_type=refeicao
    """
    user_id = _get_user_id(token)
    profile_id = _get_profile_id(user_id, db)

    results = []

    # Buscar treinos
    if log_type is None or log_type == "treino":
        workouts = (
            db.query(WorkoutLog)
            .filter(WorkoutLog.profile_id == profile_id)
            .all()
        )
        for w in workouts:
            results.append(UnifiedLogOut(
                id=w.id,
                log_type="treino",
                description=w.description,
                duration_min=w.duration_min,
                calories=w.calories,
                notes=w.notes,
                date=w.date,
                created_at=w.created_at if hasattr(w, "created_at") else None,
            ))

    # Buscar refeições
    if log_type is None or log_type == "refeicao":
        meals = (
            db.query(MealLog)
            .filter(MealLog.profile_id == profile_id)
            .all()
        )
        for m in meals:
            results.append(UnifiedLogOut(
                id=m.id,
                log_type="refeicao",
                description=None,
                duration_min=None,
                calories=m.calories,
                notes=m.notes,
                meal_type=m.meal,
                foods=m.foods,
                date=m.date,
                created_at=m.created_at if hasattr(m, "created_at") else None,
            ))

    # Ordenar por data (mais recente primeiro)
    results.sort(key=lambda x: str(x.created_at or x.date or ""), reverse=True)

    return results[offset: offset + limit]


@router.post("", response_model=UnifiedLogOut)
def create_log(
    payload: UnifiedLogIn,
    token: str = None,
    db: Session = Depends(get_db),
):
    """
    Criar novo registo (treino ou refeição)
    A data é auto-preenchida com a data de hoje
    """
    user_id = _get_user_id(token)
    profile_id = _get_profile_id(user_id, db)

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    now = datetime.now(timezone.utc)

    if payload.log_type == "treino":
        workout = WorkoutLog(
            profile_id=profile_id,
            date=today,
            description=payload.description,
            duration_min=payload.duration_min,
            calories=payload.calories,
            notes=payload.notes,
            created_at=now,
        )
        db.add(workout)
        db.commit()
        db.refresh(workout)
        return UnifiedLogOut(
            id=workout.id,
            log_type="treino",
            description=workout.description,
            duration_min=workout.duration_min,
            calories=workout.calories,
            notes=workout.notes,
            date=workout.date,
            created_at=workout.created_at,
        )
    else:
        meal = MealLog(
            profile_id=profile_id,
            date=today,
            meal=payload.meal_type or "snack",
            foods=payload.foods,
            calories=payload.calories,
            notes=payload.notes,
            created_at=now,
        )
        db.add(meal)
        db.commit()
        db.refresh(meal)
        return UnifiedLogOut(
            id=meal.id,
            log_type="refeicao",
            calories=meal.calories,
            notes=meal.notes,
            meal_type=meal.meal,
            foods=meal.foods,
            date=meal.date,
            created_at=meal.created_at,
        )


@router.put("/{log_id}", response_model=UnifiedLogOut)
def update_log(
    log_id: int,
    payload: UnifiedLogIn,
    token: str = None,
    db: Session = Depends(get_db),
):
    """
    Atualizar um registo existente (treino ou refeição)
    """
    user_id = _get_user_id(token)
    profile_id = _get_profile_id(user_id, db)

    if payload.log_type == "treino":
        record = (
            db.query(WorkoutLog)
            .filter(WorkoutLog.id == log_id, WorkoutLog.profile_id == profile_id)
            .first()
        )
        if not record:
            raise HTTPException(status_code=404, detail="Registo de treino não encontrado")
        if payload.description is not None:
            record.description = payload.description
        if payload.duration_min is not None:
            record.duration_min = payload.duration_min
        if payload.calories is not None:
            record.calories = payload.calories
        if payload.notes is not None:
            record.notes = payload.notes
        db.commit()
        db.refresh(record)
        return UnifiedLogOut(
            id=record.id,
            log_type="treino",
            description=record.description,
            duration_min=record.duration_min,
            calories=record.calories,
            notes=record.notes,
            date=record.date,
            created_at=record.created_at if hasattr(record, "created_at") else None,
        )
    else:
        record = (
            db.query(MealLog)
            .filter(MealLog.id == log_id, MealLog.profile_id == profile_id)
            .first()
        )
        if not record:
            raise HTTPException(status_code=404, detail="Registo de refeição não encontrado")
        if payload.meal_type is not None:
            record.meal = payload.meal_type
        if payload.foods is not None:
            record.foods = payload.foods
        if payload.calories is not None:
            record.calories = payload.calories
        if payload.notes is not None:
            record.notes = payload.notes
        db.commit()
        db.refresh(record)
        return UnifiedLogOut(
            id=record.id,
            log_type="refeicao",
            calories=record.calories,
            notes=record.notes,
            meal_type=record.meal,
            foods=record.foods,
            date=record.date,
            created_at=record.created_at if hasattr(record, "created_at") else None,
        )


@router.delete("/{log_id}")
def delete_log(
    log_id: int,
    token: str = None,
    log_type: str = "treino",
    db: Session = Depends(get_db),
):
    """
    Apagar um registo (treino ou refeição)
    Necessário enviar log_type=treino ou log_type=refeicao
    """
    user_id = _get_user_id(token)
    profile_id = _get_profile_id(user_id, db)

    if log_type == "treino":
        record = (
            db.query(WorkoutLog)
            .filter(WorkoutLog.id == log_id, WorkoutLog.profile_id == profile_id)
            .first()
        )
    else:
        record = (
            db.query(MealLog)
            .filter(MealLog.id == log_id, MealLog.profile_id == profile_id)
            .first()
        )

    if not record:
        raise HTTPException(status_code=404, detail="Registo não encontrado")

    db.delete(record)
    db.commit()
    return {"ok": True, "detail": "Registo apagado"}