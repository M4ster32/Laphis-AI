-- =============================================================
-- LAPHIS RAG: Schema para pgvector no Supabase
-- Executar no SQL Editor do Supabase (https://app.supabase.com)
-- =============================================================

-- 1. Ativar extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Tabela de documentos (metadados de cada PDF/ficheiro)
CREATE TABLE IF NOT EXISTS rag_documents (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_type TEXT NOT NULL DEFAULT 'pdf',
    total_chunks INTEGER DEFAULT 0,
    total_chars INTEGER DEFAULT 0,
    categories TEXT[] DEFAULT '{}',  -- ex: {'hidratação', 'composição_corporal'}
    status TEXT NOT NULL DEFAULT 'pending',  -- pending, processed, failed
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de chunks com embeddings vetoriais
CREATE TABLE IF NOT EXISTS rag_chunks (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES rag_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    token_count INTEGER DEFAULT 0,
    categories TEXT[] DEFAULT '{}',
    embedding vector(1536),  -- OpenAI text-embedding-3-small = 1536 dimensões
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_rag_chunks_document_id ON rag_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_categories ON rag_chunks USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_rag_documents_status ON rag_documents(status);
CREATE INDEX IF NOT EXISTS idx_rag_documents_categories ON rag_documents USING GIN(categories);

-- 5. Índice vetorial para pesquisa semântica (IVFFlat — bom para < 100k chunks)
-- Nota: só cria depois de ter dados inseridos (precisa de dados para treinar)
-- CREATE INDEX IF NOT EXISTS idx_rag_chunks_embedding ON rag_chunks 
--     USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 6. Função de pesquisa semântica (chamada pelo backend)
CREATE OR REPLACE FUNCTION match_chunks(
    query_embedding vector(1536),
    match_count INTEGER DEFAULT 5,
    filter_categories TEXT[] DEFAULT NULL
)
RETURNS TABLE (
    id INTEGER,
    document_id INTEGER,
    chunk_index INTEGER,
    content TEXT,
    categories TEXT[],
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        rc.id,
        rc.document_id,
        rc.chunk_index,
        rc.content,
        rc.categories,
        1 - (rc.embedding <=> query_embedding) AS similarity
    FROM rag_chunks rc
    WHERE
        rc.embedding IS NOT NULL
        AND (
            filter_categories IS NULL
            OR rc.categories && filter_categories  -- overlap: tem pelo menos 1 categoria em comum
        )
    ORDER BY rc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 7. Index HNSW (alternativa mais rápida, recomendada se tiveres muitos chunks)
-- Descomenta isto quando tiveres > 1000 chunks:
-- CREATE INDEX IF NOT EXISTS idx_rag_chunks_embedding_hnsw ON rag_chunks
--     USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
