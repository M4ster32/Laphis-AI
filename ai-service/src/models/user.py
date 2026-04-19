"""
Modelos de dados para o backend
Expandir conforme necessário com novos modelos
"""

from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime


class AuditMixin(BaseModel):
    """Mixin para campos de auditoria (created_at, updated_at)"""
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class UserBase(BaseModel):
    """Base para modelo de utilizador"""
    name: str = Field(min_length=1, max_length=60)
    email: str
    age: int = Field(ge=12, le=100)


class User(UserBase, AuditMixin):
    """Modelo completo de utilizador"""
    id: int
    model_config = ConfigDict(from_attributes=True)
