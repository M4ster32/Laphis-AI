#!/usr/bin/env python3
"""
Script para migrar dados de SQLite para PostgreSQL (Supabase)
Uso: python migrate_to_supabase.py
"""
import os
import sys
from pathlib import Path

# Adiciona ai-service ao path
sys.path.insert(0, str(Path(__file__).parent / "ai-service"))

from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import Session
from src.core.db import Base, engine as dev_engine
from src.core.models import *

def migrate_data():
    """Migra dados de SQLite para PostgreSQL"""
    
    # Verifica se DATABASE_URL está definida
    db_url = os.getenv("DATABASE_URL")
    if not db_url or "sqlite" in db_url:
        print("❌ Erro: DATABASE_URL não está definida ou é SQLite")
        print("Defina: export DATABASE_URL='postgresql://user:pass@host/db'")
        sys.exit(1)
    
    print(f"🔄 Migrando dados para: {db_url[:50]}...")
    
    # Cria conexão com banco destino (Supabase)
    prod_engine = create_engine(db_url)
    
    # Cria todas as tabelas no destino
    Base.metadata.create_all(prod_engine)
    print("✅ Tabelas criadas no PostgreSQL")
    
    # Copia dados
    with Session(dev_engine) as dev_session, Session(prod_engine) as prod_session:
        # Lista de modelos na ordem correta (por dependências)
        models = [
            User, Profile, Category, Plan, 
            WorkoutLog, MealLog, ZenSession, WaterLog, WeightEntry,
            ProgressSnapshot, PlanFeedback, AdaptationLog, ChatMessage
        ]
        
        for model in models:
            try:
                records = dev_session.query(model).all()
                if records:
                    print(f"  📦 Copiando {len(records)} {model.__tablename__}...")
                    prod_session.bulk_insert_mappings(model, [
                        {col.name: getattr(record, col.name) 
                         for col in inspect(model).columns}
                        for record in records
                    ])
            except Exception as e:
                print(f"  ⚠️  Erro ao copiar {model.__tablename__}: {e}")
        
        prod_session.commit()
    
    print("✅ Migração completa!")
    print("\nPróximos passos:")
    print("1. Testa backend: DATABASE_URL='postgresql://...' python -m uvicorn src.main:app --reload")
    print("2. Deploy em Railway: railway up")
    print("3. Atualiza FRONTEND_URL em config.py com o URL do Railway")

if __name__ == "__main__":
    try:
        migrate_data()
    except Exception as e:
        print(f"❌ Erro: {e}")
        sys.exit(1)
