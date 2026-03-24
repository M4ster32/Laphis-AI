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
DATABASE_URL = str(DATA_DIR / "laphis.db")

# Frontend (CORS)
FRONTEND_URL = "http://localhost:5173"
FRONTEND_URLS = [
    "http://localhost:5173",
    "http://localhost:3000",  # Para desenvolvimento alternativo
    "http://127.0.0.1:5173",
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
