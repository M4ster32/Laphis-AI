from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone, date as date_cls
import jwt, os, logging
from ..core.db import get_db
from ..core.models import (
    Profile, ChatMessage, ChatSession, User, AdaptationLog,
    WorkoutLog, MealLog, WeightEntry, WaterLog,
)
from ..core.schemas import AskIn, AskOut, ProfileOut
from ..core.recommender import recommend
from ..core.ai_engine import (
    is_ai_available, ai_chat, _build_recent_activity_context,
)

logger = logging.getLogger("laphis.ask")

router = APIRouter(prefix="/ask", tags=["ask"])

SECRET_KEY = os.getenv("SECRET_KEY", "laphis-secret-key-change-in-production")
ALGORITHM = "HS256"
SESSION_TTL_DAYS = 7


def _load_profile(profile_id: int, db: Session) -> Profile:
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


def _load_recent_activity(profile: Profile, db: Session) -> str:
    """
    Assemble a week of recent activity (workouts, meals, weight, water) into
    a compact text block for the AI. We keep it small on purpose — the model
    only needs enough to say "I see you trained 3× this week" without us
    paying for a 5k-token prompt.

    :returns: Text block ready to inject, or empty string if no data.
    """
    today = date_cls.today()
    week_ago_str = (today - timedelta(days=7)).isoformat()

    workouts = (
        db.query(WorkoutLog)
        .filter(WorkoutLog.profile_id == profile.id,
                WorkoutLog.date >= week_ago_str)
        .order_by(WorkoutLog.date.desc())
        .limit(14)
        .all()
    )
    meals = (
        db.query(MealLog)
        .filter(MealLog.profile_id == profile.id,
                MealLog.date >= week_ago_str)
        .order_by(MealLog.date.desc())
        .limit(28)
        .all()
    )
    weights = (
        db.query(WeightEntry)
        .filter(WeightEntry.user_id == profile.user_id,
                WeightEntry.date >= (today - timedelta(days=30)).isoformat())
        .order_by(WeightEntry.date.asc())
        .limit(10)
        .all()
    )
    water_today = (
        db.query(WaterLog)
        .filter(WaterLog.user_id == profile.user_id,
                WaterLog.date == today.isoformat())
        .first()
    )

    return _build_recent_activity_context(
        recent_workouts=[
            {"description": w.description, "duration_min": w.duration_min,
             "calories": w.calories, "date": w.date}
            for w in workouts
        ],
        recent_meals=[
            {"foods": m.foods, "calories": m.calories, "meal_type": m.meal, "date": m.date}
            for m in meals
        ],
        recent_weight=[
            {"weight_kg": w.weight_kg, "date": w.date} for w in weights
        ],
        water_today=water_today.glasses if water_today else None,
    )


def _get_or_create_session(user_id: int, session_id: int | None, db: Session) -> ChatSession:
    now = datetime.now(timezone.utc)
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
async def ask(payload: AskIn, db: Session = Depends(get_db)):
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

    session_id = getattr(payload, 'session_id', None)
    session = _get_or_create_session(profile.user_id, session_id, db)

    # Buscar histórico de chat para contexto (últimas 8 mensagens da sessão)
    chat_history = []
    if session:
        recent_msgs = (
            db.query(ChatMessage)
            .filter(ChatMessage.session_id == session.id)
            .order_by(ChatMessage.created_at.desc())
            .limit(8)
            .all()
        )
        recent_msgs.reverse()
        chat_history = [{"role": m.role, "content": m.content} for m in recent_msgs]

    # Buscar sugestões de adaptação pendentes para contexto
    pending_suggestions = (
        db.query(AdaptationLog)
        .filter(AdaptationLog.profile_id == profile.id, AdaptationLog.status == "pending")
        .order_by(AdaptationLog.created_at.desc())
        .limit(5)
        .all()
    )
    adaptation_ctx = ""
    if pending_suggestions:
        lines = ["SUGESTÕES DE ADAPTAÇÃO PENDENTES (baseadas no progresso do utilizador):"]
        for i, s in enumerate(pending_suggestions, 1):
            lines.append(f"{i}. [{s.adaptation_type}] {s.reason}")
        lines.append("\nSe a pergunta do utilizador for sobre progresso, adaptação ou sugestões, "
                     "apresenta estas sugestões de forma natural e amigável. "
                     "Caso contrário, responde normalmente à pergunta.")
        adaptation_ctx = "\n".join(lines)

    # Build the recent-activity snapshot once — used by the AI path and also
    # kept around in case the recommender fallback wants to reference it.
    recent_activity_ctx = _load_recent_activity(profile, db)

    # Try real AI first, fall back to rule-based recommender on any failure.
    ai_used = False
    if is_ai_available():
        try:
            title, bullets = await ai_chat(
                profile,
                payload.question,
                chat_history=chat_history,
                adaptation_ctx=adaptation_ctx,
                recent_activity_ctx=recent_activity_ctx,
            )
            ai_used = True
            logger.info("AI chat response generated for profile %d", profile.id)
        except Exception as e:
            logger.warning("AI chat failed, falling back to recommender: %s", e)
            title, bullets = recommend(profile_out, payload.question)
    else:
        title, bullets = recommend(profile_out, payload.question)

    # Se o recommender respondeu mas há sugestões pendentes e a pergunta é sobre progresso/adaptação,
    # enriquecer a resposta com as sugestões
    q_lower = payload.question.lower()
    progress_keywords = ["progresso", "adaptação", "adaptacao", "sugestão", "sugestões", "sugestoes",
                         "analisa", "análise", "melhorar", "evolução", "evolucao"]
    if not ai_used and pending_suggestions and any(kw in q_lower for kw in progress_keywords):
        name = getattr(profile, "name", "").split()[0] if getattr(profile, "name", "") else "atleta"
        title = f"📊 Sugestões de Adaptação — {name}"
        bullets = [
            f"Com base no teu progresso, tenho {len(pending_suggestions)} sugestão(ões) para ti:",
            "",
        ]
        for s in pending_suggestions:
            type_label = {
                "increase_volume": "📈 Aumentar volume",
                "decrease_intensity": "📉 Reduzir intensidade",
                "change_split": "🔄 Alterar plano",
                "level_up": "⬆️ Subir de nível",
                "general_advice": "💡 Conselho geral",
            }.get(s.adaptation_type, "💡 Sugestão")
            bullets.append(f"{type_label}: {s.reason}")
            bullets.append("")
        bullets.append("Pergunta-me mais detalhes sobre qualquer uma destas sugestões!")

    ai_text = f"{title}\n\n" + "\n".join(f"• {b}" if b and not b.startswith("•") else b for b in bullets)

    if session.title == "Nova conversa" and len(payload.question) > 3:
        session.title = payload.question[:80]

    user_msg = ChatMessage(
        user_id=profile.user_id,
        session_id=session.id,
        role="user",
        content=payload.question,
        created_at=datetime.now(timezone.utc),
    )
    db.add(user_msg)

    ai_msg = ChatMessage(
        user_id=profile.user_id,
        session_id=session.id,
        role="assistant",
        content=ai_text,
        created_at=datetime.now(timezone.utc),
    )
    db.add(ai_msg)
    db.commit()

    disclaimer = (
        "Resposta gerada por IA — não substitui aconselhamento médico/nutricional."
        if ai_used else
        "Isto é uma sugestão geral e não substitui aconselhamento médico/nutricional."
    )

    return AskOut(
        title=title,
        bullets=bullets,
        disclaimer=disclaimer,
        session_id=session.id,
    )