#!/usr/bin/env python3
"""
Script simples para criar tabelas no Supabase PostgreSQL
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "ai-service"))

from sqlalchemy import create_engine
from src.core.db import Base

def create_tables():
    """Cria tabelas no Supabase"""
    
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ DATABASE_URL não definida")
        print("Usa: export DATABASE_URL='postgresql://...'")
        sys.exit(1)
    
    print(f"🔄 Conectando a: {db_url[:60]}...")
    
    try:
        engine = create_engine(db_url)
        
        # Testa conexão
        with engine.connect() as conn:
            from sqlalchemy import text
            conn.execute(text("SELECT 1"))
            conn.commit()
        
        print("✅ Conexão OK!")
        
        # Cria todas as tabelas
        print("📦 Criando tabelas...")
        Base.metadata.create_all(engine)
        
        print("✅ Tabelas criadas com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        sys.exit(1)

if __name__ == "__main__":
    create_tables()
