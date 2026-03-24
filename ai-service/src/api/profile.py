from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import jwt
import os
from ..core.db import get_db
from ..core.models import Profile, User
from ..core.schemas import ProfileIn, ProfileOut

router = APIRouter(prefix="/profile", tags=["profile"])

# JWT config - DEVE SER IGUAL AO DE auth.py
SECRET_KEY = os.getenv("SECRET_KEY", "laphis-secret-key-change-in-production")
ALGORITHM = "HS256"

def get_current_user(token: str):
    """Extrair user_id do JWT token"""
    try:
        if not token:
            raise HTTPException(status_code=401, detail="Token not provided")
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str = payload.get("sub")
        
        if not user_id_str:
            raise HTTPException(status_code=401, detail="Invalid token - no user ID")
        
        # Converter user_id de string para int
        try:
            user_id = int(user_id_str)
        except (ValueError, TypeError):
            raise HTTPException(status_code=401, detail="Invalid user ID format")
        
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        print(f"Token decode error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("", response_model=ProfileOut)
def create_profile(
    payload: ProfileIn, 
    token: str = None,
    db: Session = Depends(get_db)
):
    """Criar perfil para o utilizador autenticado"""
    
    if not token:
        raise HTTPException(status_code=401, detail="Token required")
    
    # Extrair user_id do token
    user_id = get_current_user(token)
    
    # Verificar se o utilizador existe
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Sessão inválida. Faz login novamente.")
    
    # Verificar se já existe perfil para este user
    existing = db.query(Profile).filter(Profile.user_id == user_id).first()
    if existing:
        # Atualizar existente
        existing.name = payload.name
        existing.age = payload.age
        existing.sex = payload.sex
        existing.height_cm = payload.height_cm
        existing.weight_kg = payload.weight_kg
        existing.goal = payload.goal
        existing.level = payload.level
        existing.days_per_week = payload.days_per_week
        existing.avatar = payload.avatar
        db.commit()
        db.refresh(existing)
        return ProfileOut.model_validate(existing)
    
    # Criar novo
    db_profile = Profile(
        user_id=user_id,
        name=payload.name,
        age=payload.age,
        sex=payload.sex,
        height_cm=payload.height_cm,
        weight_kg=payload.weight_kg,
        goal=payload.goal,
        level=payload.level,
        days_per_week=payload.days_per_week,
        avatar=payload.avatar,
    )
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return ProfileOut.model_validate(db_profile)

@router.get("/me", response_model=ProfileOut)
def get_my_profile(token: str = None, db: Session = Depends(get_db)):
    """Obter perfil do utilizador autenticado"""
    if not token:
        raise HTTPException(status_code=401, detail="Token required")
    
    user_id = get_current_user(token)
    
    # Verificar se o utilizador existe
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Sessão inválida. Faz login novamente.")
    
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Please create one first.")
    
    return ProfileOut.model_validate(profile)

@router.get("/{profile_id}", response_model=ProfileOut)
def get_profile(profile_id: int, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return ProfileOut.model_validate(profile)
