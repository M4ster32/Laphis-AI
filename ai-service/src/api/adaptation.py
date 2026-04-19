"""
API de Adaptação — Feedback de planos + Motor heurístico + AI análise
Combina heurísticas simples com IA (OpenAI) quando disponível.
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import jwt
import os
import logging
from ..core.db import get_db
from ..core.models import (
    User, Profile, Plan, PlanFeedback, AdaptationLog, ProgressSnapshot,
    WorkoutLog, MealLog,
)
from ..core.schemas import (
    PlanFeedbackIn, PlanFeedbackOut,
    AdaptationLogOut, AdaptationRespondIn,
)
from ..core.ai_engine import is_ai_available, ai_adaptation_analysis

logger = logging.getLogger("laphis.adaptation")

router = APIRouter(prefix="/adaptation", tags=["adaptation"])

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


def _get_profile(user_id: int, db: Session) -> Profile:
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    return profile


# ==================== FEEDBACK ENDPOINTS ====================

@router.post("/feedback", response_model=PlanFeedbackOut)
def submit_feedback(
    payload: PlanFeedbackIn,
    token: str = None,
    db: Session = Depends(get_db),
):
    """
    Submeter feedback sobre um plano.
    Após submissão, dispara análise heurística simples.
    """
    user_id = _get_user_id(token)
    profile = _get_profile(user_id, db)

    # Verificar que o plano existe e pertence ao utilizador
    plan = db.query(Plan).filter(Plan.id == payload.plan_id, Plan.profile_id == profile.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plano não encontrado")

    # Verificar se já deu feedback a este plano
    existing = (
        db.query(PlanFeedback)
        .filter(PlanFeedback.plan_id == payload.plan_id, PlanFeedback.profile_id == profile.id)
        .first()
    )
    if existing:
        # Atualizar em vez de criar novo
        existing.rating = payload.rating
        existing.difficulty_rating = payload.difficulty_rating
        existing.enjoyment_rating = payload.enjoyment_rating
        existing.effectiveness_rating = payload.effectiveness_rating
        existing.comment = payload.comment
        existing.tags = payload.tags
        existing.completed_pct = payload.completed_pct
        existing.weeks_followed = payload.weeks_followed
        existing.created_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing)

        # Disparar análise heurística
        _analyze_feedback_and_suggest(existing, profile, plan, db)

        return PlanFeedbackOut.model_validate(existing)

    feedback = PlanFeedback(
        plan_id=payload.plan_id,
        profile_id=profile.id,
        rating=payload.rating,
        difficulty_rating=payload.difficulty_rating,
        enjoyment_rating=payload.enjoyment_rating,
        effectiveness_rating=payload.effectiveness_rating,
        comment=payload.comment,
        tags=payload.tags,
        completed_pct=payload.completed_pct,
        weeks_followed=payload.weeks_followed,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    # Disparar análise heurística
    _analyze_feedback_and_suggest(feedback, profile, plan, db)

    return PlanFeedbackOut.model_validate(feedback)


@router.get("/feedback/{plan_id}", response_model=PlanFeedbackOut)
def get_feedback(plan_id: int, token: str = None, db: Session = Depends(get_db)):
    """Obter feedback do utilizador para um plano específico."""
    user_id = _get_user_id(token)
    profile = _get_profile(user_id, db)

    feedback = (
        db.query(PlanFeedback)
        .filter(PlanFeedback.plan_id == plan_id, PlanFeedback.profile_id == profile.id)
        .first()
    )
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback não encontrado")
    return PlanFeedbackOut.model_validate(feedback)


@router.get("/feedback", response_model=list[PlanFeedbackOut])
def list_feedback(token: str = None, limit: int = 20, db: Session = Depends(get_db)):
    """Lista todo o feedback do utilizador."""
    user_id = _get_user_id(token)
    profile = _get_profile(user_id, db)

    items = (
        db.query(PlanFeedback)
        .filter(PlanFeedback.profile_id == profile.id)
        .order_by(PlanFeedback.created_at.desc())
        .limit(limit)
        .all()
    )
    return [PlanFeedbackOut.model_validate(f) for f in items]


# ==================== ADAPTATION LOG ENDPOINTS ====================

@router.get("/suggestions", response_model=list[AdaptationLogOut])
def list_suggestions(
    token: str = None,
    status: str = None,
    limit: int = 10,
    db: Session = Depends(get_db),
):
    """Lista sugestões de adaptação (filtráveis por status)."""
    user_id = _get_user_id(token)
    profile = _get_profile(user_id, db)

    query = db.query(AdaptationLog).filter(AdaptationLog.profile_id == profile.id)
    if status:
        query = query.filter(AdaptationLog.status == status)
    items = query.order_by(AdaptationLog.created_at.desc()).limit(limit).all()
    return [AdaptationLogOut.model_validate(a) for a in items]


@router.put("/suggestions/{suggestion_id}", response_model=AdaptationLogOut)
def respond_to_suggestion(
    suggestion_id: int,
    payload: AdaptationRespondIn,
    token: str = None,
    db: Session = Depends(get_db),
):
    """Utilizador aceita ou rejeita uma sugestão de adaptação."""
    user_id = _get_user_id(token)
    profile = _get_profile(user_id, db)

    suggestion = (
        db.query(AdaptationLog)
        .filter(AdaptationLog.id == suggestion_id, AdaptationLog.profile_id == profile.id)
        .first()
    )
    if not suggestion:
        raise HTTPException(status_code=404, detail="Sugestão não encontrada")

    suggestion.status = payload.status
    suggestion.user_response = payload.user_response
    suggestion.responded_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(suggestion)
    return AdaptationLogOut.model_validate(suggestion)


@router.post("/analyze", response_model=list[AdaptationLogOut])
async def trigger_analysis(token: str = None, db: Session = Depends(get_db)):
    """
    Dispara uma análise completa — usa IA quando disponível,
    com fallback para heurísticas. Cria sugestões baseadas
    nos dados recentes do utilizador.
    """
    user_id = _get_user_id(token)
    profile = _get_profile(user_id, db)

    # Tentar análise por IA primeiro
    if is_ai_available():
        try:
            ai_suggestions = await _run_ai_analysis(profile, db)
            if ai_suggestions:
                return [AdaptationLogOut.model_validate(s) for s in ai_suggestions]
        except Exception as e:
            logger.warning("AI adaptation analysis failed, using heuristics: %s", e)

    # Fallback para heurísticas
    new_suggestions = _run_heuristic_analysis(profile, db)
    return [AdaptationLogOut.model_validate(s) for s in new_suggestions]


# ==================== MOTOR IA (OpenAI) ====================

async def _run_ai_analysis(profile: Profile, db: Session) -> list:
    """
    Análise de adaptação via IA (OpenAI).
    Retorna lista de AdaptationLog criados.
    """
    now = datetime.now(timezone.utc)
    two_weeks_ago = (now - timedelta(days=14)).strftime("%Y-%m-%d")
    one_week_ago = (now - timedelta(days=7)).strftime("%Y-%m-%d")

    workouts_wk1 = (
        db.query(WorkoutLog)
        .filter(WorkoutLog.profile_id == profile.id, WorkoutLog.date >= one_week_ago)
        .all()
    )
    workouts_wk2 = (
        db.query(WorkoutLog)
        .filter(
            WorkoutLog.profile_id == profile.id,
            WorkoutLog.date >= two_weeks_ago,
            WorkoutLog.date < one_week_ago,
        )
        .all()
    )

    workout_data = {
        "wk1_count": len(workouts_wk1),
        "wk2_count": len(workouts_wk2),
        "wk1_minutes": sum(w.duration_min or 0 for w in workouts_wk1),
        "wk2_minutes": sum(w.duration_min or 0 for w in workouts_wk2),
    }

    # Buscar feedback mais recente
    feedback_data = None
    recent_fb = (
        db.query(PlanFeedback)
        .filter(PlanFeedback.profile_id == profile.id)
        .order_by(PlanFeedback.created_at.desc())
        .first()
    )
    if recent_fb:
        feedback_data = {
            "rating": recent_fb.rating,
            "difficulty": recent_fb.difficulty_rating,
            "effectiveness": recent_fb.effectiveness_rating,
            "completed_pct": recent_fb.completed_pct,
            "comment": recent_fb.comment,
        }

    # Chamar IA
    ai_suggestions = await ai_adaptation_analysis(profile, workout_data, feedback_data)

    # Persistir sugestões na BD
    new_logs = []
    for s in ai_suggestions:
        log = AdaptationLog(
            profile_id=profile.id,
            trigger=s.get("trigger", "weekly_review"),
            adaptation_type=s.get("adaptation_type", "general_advice"),
            reason=s.get("reason", "Sugestão da IA"),
            suggestion_json=s.get("suggestion_json", {}),
            status="pending",
        )
        db.add(log)
        new_logs.append(log)

    if new_logs:
        db.commit()
        for log in new_logs:
            db.refresh(log)

    logger.info("AI adaptation analysis: %d suggestions for profile %d", len(new_logs), profile.id)
    return new_logs


# ==================== MOTOR HEURÍSTICO SIMPLES ====================

def _analyze_feedback_and_suggest(
    feedback: PlanFeedback,
    profile: Profile,
    plan: Plan,
    db: Session,
):
    """
    Analisa um feedback individual e cria sugestões se necessário.
    Esta é a lógica mais simples — placeholder para a futura IA.
    """
    suggestions = []

    # Plano demasiado difícil
    if feedback.difficulty_rating and feedback.difficulty_rating >= 4:
        suggestions.append({
            "trigger": "feedback",
            "adaptation_type": "decrease_intensity",
            "reason": f"O plano foi classificado como difícil ({feedback.difficulty_rating}/5). "
                      f"Considera reduzir a intensidade ou o volume de treino.",
            "suggestion_json": {
                "action": "decrease_intensity",
                "from_feedback_id": feedback.id,
                "difficulty_reported": feedback.difficulty_rating,
            },
        })

    # Plano demasiado fácil
    if feedback.difficulty_rating and feedback.difficulty_rating <= 2 and feedback.rating >= 3:
        suggestions.append({
            "trigger": "feedback",
            "adaptation_type": "increase_volume",
            "reason": f"O plano foi classificado como fácil ({feedback.difficulty_rating}/5) "
                      f"mas teve boa avaliação. Podes estar pronto para mais volume/intensidade.",
            "suggestion_json": {
                "action": "increase_volume",
                "from_feedback_id": feedback.id,
                "difficulty_reported": feedback.difficulty_rating,
            },
        })

    # Baixa aderência
    if feedback.completed_pct is not None and feedback.completed_pct < 40:
        suggestions.append({
            "trigger": "feedback",
            "adaptation_type": "change_split",
            "reason": f"Apenas {feedback.completed_pct}% do plano foi completado. "
                      f"Pode ser necessário ajustar o plano à tua disponibilidade.",
            "suggestion_json": {
                "action": "simplify_plan",
                "completed_pct": feedback.completed_pct,
            },
        })

    # Plano classificado como ineficaz
    if feedback.effectiveness_rating and feedback.effectiveness_rating <= 2:
        suggestions.append({
            "trigger": "feedback",
            "adaptation_type": "general_advice",
            "reason": "O plano foi considerado pouco eficaz. Considera gerar um novo plano "
                      "ou ajustar os exercícios/refeições às tuas preferências.",
            "suggestion_json": {
                "action": "regenerate_plan",
                "effectiveness_reported": feedback.effectiveness_rating,
            },
        })

    # Persistir sugestões
    for s in suggestions:
        log = AdaptationLog(
            profile_id=profile.id,
            plan_id=plan.id,
            trigger=s["trigger"],
            adaptation_type=s["adaptation_type"],
            reason=s["reason"],
            suggestion_json=s["suggestion_json"],
            status="pending",
        )
        db.add(log)

    if suggestions:
        db.commit()


def _run_heuristic_analysis(profile: Profile, db: Session) -> list:
    """
    Análise heurística completa baseada em dados recentes.
    Retorna lista de AdaptationLog criados.
    """
    new_logs = []
    now = datetime.now(timezone.utc)
    two_weeks_ago = (now - timedelta(days=14)).strftime("%Y-%m-%d")
    one_week_ago = (now - timedelta(days=7)).strftime("%Y-%m-%d")

    # Dados das últimas 2 semanas divididos por semana
    workouts_wk1 = (
        db.query(WorkoutLog)
        .filter(WorkoutLog.profile_id == profile.id, WorkoutLog.date >= one_week_ago)
        .all()
    )
    workouts_wk2 = (
        db.query(WorkoutLog)
        .filter(
            WorkoutLog.profile_id == profile.id,
            WorkoutLog.date >= two_weeks_ago,
            WorkoutLog.date < one_week_ago,
        )
        .all()
    )

    # Verificar tendência de treinos
    wk1_count = len(workouts_wk1)
    wk2_count = len(workouts_wk2)

    # Estagnação (2 semanas iguais com baixo volume)
    if wk1_count == wk2_count and wk1_count > 0:
        wk1_min = sum(w.duration_min or 0 for w in workouts_wk1)
        wk2_min = sum(w.duration_min or 0 for w in workouts_wk2)
        if abs(wk1_min - wk2_min) < 10:  # menos de 10 min de diferença
            log = AdaptationLog(
                profile_id=profile.id,
                trigger="stagnation",
                adaptation_type="increase_volume",
                reason="O volume de treino manteve-se igual nas últimas 2 semanas. "
                       "Para continuar a progredir, tenta aumentar séries, repetições ou carga.",
                suggestion_json={
                    "wk1_workouts": wk1_count,
                    "wk2_workouts": wk2_count,
                    "wk1_minutes": wk1_min,
                    "wk2_minutes": wk2_min,
                },
                status="pending",
            )
            db.add(log)
            new_logs.append(log)

    # Queda significativa (fez menos de metade)
    if wk2_count > 0 and wk1_count < wk2_count * 0.5:
        log = AdaptationLog(
            profile_id=profile.id,
            trigger="weekly_review",
            adaptation_type="general_advice",
            reason=f"Os treinos caíram de {wk2_count} para {wk1_count} esta semana. "
                   f"Se estás cansado, considera um deload. Se foi falta de tempo, ajusta o plano.",
            suggestion_json={
                "wk1_workouts": wk1_count,
                "wk2_workouts": wk2_count,
            },
            status="pending",
        )
        db.add(log)
        new_logs.append(log)

    # Aderência alta + consistência → sugerir level up
    if (profile.level in ("iniciante", "intermedio") and
            wk1_count >= profile.days_per_week and wk2_count >= profile.days_per_week):
        # Verificar se já houve level_up sugerido recentemente
        recent_levelup = (
            db.query(AdaptationLog)
            .filter(
                AdaptationLog.profile_id == profile.id,
                AdaptationLog.adaptation_type == "level_up",
                AdaptationLog.created_at >= now - timedelta(days=30),
            )
            .first()
        )
        if not recent_levelup:
            next_level = "intermedio" if profile.level == "iniciante" else "avancado"
            log = AdaptationLog(
                profile_id=profile.id,
                trigger="weekly_review",
                adaptation_type="level_up",
                reason=f"Cumpriste o plano completo nas últimas 2 semanas. "
                       f"Podes estar pronto para avançar de '{profile.level}' para '{next_level}'.",
                suggestion_json={
                    "current_level": profile.level,
                    "suggested_level": next_level,
                    "weeks_consistent": 2,
                },
                status="pending",
            )
            db.add(log)
            new_logs.append(log)

    # Sem treinos nenhum nas 2 semanas
    if wk1_count == 0 and wk2_count == 0:
        log = AdaptationLog(
            profile_id=profile.id,
            trigger="weekly_review",
            adaptation_type="general_advice",
            reason="Não registaste treinos nas últimas 2 semanas. "
                   "Se precisas de motivação, fala com o AI Coach. Se mudaste de rotina, atualiza o teu perfil.",
            suggestion_json={"inactive_days": 14},
            status="pending",
        )
        db.add(log)
        new_logs.append(log)

    if new_logs:
        db.commit()
        for log in new_logs:
            db.refresh(log)

    return new_logs
