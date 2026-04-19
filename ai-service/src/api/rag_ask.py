"""
LAPHIS RAG: Endpoint /rag/ask
Pergunta à AI com contexto RAG + dados do utilizador.

Fluxo:
1. Recebe pergunta + token do utilizador
2. Busca perfil + dados recentes do utilizador
3. Gera embedding da pergunta
4. Pesquisa semântica nos chunks (pgvector)
5. Constrói prompt com contexto documental + contexto do utilizador
6. Chama OpenAI para gerar resposta
7. Guarda mensagens no chat history
8. Devolve resposta JSON
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from ..core.db import get_db
from ..core.models import User, Profile, ChatMessage, WeightEntry, WaterLog
from ..core.rag import get_single_embedding, semantic_search, generate_answer
from ..api.auth import verify_token

router = APIRouter(prefix="/rag", tags=["rag"])


class RagAskRequest(BaseModel):
    question: str
    categories: Optional[list[str]] = None  # filtrar por categoria
    top_k: Optional[int] = 6                # número de chunks


@router.post("/ask")
async def rag_ask(
    req: RagAskRequest,
    token: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Pergunta à AI com RAG.
    - Requer token de autenticação
    - Usa contexto dos documentos + dados do utilizador
    """
    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Pergunta não pode estar vazia.")
    if len(question) > 2000:
        raise HTTPException(status_code=400, detail="Pergunta demasiado longa (máx 2000 caracteres).")

    # --- Auth ---
    if not token:
        raise HTTPException(status_code=401, detail="Token não fornecido")
    user_id = verify_token(token)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")

    # --- Dados do utilizador ---
    user_data = _get_user_context(db, user_id)

    # --- Embedding da pergunta ---
    try:
        query_embedding = await get_single_embedding(question)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar embedding: {str(e)}")

    # --- Pesquisa semântica ---
    try:
        top_k = min(req.top_k or 6, 10)
        chunks = semantic_search(query_embedding, top_k=top_k, categories=req.categories)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na pesquisa semântica: {str(e)}")

    # --- Histórico de chat (últimas mensagens) ---
    chat_history = _get_recent_chat(db, user_id, limit=6)

    # --- Gerar resposta ---
    try:
        result = await generate_answer(
            question=question,
            doc_chunks=chunks,
            user_data=user_data,
            chat_history=chat_history,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar resposta: {str(e)}")

    # --- Guardar no chat history ---
    _save_chat_messages(db, user_id, question, result["answer"])

    return {
        "answer": result["answer"],
        "sources": result["sources"],
        "chunks_used": result["chunks_used"],
        "model": result["model"],
        "tokens_used": result["tokens_used"],
        "user_context_used": bool(user_data.get("name")),
    }


def _get_user_context(db: Session, user_id: int) -> dict:
    """Junta perfil + dados recentes do utilizador."""
    data = {}

    # Perfil
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if profile:
        data["name"] = profile.name
        data["age"] = profile.age
        data["sex"] = profile.sex
        data["height_cm"] = profile.height_cm
        data["weight_kg"] = profile.weight_kg
        data["goal"] = profile.goal
        data["level"] = profile.level
        data["days_per_week"] = profile.days_per_week

    # Peso mais recente
    recent_weight = (
        db.query(WeightEntry)
        .filter(WeightEntry.user_id == user_id)
        .order_by(WeightEntry.date.desc())
        .first()
    )
    if recent_weight:
        data["recent_weight"] = recent_weight.weight_kg

    # Água de hoje
    from datetime import date as date_type
    today_water = (
        db.query(WaterLog)
        .filter(WaterLog.user_id == user_id, WaterLog.date == str(date_type.today()))
        .first()
    )
    if today_water:
        data["water_today_ml"] = today_water.ml_total

    return data


def _get_recent_chat(db: Session, user_id: int, limit: int = 6) -> list[dict]:
    """Busca últimas mensagens do chat para contexto."""
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == user_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(limit)
        .all()
    )
    # Inverter para ordem cronológica
    messages.reverse()
    return [{"role": m.role, "content": m.content} for m in messages]


def _save_chat_messages(db: Session, user_id: int, question: str, answer: str):
    """Guarda pergunta e resposta no histórico de chat."""
    from datetime import datetime, timezone

    db.add(ChatMessage(user_id=user_id, role="user", content=question, created_at=datetime.now(timezone.utc)))
    db.add(ChatMessage(user_id=user_id, role="assistant", content=answer, created_at=datetime.now(timezone.utc)))
    db.commit()
