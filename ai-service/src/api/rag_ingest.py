"""
LAPHIS RAG: Endpoint de ingestão de PDFs
POST /rag/ingest       — Upload e indexação de 1 PDF
POST /rag/ingest/batch — Upload de múltiplos PDFs
GET  /rag/stats        — Estatísticas dos documentos indexados
GET  /rag/documents    — Listar documentos

Não substitui o /ingest existente — funciona em paralelo.
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
import uuid

from ..core.rag import (
    extract_text_from_pdf,
    clean_text,
    chunk_text,
    get_embeddings,
    store_document,
    store_chunks,
    mark_document_failed,
    get_document_stats,
)

router = APIRouter(prefix="/rag", tags=["rag"])

ALLOWED_TYPES = {"application/pdf", "application/octet-stream"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB


@router.post("/ingest")
async def rag_ingest(
    file: UploadFile = File(...),
    categories: Optional[str] = Form(default=""),
):
    """
    Upload de 1 PDF → extração → chunking → embeddings → Supabase.
    
    - file: ficheiro PDF
    - categories: string separada por vírgulas (ex: "hidratação,composição_corporal")
    """
    # Validar extensão
    filename = file.filename or "unknown.pdf"
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Apenas ficheiros PDF são aceites.")

    # Ler conteúdo
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Ficheiro demasiado grande (máx 50MB).")
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Ficheiro vazio.")

    # Processar categorias
    cat_list = [c.strip().lower() for c in categories.split(",") if c.strip()] if categories else []

    # Gerar nome único
    safe_name = f"{uuid.uuid4().hex[:12]}_{filename}"

    # Registar documento na BD
    doc_id = store_document(
        filename=safe_name,
        original_name=filename,
        file_type="pdf",
        categories=cat_list,
    )

    try:
        # 1. Extrair texto
        raw_text = extract_text_from_pdf(content)
        if not raw_text.strip():
            mark_document_failed(doc_id, "PDF sem texto extraível (possível scan/imagem)")
            return {
                "doc_id": doc_id,
                "filename": filename,
                "status": "failed",
                "reason": "PDF sem texto extraível. Pode ser um scan/imagem. OCR será suportado numa versão futura.",
                "chars_extracted": 0,
                "chunks": 0,
            }

        # 2. Limpar texto
        cleaned = clean_text(raw_text)

        # 3. Dividir em chunks
        chunks = chunk_text(cleaned)
        if not chunks:
            mark_document_failed(doc_id, "Texto demasiado curto para criar chunks")
            return {
                "doc_id": doc_id,
                "filename": filename,
                "status": "failed",
                "reason": "Texto extraído demasiado curto.",
                "chars_extracted": len(cleaned),
                "chunks": 0,
            }

        # 4. Gerar embeddings (via OpenAI API)
        embeddings = await get_embeddings(chunks)

        # 5. Guardar chunks + embeddings no Supabase
        store_chunks(doc_id, chunks, embeddings, cat_list)

        return {
            "doc_id": doc_id,
            "filename": filename,
            "status": "processed",
            "chars_extracted": len(cleaned),
            "chunks": len(chunks),
            "categories": cat_list,
            "message": f"PDF indexado com sucesso: {len(chunks)} chunks criados.",
        }

    except Exception as e:
        mark_document_failed(doc_id, str(e))
        raise HTTPException(status_code=500, detail=f"Erro ao processar PDF: {str(e)}")


@router.post("/ingest/batch")
async def rag_ingest_batch(
    files: list[UploadFile] = File(...),
    categories: Optional[str] = Form(default=""),
):
    """
    Upload de múltiplos PDFs de uma vez.
    Processa sequencialmente para controlar memória.
    """
    results = []
    cat_list = [c.strip().lower() for c in categories.split(",") if c.strip()] if categories else []

    for file in files:
        filename = file.filename or "unknown.pdf"
        if not filename.lower().endswith(".pdf"):
            results.append({"filename": filename, "status": "skipped", "reason": "Não é PDF"})
            continue

        content = await file.read()
        if len(content) == 0 or len(content) > MAX_FILE_SIZE:
            results.append({"filename": filename, "status": "skipped", "reason": "Ficheiro vazio ou grande demais"})
            continue

        safe_name = f"{uuid.uuid4().hex[:12]}_{filename}"
        doc_id = store_document(safe_name, filename, "pdf", cat_list)

        try:
            raw_text = extract_text_from_pdf(content)
            if not raw_text.strip():
                mark_document_failed(doc_id, "Sem texto extraível")
                results.append({"doc_id": doc_id, "filename": filename, "status": "failed", "reason": "Sem texto"})
                continue

            cleaned = clean_text(raw_text)
            chunks = chunk_text(cleaned)
            if not chunks:
                mark_document_failed(doc_id, "Poucos caracteres")
                results.append({"doc_id": doc_id, "filename": filename, "status": "failed", "reason": "Texto curto"})
                continue

            embeddings = await get_embeddings(chunks)
            store_chunks(doc_id, chunks, embeddings, cat_list)

            results.append({
                "doc_id": doc_id,
                "filename": filename,
                "status": "processed",
                "chunks": len(chunks),
                "chars": len(cleaned),
            })
        except Exception as e:
            mark_document_failed(doc_id, str(e))
            results.append({"doc_id": doc_id, "filename": filename, "status": "failed", "reason": str(e)[:200]})

    processed = sum(1 for r in results if r.get("status") == "processed")
    return {
        "total": len(files),
        "processed": processed,
        "failed": len(files) - processed,
        "results": results,
    }


@router.get("/stats")
def rag_stats():
    """Estatísticas dos documentos indexados."""
    try:
        stats = get_document_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao obter estatísticas: {str(e)}")


@router.get("/documents")
def rag_documents():
    """Lista todos os documentos indexados."""
    from ..core.rag import _get_pg_connection
    conn = _get_pg_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT id, original_name, file_type, total_chunks, total_chars, 
                   categories, status, error_message, created_at
            FROM rag_documents
            ORDER BY created_at DESC
            LIMIT 100
            """
        )
        rows = cur.fetchall()
        docs = []
        for row in rows:
            docs.append({
                "id": row[0],
                "original_name": row[1],
                "file_type": row[2],
                "total_chunks": row[3],
                "total_chars": row[4],
                "categories": row[5],
                "status": row[6],
                "error_message": row[7],
                "created_at": str(row[8]) if row[8] else None,
            })
        return {"documents": docs, "total": len(docs)}
    finally:
        conn.close()
