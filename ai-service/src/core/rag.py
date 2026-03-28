"""
LAPHIS RAG Engine
Motor de Retrieval-Augmented Generation:
- Extração de texto de PDFs
- Chunking inteligente
- Embeddings via OpenAI API
- Pesquisa semântica via pgvector no Supabase
- Geração de resposta via OpenAI com contexto
"""
import os
import re
import json
import fitz  # PyMuPDF
import httpx
from typing import Optional

# --------------- CONFIG ---------------

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
EMBEDDING_MODEL = "text-embedding-3-small"  # 1536 dims, barato e bom
CHAT_MODEL = os.getenv("LAPHIS_CHAT_MODEL", "gpt-4o-mini")  # barato e rápido
CHUNK_SIZE = 800       # caracteres por chunk
CHUNK_OVERLAP = 150    # overlap entre chunks
MAX_CONTEXT_CHUNKS = 6 # chunks enviados ao LLM
DATABASE_URL = os.getenv("DATABASE_URL", "")

# --------------- PDF EXTRACTION ---------------

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extrai texto de um PDF (suporta texto nativo e layouts complexos).
    Para PDFs scanned/imagem, retorna string vazia (OCR será fase futura).
    """
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    pages = []
    for page in doc:
        text = page.get_text("text")
        if text.strip():
            pages.append(text)
    doc.close()
    return "\n\n".join(pages)


def clean_text(text: str) -> str:
    """Limpa texto extraído: remove espaços excessivos, linhas vazias..."""
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r' {2,}', ' ', text)
    text = re.sub(r'\t+', ' ', text)
    lines = []
    for line in text.split('\n'):
        stripped = line.strip()
        if stripped:
            lines.append(stripped)
        else:
            lines.append('')
    return '\n'.join(lines).strip()


# --------------- CHUNKING ---------------

def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """
    Divide texto em chunks com overlap.
    Tenta cortar em parágrafos/frases para manter coerência.
    """
    if not text.strip():
        return []

    # Separar por parágrafos
    paragraphs = re.split(r'\n\s*\n', text)

    chunks = []
    current_chunk = ""

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue

        if len(current_chunk) + len(para) + 1 <= chunk_size:
            current_chunk = f"{current_chunk}\n{para}" if current_chunk else para
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            # Se o parágrafo sozinho é maior que chunk_size, dividir por frases
            if len(para) > chunk_size:
                sentences = re.split(r'(?<=[.!?])\s+', para)
                sub_chunk = ""
                for sent in sentences:
                    if len(sub_chunk) + len(sent) + 1 <= chunk_size:
                        sub_chunk = f"{sub_chunk} {sent}" if sub_chunk else sent
                    else:
                        if sub_chunk:
                            chunks.append(sub_chunk.strip())
                        sub_chunk = sent
                current_chunk = sub_chunk
            else:
                current_chunk = para

    if current_chunk.strip():
        chunks.append(current_chunk.strip())

    # Adicionar overlap: cada chunk inclui o final do anterior
    if overlap > 0 and len(chunks) > 1:
        overlapped = [chunks[0]]
        for i in range(1, len(chunks)):
            prev_tail = chunks[i - 1][-overlap:]
            overlapped.append(f"{prev_tail} {chunks[i]}")
        chunks = overlapped

    # Filtrar chunks muito pequenos (< 50 chars)
    chunks = [c for c in chunks if len(c) >= 50]

    return chunks


# --------------- EMBEDDINGS ---------------

async def get_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Gera embeddings via OpenAI API (batch).
    Retorna lista de vetores 1536-dim.
    """
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY não configurada")

    # OpenAI aceita até ~8k tokens por batch, vamos enviar em lotes
    all_embeddings = []
    batch_size = 100  # OpenAI aceita até 2048 inputs

    async with httpx.AsyncClient(timeout=60.0) as client:
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            resp = await client.post(
                "https://api.openai.com/v1/embeddings",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": EMBEDDING_MODEL,
                    "input": batch,
                },
            )
            if resp.status_code != 200:
                raise RuntimeError(f"OpenAI embeddings error: {resp.status_code} — {resp.text}")

            data = resp.json()
            batch_embeddings = [item["embedding"] for item in data["data"]]
            all_embeddings.extend(batch_embeddings)

    return all_embeddings


async def get_single_embedding(text: str) -> list[float]:
    """Embedding de um único texto (para queries)."""
    embeddings = await get_embeddings([text])
    return embeddings[0]


# --------------- SUPABASE DB (via psycopg2 direto) ---------------

def _get_pg_connection():
    """Cria conexão PostgreSQL direta para operações vetoriais."""
    import psycopg2
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL não configurada")
    url = DATABASE_URL
    # Supabase usa postgres:// mas psycopg2 precisa de postgresql://
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return psycopg2.connect(url)


def store_document(filename: str, original_name: str, file_type: str, categories: list[str]) -> int:
    """Insere registo do documento e retorna o ID."""
    conn = _get_pg_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO rag_documents (filename, original_name, file_type, categories, status)
            VALUES (%s, %s, %s, %s, 'pending')
            RETURNING id
            """,
            (filename, original_name, file_type, categories),
        )
        doc_id = cur.fetchone()[0]
        conn.commit()
        return doc_id
    finally:
        conn.close()


def store_chunks(document_id: int, chunks: list[str], embeddings: list[list[float]], categories: list[str]):
    """Insere chunks com embeddings na BD."""
    conn = _get_pg_connection()
    try:
        cur = conn.cursor()
        for i, (chunk, emb) in enumerate(zip(chunks, embeddings)):
            emb_str = json.dumps(emb)
            cur.execute(
                """
                INSERT INTO rag_chunks (document_id, chunk_index, content, token_count, categories, embedding)
                VALUES (%s, %s, %s, %s, %s, %s::vector)
                """,
                (document_id, i, chunk, len(chunk.split()), categories, emb_str),
            )
        # Atualizar documento
        cur.execute(
            """
            UPDATE rag_documents 
            SET status = 'processed', total_chunks = %s, total_chars = %s, updated_at = NOW()
            WHERE id = %s
            """,
            (len(chunks), sum(len(c) for c in chunks), document_id),
        )
        conn.commit()
    except Exception as e:
        conn.rollback()
        # Marcar documento como failed
        try:
            cur2 = conn.cursor()
            cur2.execute(
                "UPDATE rag_documents SET status = 'failed', error_message = %s WHERE id = %s",
                (str(e)[:500], document_id),
            )
            conn.commit()
        except Exception:
            pass
        raise
    finally:
        conn.close()


def mark_document_failed(document_id: int, error: str):
    """Marca documento como failed."""
    conn = _get_pg_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE rag_documents SET status = 'failed', error_message = %s WHERE id = %s",
            (error[:500], document_id),
        )
        conn.commit()
    finally:
        conn.close()


def semantic_search(query_embedding: list[float], top_k: int = MAX_CONTEXT_CHUNKS, categories: list[str] = None) -> list[dict]:
    """
    Pesquisa semântica nos chunks via pgvector.
    Usa a função SQL match_chunks criada no setup.
    """
    conn = _get_pg_connection()
    try:
        cur = conn.cursor()
        emb_str = json.dumps(query_embedding)
        cur.execute(
            "SELECT id, document_id, chunk_index, content, categories, similarity FROM match_chunks(%s::vector, %s, %s)",
            (emb_str, top_k, categories),
        )
        rows = cur.fetchall()
        results = []
        for row in rows:
            results.append({
                "chunk_id": row[0],
                "document_id": row[1],
                "chunk_index": row[2],
                "content": row[3],
                "categories": row[4],
                "similarity": row[5],
            })
        return results
    finally:
        conn.close()


def get_document_stats() -> dict:
    """Estatísticas gerais dos documentos indexados."""
    conn = _get_pg_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*), SUM(total_chunks), SUM(total_chars) FROM rag_documents WHERE status = 'processed'")
        row = cur.fetchone()
        cur.execute("SELECT COUNT(*) FROM rag_documents WHERE status = 'pending'")
        pending = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM rag_documents WHERE status = 'failed'")
        failed = cur.fetchone()[0]
        return {
            "documents_processed": row[0] or 0,
            "total_chunks": row[1] or 0,
            "total_chars": row[2] or 0,
            "documents_pending": pending or 0,
            "documents_failed": failed or 0,
        }
    finally:
        conn.close()


# --------------- LLM: GERAR RESPOSTA ---------------

SYSTEM_PROMPT = """És o assistente AI do LAPHIS, uma aplicação de saúde, treino e nutrição.

Regras:
- Responde SEMPRE em português de Portugal
- Usa linguagem clara, direta e profissional
- Baseia as tuas respostas nos documentos fornecidos no contexto
- Quando tiveres dados do utilizador, personaliza a resposta
- Se não souberes ou o contexto não for suficiente, diz honestamente
- Não inventes dados científicos — usa apenas o que está no contexto
- Formata a resposta de forma legível (bullet points, secções curtas)
- Sê conciso mas completo"""


def _build_user_context(user_data: dict) -> str:
    """Constrói contexto textual a partir dos dados do utilizador."""
    parts = []
    if user_data.get("name"):
        parts.append(f"Nome: {user_data['name']}")
    if user_data.get("age"):
        parts.append(f"Idade: {user_data['age']} anos")
    if user_data.get("sex"):
        parts.append(f"Sexo: {user_data['sex']}")
    if user_data.get("height_cm"):
        parts.append(f"Altura: {user_data['height_cm']} cm")
    if user_data.get("weight_kg"):
        parts.append(f"Peso: {user_data['weight_kg']} kg")
    if user_data.get("goal"):
        goals_map = {
            "perder_gordura": "Perder gordura",
            "ganhar_massa": "Ganhar massa muscular",
            "manter": "Manter composição atual",
        }
        parts.append(f"Objetivo: {goals_map.get(user_data['goal'], user_data['goal'])}")
    if user_data.get("level"):
        parts.append(f"Nível: {user_data['level']}")
    if user_data.get("days_per_week"):
        parts.append(f"Treinos/semana: {user_data['days_per_week']}")
    if user_data.get("recent_weight"):
        parts.append(f"Peso recente: {user_data['recent_weight']} kg")

    if not parts:
        return ""
    return "DADOS DO UTILIZADOR:\n" + "\n".join(parts)


def _build_doc_context(chunks: list[dict]) -> str:
    """Constrói contexto textual a partir dos chunks encontrados."""
    if not chunks:
        return "Nenhum documento relevante encontrado na base de conhecimento."

    parts = []
    for i, chunk in enumerate(chunks, 1):
        sim = chunk.get("similarity", 0)
        parts.append(f"[Documento {i} — relevância: {sim:.0%}]\n{chunk['content']}")

    return "CONTEXTO DOS DOCUMENTOS:\n\n" + "\n\n---\n\n".join(parts)


async def generate_answer(
    question: str,
    doc_chunks: list[dict],
    user_data: dict = None,
    chat_history: list[dict] = None,
) -> dict:
    """
    Gera resposta final usando OpenAI com contexto RAG + dados do utilizador.
    """
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY não configurada")

    # Construir prompt
    doc_context = _build_doc_context(doc_chunks)
    user_context = _build_user_context(user_data or {})

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Contexto (como mensagem de sistema adicional)
    context_parts = [doc_context]
    if user_context:
        context_parts.append(user_context)
    messages.append({
        "role": "system",
        "content": "\n\n".join(context_parts),
    })

    # Histórico de chat (últimas mensagens, se existir)
    if chat_history:
        for msg in chat_history[-6:]:  # últimas 6 mensagens
            messages.append({"role": msg["role"], "content": msg["content"]})

    # Pergunta do utilizador
    messages.append({"role": "user", "content": question})

    # Chamar OpenAI
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": CHAT_MODEL,
                "messages": messages,
                "max_tokens": 1000,
                "temperature": 0.7,
            },
        )

    if resp.status_code != 200:
        raise RuntimeError(f"OpenAI chat error: {resp.status_code} — {resp.text}")

    data = resp.json()
    answer = data["choices"][0]["message"]["content"]
    usage = data.get("usage", {})

    return {
        "answer": answer,
        "model": CHAT_MODEL,
        "tokens_used": usage.get("total_tokens", 0),
        "chunks_used": len(doc_chunks),
        "sources": [
            {
                "chunk_id": c["chunk_id"],
                "document_id": c["document_id"],
                "similarity": round(c["similarity"], 3),
                "excerpt": c["content"][:200],
            }
            for c in doc_chunks
        ],
    }
