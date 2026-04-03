import os
from fastapi import APIRouter
from ..core.ai_engine import is_ai_available, CHAT_MODEL

router = APIRouter()

@router.get("/health")
def health():
    ai_ready = is_ai_available()
    return {
        "status": "ok",
        "ai_enabled": ai_ready,
        "ai_model": CHAT_MODEL if ai_ready else None,
        "openai_key_set": bool(os.getenv("OPENAI_API_KEY", "")),
        "mode": "ai" if ai_ready else "rule-based",
    }