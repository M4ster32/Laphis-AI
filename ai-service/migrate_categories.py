#!/usr/bin/env python3
"""
Migration: Add categories table and category_id to plans
Safe to run multiple times — checks before altering.
"""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "src" / "data" / "laphis.db"

def migrate():
    print(f"📦 Migration: {DB_PATH}")
    
    if not DB_PATH.exists():
        print("⚠️  BD não encontrada. Será criada no startup do backend.")
        return
    
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    
    # 1. Create categories table if not exists
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name VARCHAR(60) NOT NULL,
            icon VARCHAR(10),
            color VARCHAR(20),
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_categories_user_id ON categories(user_id)")
    print("✅ Tabela 'categories' criada/verificada")
    
    # 2. Add category_id column to plans (if not exists)
    cursor.execute("PRAGMA table_info(plans)")
    columns = [row[1] for row in cursor.fetchall()]
    
    if "category_id" not in columns:
        cursor.execute("ALTER TABLE plans ADD COLUMN category_id INTEGER REFERENCES categories(id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_plans_category_id ON plans(category_id)")
        print("✅ Coluna 'category_id' adicionada à tabela 'plans'")
    else:
        print("ℹ️  Coluna 'category_id' já existe em 'plans'")
    
    conn.commit()
    
    # Show final state
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    tables = cursor.fetchall()
    print(f"\n📋 Tabelas na BD ({len(tables)}):")
    for t in tables:
        cursor.execute(f"PRAGMA table_info({t[0]})")
        cols = cursor.fetchall()
        print(f"   {t[0]} ({len(cols)} colunas)")
        for col in cols:
            print(f"      - {col[1]} ({col[2]})")
    
    conn.close()
    print("\n✅ Migration concluída com sucesso!")

if __name__ == "__main__":
    migrate()
