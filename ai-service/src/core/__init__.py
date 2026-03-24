"""
Módulo core - Lógica central da aplicação
Importa automaticamente os modelos para registro na Base
"""
# Importar BD primeiro
from .db import Base, SessionLocal, engine, get_db, init_db

# Depois importar os modelos (isto registra-os na Base)
from . import models

__all__ = [
    "Base",
    "SessionLocal", 
    "engine",
    "get_db",
    "init_db",
    "models",
]
