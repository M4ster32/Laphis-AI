"""
API de Chat — Histórico de mensagens
Endpoints para listar e consultar histórico de chat
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from ..core.db import get_db
from ..core.models import Profile, ChatMessage, User
from ..core.schemas import ChatHistoryOut, ChatMessageOut

router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/{profile_id}", response_model=ChatHistoryOut)
def get_chat_history(
    profile_id: int,
    page: int = 1,
    per_page: int = 50,
    db: Session = Depends(get_db),
):
    """
    Obtém histórico de chat paginado para um perfil.
    Retorna mensagens ordenadas por data (mais antigas primeiro para display correto).
    """
    # Verificar se o perfil existe e obter user_id
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    user_id = profile.user_id

    # Contar total de mensagens
    total = db.query(ChatMessage).filter(ChatMessage.user_id == user_id).count()

    # Buscar mensagens com paginação (mais recentes primeiro para paginação, depois inverter)
    offset = (page - 1) * per_page
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == user_id)
        .order_by(ChatMessage.created_at.desc())
        .offset(offset)
        .limit(per_page)
        .all()
    )

    # Inverter para ordem cronológica (mais antigas primeiro) no display
    messages.reverse()

    return ChatHistoryOut(
        messages=[ChatMessageOut.model_validate(m) for m in messages],
        total=total,
        page=page,
        per_page=per_page,
    )
