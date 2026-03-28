from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
from pathlib import Path

# 🔹 IMPORTAR MODELOS PRIMEIRO (necessário para SQLAlchemy descobrir as tabelas)
# Isto DEVE ser feito antes de create_all() ser chamado
from .core import models  # Importa Profile, WorkoutLog, MealLog, User, ChatMessage
from .core.db import init_db, engine, Base

# VERSION: 1.0.1 - Force redeploy
from .api.health import router as health_router
from .api.ask import router as ask_router
from .api.profile import router as profile_router
from .api.logs import router as logs_router
from .api.auth import router as auth_router
from .api.plans import router as plans_router
from .api.chat import router as chat_router
from .api.categories import router as categories_router
from .api.zen import router as zen_router
from .api.reports import router as reports_router
from .api.water import router as water_router
from .api.weight import router as weight_router
from .api.progress import router as progress_router
from .api.adaptation import router as adaptation_router
from .api.rag_ingest import router as rag_ingest_router
from .api.rag_ask import router as rag_ask_router

app = FastAPI(
    title="LAPHIS AI Service",
    version="0.1.0",
    description="AI backend for training and nutrition recommendations"
)

# ✅ CORS - Allow frontend to access API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "https://laphis.vercel.app",
        "*",  # Also allow all origins as fallback
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def _migrate_db():
    """Adicionar colunas em falta às tabelas existentes (SQLite ALTER TABLE)"""
    db_path = Path(__file__).resolve().parent / "data" / "laphis.db"
    if not db_path.exists():
        return

    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    migrations = [
        ("workout_logs", "description", "TEXT"),
        ("workout_logs", "calories", "INTEGER"),
        ("workout_logs", "created_at", "DATETIME"),
        ("meal_logs", "foods", "TEXT"),
        ("meal_logs", "created_at", "DATETIME"),
    ]

    for table, column, col_type in migrations:
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}")
            print(f"  ✅ Coluna '{column}' adicionada a '{table}'")
        except sqlite3.OperationalError:
            pass  # Coluna já existe

    conn.commit()
    conn.close()


# 🔹 Criar tabelas no arranque da aplicação
@app.on_event("startup")
def on_startup():
    """
    Executado ao iniciar a aplicação FastAPI
    Cria todas as tabelas SQLAlchemy definidas em models.py
    """
    print("\n🚀 Iniciando LAPHIS AI Service...")
    init_db()
    _migrate_db()
    print("✅ Base de dados pronta para usar!")

# 🔹 Endpoint raiz (para veres algo logo no browser)
@app.get("/")
def root():
    return {
        "service": "LAPHIS AI Service",
        "status": "running",
        "docs": "/docs",
        "health": "/health"
    }

# 🔹 Routers
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(logs_router)
app.include_router(ask_router)
app.include_router(plans_router)
app.include_router(chat_router)
app.include_router(categories_router)
app.include_router(zen_router)
app.include_router(reports_router)
app.include_router(water_router)
app.include_router(weight_router)
app.include_router(progress_router)
app.include_router(adaptation_router)
app.include_router(rag_ingest_router)
app.include_router(rag_ask_router)
