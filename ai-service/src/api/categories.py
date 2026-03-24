"""
API de Categorias — CRUD
Cada utilizador pode criar categorias para organizar planos
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime
import jwt
import os
from ..core.db import get_db
from ..core.models import Category, User
from ..core.schemas import CategoryIn, CategoryOut

router = APIRouter(prefix="/categories", tags=["categories"])

SECRET_KEY = os.getenv("SECRET_KEY", "laphis-secret-key-change-in-production")
ALGORITHM = "HS256"


def _get_user_id(token: str) -> int:
    """Extrair user_id do JWT token"""
    if not token:
        raise HTTPException(status_code=401, detail="Token required")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return int(user_id)
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.get("", response_model=list[CategoryOut])
def list_categories(token: str = None, db: Session = Depends(get_db)):
    """Listar todas as categorias do utilizador autenticado"""
    user_id = _get_user_id(token)
    categories = (
        db.query(Category)
        .filter(Category.user_id == user_id)
        .order_by(Category.name)
        .all()
    )
    return [CategoryOut.model_validate(c) for c in categories]


@router.post("", response_model=CategoryOut)
def create_category(payload: CategoryIn, token: str = None, db: Session = Depends(get_db)):
    """Criar nova categoria para o utilizador"""
    user_id = _get_user_id(token)

    # Verificar se já existe com mesmo nome
    existing = (
        db.query(Category)
        .filter(Category.user_id == user_id, Category.name == payload.name)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Já existe uma categoria com esse nome")

    category = Category(
        user_id=user_id,
        name=payload.name,
        icon=payload.icon,
        color=payload.color,
        created_at=datetime.utcnow(),
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return CategoryOut.model_validate(category)


@router.put("/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: int,
    payload: CategoryIn,
    token: str = None,
    db: Session = Depends(get_db),
):
    """Editar uma categoria (nome, ícone, cor)"""
    user_id = _get_user_id(token)
    category = (
        db.query(Category)
        .filter(Category.id == category_id, Category.user_id == user_id)
        .first()
    )
    if not category:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")

    category.name = payload.name
    if payload.icon is not None:
        category.icon = payload.icon
    if payload.color is not None:
        category.color = payload.color

    db.commit()
    db.refresh(category)
    return CategoryOut.model_validate(category)


@router.delete("/{category_id}")
def delete_category(category_id: int, token: str = None, db: Session = Depends(get_db)):
    """Apagar uma categoria (planos ficam sem categoria)"""
    user_id = _get_user_id(token)
    category = (
        db.query(Category)
        .filter(Category.id == category_id, Category.user_id == user_id)
        .first()
    )
    if not category:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")

    db.delete(category)
    db.commit()
    return {"ok": True, "message": "Categoria apagada"}
