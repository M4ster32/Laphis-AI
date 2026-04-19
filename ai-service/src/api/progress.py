"""
API de Progresso — Snapshots periódicos + Insights
Recolhe e agrega métricas do utilizador para alimentar a futura camada de IA.
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from collections import Counter
import jwt
import os
from ..core.db import get_db
from ..core.models import (
    User, Profile, WorkoutLog, MealLog, Plan, ZenSession,
    WeightEntry, ProgressSnapshot,
)
from ..core.schemas import ProgressSnapshotOut, ProgressInsightsOut

router = APIRouter(prefix="/progress", tags=["progress"])

SECRET_KEY = os.getenv("SECRET_KEY", "laphis-secret-key-change-in-production")
ALGORITHM = "HS256"

MOOD_SCORES = {
    "calm": 4, "happy": 5, "energetic": 4,
    "neutral": 3, "tired": 2, "stressed": 1, "anxious": 1,
}


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


def _calc_streak(dates_list):
    """Calcula streak de dias consecutivos"""
    if not dates_list:
        return 0
    unique = sorted(set(dates_list), reverse=True)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")
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


def _build_snapshot(profile: Profile, db: Session, period_days: int = 7) -> dict:
    """
    Constrói um snapshot agregando dados da última semana (ou período configurável).
    Retorna um dict pronto para criar o modelo ProgressSnapshot.
    """
    now = datetime.now(timezone.utc)
    start_date = (now - timedelta(days=period_days)).strftime("%Y-%m-%d")
    today = now.strftime("%Y-%m-%d")

    # Treinos da semana
    workouts = (
        db.query(WorkoutLog)
        .filter(WorkoutLog.profile_id == profile.id, WorkoutLog.date >= start_date)
        .all()
    )
    total_workout_min = sum(w.duration_min or 0 for w in workouts)
    total_cal_burned = sum(w.calories or 0 for w in workouts)

    # Refeições da semana
    meals = (
        db.query(MealLog)
        .filter(MealLog.profile_id == profile.id, MealLog.date >= start_date)
        .all()
    )
    meal_days = len(set(m.date for m in meals if m.date))
    total_meal_cal = sum(m.calories or 0 for m in meals)
    total_protein = sum(m.protein_g or 0 for m in meals)
    avg_cal = round(total_meal_cal / meal_days) if meal_days > 0 else 0
    avg_prot = round(total_protein / meal_days) if meal_days > 0 else 0

    # Zen da semana
    zen_sessions = (
        db.query(ZenSession)
        .filter(
            ZenSession.user_id == profile.user_id,
            ZenSession.created_at >= now - timedelta(days=period_days),
        )
        .all()
    )
    mood_scores = [MOOD_SCORES.get(z.mood_after, 3) for z in zen_sessions if z.mood_after]
    avg_mood = round(sum(mood_scores) / len(mood_scores), 1) if mood_scores else None

    # Peso mais recente
    weight = (
        db.query(WeightEntry)
        .filter(WeightEntry.user_id == profile.user_id)
        .order_by(WeightEntry.date.desc())
        .first()
    )

    # Streak de treinos
    all_workout_dates = [
        w.date for w in
        db.query(WorkoutLog).filter(WorkoutLog.profile_id == profile.id).all()
        if w.date
    ]
    streak = _calc_streak(all_workout_dates)

    # Plano ativo mais recente
    active_plan = (
        db.query(Plan)
        .filter(Plan.profile_id == profile.id, Plan.status == "active")
        .order_by(Plan.updated_at.desc())
        .first()
    )

    # Aderência: treinos feitos vs dias planeados
    adherence = None
    if profile.days_per_week and period_days >= 7:
        expected = profile.days_per_week
        adherence = round(min(len(workouts) / expected * 100, 100), 1) if expected > 0 else None

    return {
        "profile_id": profile.id,
        "date": today,
        "weight_kg": weight.weight_kg if weight else profile.weight_kg,
        "body_fat_pct": None,
        "workouts_count": len(workouts),
        "total_workout_min": total_workout_min,
        "total_calories_burned": total_cal_burned,
        "meals_count": len(meals),
        "avg_daily_calories": avg_cal,
        "avg_daily_protein_g": avg_prot,
        "zen_sessions_count": len(zen_sessions),
        "avg_mood_score": avg_mood,
        "sleep_hours": None,
        "workout_streak": streak,
        "adherence_pct": adherence,
        "goal_at_time": profile.goal,
        "level_at_time": profile.level,
        "active_plan_id": active_plan.id if active_plan else None,
    }


# ==================== ENDPOINTS ====================

@router.post("/snapshot", response_model=ProgressSnapshotOut)
def create_snapshot(token: str = None, db: Session = Depends(get_db)):
    """
    Cria um snapshot das métricas actuais do utilizador.
    Pode ser chamado manualmente ou por um scheduler futuro.
    """
    user_id = _get_user_id(token)
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")

    data = _build_snapshot(profile, db)
    snapshot = ProgressSnapshot(**data)
    db.add(snapshot)
    db.commit()
    db.refresh(snapshot)
    return ProgressSnapshotOut.model_validate(snapshot)


@router.get("/snapshots", response_model=list[ProgressSnapshotOut])
def list_snapshots(
    token: str = None,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    """Lista snapshots do utilizador (mais recentes primeiro)."""
    user_id = _get_user_id(token)
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")

    snapshots = (
        db.query(ProgressSnapshot)
        .filter(ProgressSnapshot.profile_id == profile.id)
        .order_by(ProgressSnapshot.date.desc())
        .limit(limit)
        .all()
    )
    return [ProgressSnapshotOut.model_validate(s) for s in snapshots]


@router.get("/insights", response_model=ProgressInsightsOut)
def get_insights(token: str = None, db: Session = Depends(get_db)):
    """
    Gera insights comparando o snapshot mais recente com o anterior.
    Se não existem snapshots, cria um em tempo real.
    """
    user_id = _get_user_id(token)
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")

    snapshots = (
        db.query(ProgressSnapshot)
        .filter(ProgressSnapshot.profile_id == profile.id)
        .order_by(ProgressSnapshot.date.desc())
        .limit(2)
        .all()
    )

    total_count = (
        db.query(ProgressSnapshot)
        .filter(ProgressSnapshot.profile_id == profile.id)
        .count()
    )

    # Se não há snapshots, gerar um em tempo real (sem persistir)
    if not snapshots:
        live_data = _build_snapshot(profile, db)
        highlights, suggestions = _analyze_single(live_data, profile)
        return ProgressInsightsOut(
            current_snapshot=None,
            previous_snapshot=None,
            trend_direction="stable",
            highlights=highlights,
            suggestions=suggestions,
            snapshots_count=0,
        )

    current = snapshots[0]
    previous = snapshots[1] if len(snapshots) > 1 else None

    current_out = ProgressSnapshotOut.model_validate(current)
    previous_out = ProgressSnapshotOut.model_validate(previous) if previous else None

    highlights, suggestions, trend = _compare_snapshots(current, previous, profile)

    return ProgressInsightsOut(
        current_snapshot=current_out,
        previous_snapshot=previous_out,
        trend_direction=trend,
        highlights=highlights,
        suggestions=suggestions,
        snapshots_count=total_count,
    )


# ==================== ANÁLISE HEURÍSTICA ====================

def _analyze_single(data: dict, profile: Profile):
    """Análise quando só existe um ponto de dados."""
    highlights = []
    suggestions = []

    if data["workouts_count"] > 0:
        highlights.append(f"{data['workouts_count']} treinos esta semana ({data['total_workout_min']} min)")
    else:
        highlights.append("Nenhum treino registado esta semana")
        suggestions.append("Tenta registar os teus treinos para acompanhar a evolução.")

    if data["adherence_pct"] is not None:
        highlights.append(f"Aderência ao plano: {data['adherence_pct']}%")
        if data["adherence_pct"] < 50:
            suggestions.append("A aderência está abaixo de 50%. Talvez o plano precise de ajuste.")

    if data["avg_daily_calories"] > 0:
        highlights.append(f"Média de {data['avg_daily_calories']} cal/dia")

    if data["workout_streak"] > 0:
        highlights.append(f"Streak atual: {data['workout_streak']} dias consecutivos")

    if not suggestions:
        suggestions.append("Continua a registar treinos e refeições para obter insights mais detalhados.")

    return highlights, suggestions


def _compare_snapshots(current: ProgressSnapshot, previous, profile: Profile):
    """
    Compara dois snapshots e gera insights + sugestões heurísticas.
    """
    highlights = []
    suggestions = []
    scores = []  # positivo = melhoria, negativo = regressão

    if previous is None:
        # Só temos um snapshot — análise simples
        h, s = _analyze_single({
            "workouts_count": current.workouts_count,
            "total_workout_min": current.total_workout_min,
            "adherence_pct": current.adherence_pct,
            "avg_daily_calories": current.avg_daily_calories,
            "workout_streak": current.workout_streak,
        }, profile)
        return h, s, "stable"

    # ---- Peso ----
    if current.weight_kg and previous.weight_kg:
        diff = round(current.weight_kg - previous.weight_kg, 1)
        if abs(diff) >= 0.1:
            direction = "desceu" if diff < 0 else "subiu"
            highlights.append(f"Peso {direction} {abs(diff)} kg")
            if profile.goal == "perder_gordura":
                scores.append(1 if diff < 0 else -1)
            elif profile.goal == "ganhar_massa":
                scores.append(1 if diff > 0 else -1)

    # ---- Volume de treino ----
    w_diff = current.workouts_count - previous.workouts_count
    if w_diff != 0:
        direction = "mais" if w_diff > 0 else "menos"
        highlights.append(f"{abs(w_diff)} {direction} treino(s) que a semana anterior")
        scores.append(1 if w_diff > 0 else -1)
    elif current.workouts_count > 0:
        highlights.append(f"Volume estável: {current.workouts_count} treinos")

    # ---- Aderência ----
    if current.adherence_pct is not None:
        highlights.append(f"Aderência: {current.adherence_pct}%")
        if current.adherence_pct >= 80:
            scores.append(1)
        elif current.adherence_pct < 50:
            scores.append(-1)
            suggestions.append("Aderência abaixo de 50% — considera reduzir dias de treino ou simplificar o plano.")

    # ---- Calorias ----
    if current.avg_daily_calories and previous.avg_daily_calories:
        cal_diff = current.avg_daily_calories - previous.avg_daily_calories
        if abs(cal_diff) >= 100:
            direction = "aumentaram" if cal_diff > 0 else "diminuíram"
            highlights.append(f"Calorias médias {direction} {abs(cal_diff)} cal/dia")

    # ---- Streak ----
    if current.workout_streak >= 7:
        highlights.append(f"Streak impressionante: {current.workout_streak} dias!")
        suggestions.append("Excelente consistência! Considera um deload se sentires fadiga acumulada.")
    elif current.workout_streak == 0 and previous.workout_streak > 3:
        suggestions.append("Perdeste o teu streak. Não desanimes — recomeça hoje!")

    # ---- Mood ----
    if current.avg_mood_score and previous.avg_mood_score:
        mood_diff = current.avg_mood_score - previous.avg_mood_score
        if mood_diff >= 0.5:
            highlights.append("Humor melhorou desde a última semana")
            scores.append(1)
        elif mood_diff <= -0.5:
            highlights.append("Humor desceu um pouco")
            suggestions.append("O teu humor desceu. Experimenta uma sessão Zen ou reduz intensidade.")
            scores.append(-1)

    # ---- Estagnação ----
    if (current.workouts_count > 0 and previous.workouts_count > 0 and
            current.total_workout_min == previous.total_workout_min and
            current.total_calories_burned == previous.total_calories_burned):
        suggestions.append("Os teus números estão iguais há 2 semanas. Podes precisar de variar o estímulo.")

    # ---- Sugestões gerais baseadas no objetivo ----
    if not suggestions:
        if profile.goal == "perder_gordura" and current.avg_daily_calories > 0:
            suggestions.append("Mantém o défice calórico e a consistência — os resultados vêm.")
        elif profile.goal == "ganhar_massa":
            suggestions.append("Garante proteína suficiente e progressão de carga nos exercícios compostos.")
        else:
            suggestions.append("Bom trabalho! Continua a manter a consistência.")

    # ---- Tendência geral ----
    if sum(scores) > 0:
        trend = "improving"
    elif sum(scores) < 0:
        trend = "declining"
    else:
        trend = "stable"

    return highlights, suggestions, trend
