"""
Configuração centralizada do projeto
"""
import os
from pathlib import Path

# Caminhos principais
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = PROJECT_ROOT / "ai-service" / "src" / "data"
UPLOADS_DIR = PROJECT_ROOT / "ai-service" / "src" / "uploads"

# Configuração da base de dados
# Suporta PostgreSQL (Supabase) ou SQLite local
if os.getenv("DATABASE_URL"):
    # Production: PostgreSQL
    DATABASE_URL = os.getenv("DATABASE_URL")
else:
    # Development: SQLite
    DATABASE_URL = f"sqlite:///{DATA_DIR / 'laphis.db'}"

# Frontend (CORS)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
FRONTEND_URLS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "https://seu-frontend-vercel.app",  # Adiciona teu domain
]

# Ambiente
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
DEBUG = ENVIRONMENT == "development"

# Configuração da IA
AI_MODEL = "openai"  # Ou outro modelo a definir
MAX_TOKENS = 500
TEMPERATURE = 0.7

# Validação
MIN_PASSWORD_LENGTH = 8
MAX_NAME_LENGTH = 60

# Paginação
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100

# Uploads
MAX_UPLOAD_SIZE_MB = 10
ALLOWED_UPLOAD_EXTENSIONS = {"csv", "xlsx", "json"}
