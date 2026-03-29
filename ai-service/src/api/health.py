import os
from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
def health():
    has_key = bool(os.getenv("OPENAI_API_KEY", ""))
    return {"status": "ok", "openai_key_set": has_key}