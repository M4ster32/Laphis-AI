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
from ..core.models import User, Profile, WorkoutLog, MealLog, Plan, ZenSession, ChatMessage, WeeklySummary, WaterLog
from ..core.schemas import ReportSummaryOut, WeeklySummaryOut

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


# ==================== WEEKLY AI SUMMARY ====================

def _generate_weekly_summary_text(workouts, meals, zen_sessions, water_logs, plans, profile):
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    week_str = lambda d: d.strftime("%Y-%m-%d")

    w_week = [w for w in workouts if w.date and w.date >= week_str(week_ago)]
    m_week = [m for m in meals if m.date and m.date >= week_str(week_ago)]
    z_week = [z for z in zen_sessions if z.created_at and z.created_at >= week_ago]
    water_week = [wl for wl in water_logs if wl.date and wl.date >= week_str(week_ago)]

    total_w = len(w_week)
    total_min = sum(w.duration_min or 0 for w in w_week)
    total_cal_burned = sum(w.calories or 0 for w in w_week)
    total_meals_count = len(m_week)
    total_cal_eaten = sum(m.calories or 0 for m in m_week)
    total_protein = sum(m.protein_g or 0 for m in m_week)
    total_zen = len(z_week)
    total_zen_min = sum(z.duration_min or 0 for z in z_week)
    total_water_glasses = sum(wl.glasses or 0 for wl in water_week)

    stats = {
        "treinos": total_w,
        "minutos_treino": total_min,
        "calorias_queimadas": total_cal_burned,
        "refeicoes": total_meals_count,
        "calorias_ingeridas": total_cal_eaten,
        "proteina_g": total_protein,
        "sessoes_zen": total_zen,
        "minutos_zen": total_zen_min,
        "copos_agua": total_water_glasses,
    }

    highlights = []
    suggestions = []

    goal_label = {
        "perder_gordura": "perder gordura",
        "ganhar_massa": "ganhar massa muscular",
        "manter": "manter a forma",
    }.get(profile.goal if profile else "", "melhorar a saúde") if profile else "melhorar a saúde"

    name = profile.name if profile else "Utilizador"
    days_target = profile.days_per_week if profile else 3

    if total_w >= days_target:
        highlights.append(f"Cumpriste o objetivo de {days_target} treinos por semana com {total_w} sessões!")
    elif total_w > 0:
        highlights.append(f"Fizeste {total_w} treino{'s' if total_w > 1 else ''} esta semana (objetivo: {days_target})")
        suggestions.append(f"Tenta encaixar mais {days_target - total_w} treino{'s' if (days_target - total_w) > 1 else ''} para atingires o teu objetivo")

    if total_min > 0:
        highlights.append(f"Total de {total_min} minutos de treino")
    if total_zen > 0:
        highlights.append(f"{total_zen} sessão/sessões zen ({total_zen_min} min de mindfulness)")
    if total_water_glasses > 0:
        avg_water = round(total_water_glasses / 7, 1)
        highlights.append(f"Média de {avg_water} copos de água por dia")
        if avg_water < 6:
            suggestions.append("Tenta beber pelo menos 8 copos de água por dia")

    if total_meals_count == 0:
        suggestions.append("Regista as tuas refeições para acompanhar a nutrição")
    elif total_cal_eaten > 0:
        avg_cal_day = round(total_cal_eaten / 7)
        highlights.append(f"Média de {avg_cal_day} kcal/dia")

    if total_w == 0:
        suggestions.append("Não registaste treinos esta semana — começa com uma sessão leve!")
    if total_zen == 0:
        suggestions.append("Experimenta uma sessão de respiração ou meditação para o teu bem-estar")

    summary_parts = [f"Olá {name}! Aqui está o teu resumo semanal:"]

    if highlights:
        summary_parts.append("\n📊 Destaques:")
        for h in highlights:
            summary_parts.append(f"  • {h}")

    if suggestions:
        summary_parts.append("\n💡 Sugestões:")
        for s in suggestions:
            summary_parts.append(f"  • {s}")

    if profile:
        summary_parts.append(f"\nContinua focado no teu objetivo de {goal_label}. Bom trabalho! 💪")

    summary_text = "\n".join(summary_parts)
    return summary_text, highlights, suggestions, stats


@router.get("/weekly-summary", response_model=WeeklySummaryOut)
def get_weekly_summary(token: str = None, db: Session = Depends(get_db)):
    user_id = _get_user_id(token)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")

    now = datetime.utcnow()
    week_start = (now - timedelta(days=now.weekday())).strftime("%Y-%m-%d")
    week_end = (now - timedelta(days=now.weekday()) + timedelta(days=6)).strftime("%Y-%m-%d")

    existing = (
        db.query(WeeklySummary)
        .filter(WeeklySummary.user_id == user_id, WeeklySummary.week_start == week_start)
        .first()
    )
    if existing:
        return existing

    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    profile_id = profile.id if profile else None

    workouts = db.query(WorkoutLog).filter(WorkoutLog.profile_id == profile_id).all() if profile_id else []
    meals = db.query(MealLog).filter(MealLog.profile_id == profile_id).all() if profile_id else []
    zen_sessions = db.query(ZenSession).filter(ZenSession.user_id == user_id).all()
    water_logs = db.query(WaterLog).filter(WaterLog.user_id == user_id).all()
    plans = db.query(Plan).filter(Plan.profile_id == profile_id).all() if profile_id else []

    summary_text, highlights, suggestions, stats = _generate_weekly_summary_text(
        workouts, meals, zen_sessions, water_logs, plans, profile
    )

    summary = WeeklySummary(
        user_id=user_id,
        week_start=week_start,
        week_end=week_end,
        summary_text=summary_text,
        highlights=highlights,
        suggestions=suggestions,
        stats=stats,
    )
    db.add(summary)
    db.commit()
    db.refresh(summary)
    return summary


@router.post("/weekly-summary/refresh", response_model=WeeklySummaryOut)
def refresh_weekly_summary(token: str = None, db: Session = Depends(get_db)):
    user_id = _get_user_id(token)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")

    now = datetime.utcnow()
    week_start = (now - timedelta(days=now.weekday())).strftime("%Y-%m-%d")
    week_end = (now - timedelta(days=now.weekday()) + timedelta(days=6)).strftime("%Y-%m-%d")

    existing = (
        db.query(WeeklySummary)
        .filter(WeeklySummary.user_id == user_id, WeeklySummary.week_start == week_start)
        .first()
    )
    if existing:
        db.delete(existing)
        db.commit()

    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    profile_id = profile.id if profile else None

    workouts = db.query(WorkoutLog).filter(WorkoutLog.profile_id == profile_id).all() if profile_id else []
    meals = db.query(MealLog).filter(MealLog.profile_id == profile_id).all() if profile_id else []
    zen_sessions = db.query(ZenSession).filter(ZenSession.user_id == user_id).all()
    water_logs = db.query(WaterLog).filter(WaterLog.user_id == user_id).all()
    plans = db.query(Plan).filter(Plan.profile_id == profile_id).all() if profile_id else []

    summary_text, highlights, suggestions, stats = _generate_weekly_summary_text(
        workouts, meals, zen_sessions, water_logs, plans, profile
    )

    summary = WeeklySummary(
        user_id=user_id,
        week_start=week_start,
        week_end=week_end,
        summary_text=summary_text,
        highlights=highlights,
        suggestions=suggestions,
        stats=stats,
    )
    db.add(summary)
    db.commit()
    db.refresh(summary)
    return summary
