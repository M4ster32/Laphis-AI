from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from ..core.db import get_db
from ..core.models import Profile, ChatMessage
from ..core.schemas import AskIn, AskOut, ProfileOut
from ..core.recommender import recommend

router = APIRouter(prefix="/ask", tags=["ask"])


def _load_profile(profile_id: int, db: Session) -> Profile:
    """Carregar perfil da base de dados"""
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.post("", response_model=AskOut)
def ask(payload: AskIn, db: Session = Depends(get_db)):
    """Fazer pergunta e obter recomendação da IA — guarda histórico na BD"""
    profile = _load_profile(payload.profile_id, db)
    
    # Converter para ProfileOut para passar ao recommender
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
    
    title, bullets = recommend(profile_out, payload.question)

    ai_text = f"{title}\n\n" + "\n".join(f"• {b}" if b and not b.startswith("•") else b for b in bullets)

    # Guardar mensagem do utilizador
    user_msg = ChatMessage(
        user_id=profile.user_id,
        role="user",
        content=payload.question,
        created_at=datetime.utcnow(),
    )
    db.add(user_msg)

    # Guardar resposta da IA
    ai_msg = ChatMessage(
        user_id=profile.user_id,
        role="assistant",
        content=ai_text,
        created_at=datetime.utcnow(),
    )
    db.add(ai_msg)
    db.commit()

    return AskOut(
        title=title,
        bullets=bullets,
        disclaimer="Isto é uma sugestão geral e não substitui aconselhamento médico/nutricional."
    )