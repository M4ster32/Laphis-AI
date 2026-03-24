"""
API de Relatórios — Agrega dados de todas as tabelas para gerar relatórios do utilizador
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from collections import Counter
import jwt
import os
from ..core.db import get_db
from ..core.models import User, Profile, WorkoutLog, MealLog, Plan, ZenSession, ChatMessage
from ..core.schemas import ReportSummaryOut

router = APIRouter(prefix="/reports", tags=["reports"])

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


def _calc_streak(dates_list):
    """Calcula streak de dias consecutivos"""
    if not dates_list:
        return 0
    unique = sorted(set(dates_list), reverse=True)
    if not unique:
        return 0
    today = datetime.utcnow().strftime("%Y-%m-%d")
    yesterday = (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d")
    if unique[0] != today and unique[0] != yesterday:
        return 0
    streak = 1
    for i in range(1, len(unique)):
        d1 = datetime.strptime(unique[i - 1], "%Y-%m-%d")
        d2 = datetime.strptime(unique[i], "%Y-%m-%d")
        if (d1 - d2).days == 1:
            streak += 1
        else:
            break
    return streak


def _weekly_data(items, date_field, value_field, weeks=8):
    """Agregar dados por semana"""
    result = []
    for w in range(weeks - 1, -1, -1):
        start = datetime.utcnow() - timedelta(weeks=w + 1)
        end = datetime.utcnow() - timedelta(weeks=w)
        week_items = [
            i for i in items
            if hasattr(i, date_field) and getattr(i, date_field)
            and start.strftime("%Y-%m-%d") <= str(getattr(i, date_field))[:10] <= end.strftime("%Y-%m-%d")
        ]
        total_value = sum(getattr(i, value_field, 0) or 0 for i in week_items)
        result.append({
            "week": f"Sem {weeks - w}",
            "count": len(week_items),
            "total": total_value,
        })
    return result


@router.get("/summary", response_model=ReportSummaryOut)
def get_report_summary(token: str = None, db: Session = Depends(get_db)):
    """
    Relatório completo do utilizador — agrega dados de treinos, refeições,
    sessões zen, planos e histórico de chat
    """
    user_id = _get_user_id(token)

    # Verificar user e obter profile
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")

    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    profile_id = profile.id if profile else None

    # Dados
    workouts = (
        db.query(WorkoutLog).filter(WorkoutLog.profile_id == profile_id).all()
        if profile_id else []
    )
    meals = (
        db.query(MealLog).filter(MealLog.profile_id == profile_id).all()
        if profile_id else []
    )
    plans = (
        db.query(Plan).filter(Plan.profile_id == profile_id).all()
        if profile_id else []
    )
    zen_sessions = (
        db.query(ZenSession).filter(ZenSession.user_id == user_id).all()
    )

    # Totais
    total_workouts = len(workouts)
    total_meals = len(meals)
    total_zen = len(zen_sessions)
    total_plans = len(plans)
    total_workout_min = sum(w.duration_min or 0 for w in workouts)
    total_calories = sum(m.calories or 0 for m in meals)
    total_zen_min = sum(z.duration_min or 0 for z in zen_sessions)

    # Médias
    workout_dates = [w.date for w in workouts if w.date]
    meal_dates = [m.date for m in meals if m.date]
    unique_meal_days = len(set(meal_dates))
    avg_cal = round(total_calories / unique_meal_days, 1) if unique_meal_days > 0 else 0
    avg_workout = round(total_workout_min / total_workouts, 1) if total_workouts > 0 else 0

    # Streaks
    workout_streak = _calc_streak(workout_dates)
    zen_dates = [
        z.created_at.strftime("%Y-%m-%d") if z.created_at else None
        for z in zen_sessions
    ]
    zen_streak = _calc_streak([d for d in zen_dates if d])

    # Moods (zen)
    moods_before = [z.mood_before for z in zen_sessions if z.mood_before]
    moods_after = [z.mood_after for z in zen_sessions if z.mood_after]
    most_mood_before = Counter(moods_before).most_common(1)[0][0] if moods_before else None
    most_mood_after = Counter(moods_after).most_common(1)[0][0] if moods_after else None

    # Mood distribution
    mood_dist = Counter(moods_after)
    mood_distribution = [{"mood": k, "count": v} for k, v in mood_dist.items()]

    # Weekly aggregates
    workouts_by_week = _weekly_data(workouts, "date", "duration_min")
    calories_by_week = _weekly_data(meals, "date", "calories")

    # Zen weekly (use created_at)
    zen_weekly = []
    for w in range(7, -1, -1):
        start = datetime.utcnow() - timedelta(weeks=w + 1)
        end = datetime.utcnow() - timedelta(weeks=w)
        week_sessions = [
            z for z in zen_sessions
            if z.created_at and start <= z.created_at <= end
        ]
        zen_weekly.append({
            "week": f"Sem {8 - w}",
            "count": len(week_sessions),
            "total": sum(z.duration_min or 0 for z in week_sessions),
        })

    member_since = user.created_at.strftime("%Y-%m-%d") if user.created_at else None

    return ReportSummaryOut(
        total_workouts=total_workouts,
        total_meals=total_meals,
        total_zen_sessions=total_zen,
        total_plans=total_plans,
        total_workout_minutes=total_workout_min,
        total_calories=total_calories,
        total_zen_minutes=total_zen_min,
        avg_calories_per_day=avg_cal,
        avg_workout_duration=avg_workout,
        workout_streak=workout_streak,
        zen_streak=zen_streak,
        most_common_mood_before=most_mood_before,
        most_common_mood_after=most_mood_after,
        workouts_by_week=workouts_by_week,
        calories_by_week=calories_by_week,
        zen_by_week=zen_weekly,
        mood_distribution=mood_distribution,
        member_since=member_since,
    )
