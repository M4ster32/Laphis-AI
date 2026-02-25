from fastapi import APIRouter
from pydantic import BaseModel
from pathlib import Path
import re

router = APIRouter()

UPLOAD_DIR = Path("src/uploads")

class AskRequest(BaseModel):
    question: str

def tokenize(text: str) -> list[str]:
    return re.findall(r"[a-zA-ZÀ-ÿ0-9]+", text.lower())

def score_chunk(chunk: str, q_tokens: set[str]) -> int:
    c = chunk.lower()
    return sum(1 for t in q_tokens if t in c)

def chunk_text(text: str, max_chars: int = 1200, overlap: int = 200) -> list[str]:
    chunks = []
    i = 0
    while i < len(text):
        chunk = text[i:i+max_chars]
        chunks.append(chunk)
        i += (max_chars - overlap)
    return chunks

def format_bullets(text: str, max_points: int = 6) -> list[str]:
    # tenta apanhar linhas “boas”
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    bullets = []
    for l in lines:
        if len(l) < 20:
            continue
        bullets.append(l)
        if len(bullets) >= max_points:
            break

    # fallback: se não houver linhas úteis, corta em frases
    if not bullets:
        sentences = re.split(r"(?<=[.!?])\s+", " ".join(lines))
        for s in sentences:
            s = s.strip()
            if len(s) < 25:
                continue
            bullets.append(s)
            if len(bullets) >= max_points:
                break

    return bullets[:max_points]

@router.post("/ask")
def ask(req: AskRequest):
    question = req.question.strip()
    if not question:
        return {"answer": "Faz uma pergunta primeiro.", "source": None}

    txt_files = list(UPLOAD_DIR.glob("*.txt"))
    if not txt_files:
        return {"answer": "Ainda não há documentos carregados.", "source": None}

    q_tokens = set(tokenize(question))
    best = None  # (score, filename, chunk)

    for txt_file in txt_files:
        content = txt_file.read_text(encoding="utf-8", errors="ignore")
        chunks = chunk_text(content)

        for ch in chunks:
            s = score_chunk(ch, q_tokens)
            if best is None or s > best[0]:
                best = (s, txt_file.name, ch)

    if best is None or best[0] == 0:
        return {
            "answer": "Não encontrei nada relevante nos teus documentos para essa pergunta.",
            "source": None
        }

    _, filename, best_chunk = best
    bullets = format_bullets(best_chunk)

    # resposta curta e legível
    answer_lines = ["Resumo baseado nos teus apontamentos:"]
    for b in bullets:
        answer_lines.append(f"- {b}")

    return {
        "answer": "\n".join(answer_lines),
        "source": filename,
        "evidence_excerpt": best_chunk[:500].replace("\n", " ")
    }