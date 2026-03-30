from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import jwt
import os
from passlib.context import CryptContext
from ..core.db import get_db
from ..core.models import User
from ..core.schemas import (
    LoginIn, LoginOut, RegisterIn,
    VerifyEmailIn, ResendCodeIn,
    ForgotPasswordIn, ResetPasswordIn,
)
from ..utils.email import generate_code, send_verification_email, send_reset_password_email

# Configurações JWT
SECRET_KEY = os.getenv("SECRET_KEY", "laphis-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24  # 30 dias

# Expiração dos códigos
CODE_EXPIRE_MINUTES = 15

# Hash de passwords com bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter(prefix="/auth", tags=["auth"])

# ==================== HELPERS ====================

def hash_password(password: str) -> str:
    """Faz hash da password"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se a password está correta"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    """Cria um token JWT"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    """Verifica se um token JWT é válido"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

# ==================== REGISTER ====================

@router.post("/register", response_model=LoginOut)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    """Registar novo utilizador — envia código de verificação por email"""

    # Verificar se email já existe
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email já registado")

    # Gerar código de verificação
    code = generate_code(6)

    # Criar utilizador (email NÃO verificado)
    new_user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        goal=payload.goal or "manter",
        created_at=datetime.utcnow(),
        email_verified=0,
        verification_code=code,
        verification_code_expires=datetime.utcnow() + timedelta(minutes=CODE_EXPIRE_MINUTES),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Enviar email de verificação
    send_verification_email(new_user.email, code)

    # Gerar token (permite acesso limitado antes de verificar)
    token = create_access_token(data={"sub": str(new_user.id)})

    return LoginOut(
        id=new_user.id,
        email=new_user.email,
        access_token=token,
        token_type="bearer",
        email_verified=False,
    )

# ==================== LOGIN ====================

@router.post("/login", response_model=LoginOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    """Fazer login com email e password"""

    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")

    token = create_access_token(data={"sub": str(user.id)})

    return LoginOut(
        id=user.id,
        email=user.email,
        access_token=token,
        token_type="bearer",
        email_verified=bool(user.email_verified),
    )

# ==================== VERIFY EMAIL ====================

@router.post("/verify-email")
def verify_email(payload: VerifyEmailIn, db: Session = Depends(get_db)):
    """Verificar email com código de 6 dígitos"""

    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email não encontrado")

    if user.email_verified:
        return {"message": "Email já verificado", "verified": True}

    # Verificar código
    if not user.verification_code or user.verification_code != payload.code:
        raise HTTPException(status_code=400, detail="Código inválido")

    # Verificar expiração
    if user.verification_code_expires and datetime.utcnow() > user.verification_code_expires:
        raise HTTPException(status_code=400, detail="Código expirado. Pede um novo código.")

    # Marcar como verificado
    user.email_verified = 1
    user.verification_code = None
    user.verification_code_expires = None
    db.commit()

    return {"message": "Email verificado com sucesso! ✅", "verified": True}

# ==================== RESEND VERIFICATION CODE ====================

@router.post("/resend-code")
def resend_verification_code(payload: ResendCodeIn, db: Session = Depends(get_db)):
    """Reenviar código de verificação"""

    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email não encontrado")

    if user.email_verified:
        return {"message": "Email já verificado"}

    # Gerar novo código
    code = generate_code(6)
    user.verification_code = code
    user.verification_code_expires = datetime.utcnow() + timedelta(minutes=CODE_EXPIRE_MINUTES)
    db.commit()

    # Enviar email
    send_verification_email(user.email, code)

    return {"message": "Novo código enviado! Verifica o teu email 📧"}

# ==================== FORGOT PASSWORD ====================

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordIn, db: Session = Depends(get_db)):
    """Envia código de recuperação de password por email"""

    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        # Não revelar se o email existe ou não (segurança)
        return {"message": "Se o email existir, receberás um código de recuperação 📧"}

    # Gerar código de reset
    code = generate_code(6)
    user.reset_code = code
    user.reset_code_expires = datetime.utcnow() + timedelta(minutes=CODE_EXPIRE_MINUTES)
    db.commit()

    # Enviar email
    send_reset_password_email(user.email, code)

    return {"message": "Se o email existir, receberás um código de recuperação 📧"}

# ==================== RESET PASSWORD ====================

@router.post("/reset-password")
def reset_password(payload: ResetPasswordIn, db: Session = Depends(get_db)):
    """Redefinir password com código recebido por email"""

    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email não encontrado")

    # Verificar código
    if not user.reset_code or user.reset_code != payload.code:
        raise HTTPException(status_code=400, detail="Código inválido")

    # Verificar expiração
    if user.reset_code_expires and datetime.utcnow() > user.reset_code_expires:
        raise HTTPException(status_code=400, detail="Código expirado. Pede um novo código.")

    # Atualizar password
    user.password_hash = hash_password(payload.new_password)
    user.reset_code = None
    user.reset_code_expires = None
    db.commit()

    return {"message": "Password atualizada com sucesso! 🔐"}

# ==================== ME ====================

@router.get("/me")
def get_current_user(token: str = None, db: Session = Depends(get_db)):
    """Obter dados do utilizador atual (requer token)"""
    if not token:
        raise HTTPException(status_code=401, detail="Token não fornecido")

    user_id = verify_token(token)
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")

    return {
        "id": user.id,
        "email": user.email,
        "goal": user.goal,
        "email_verified": bool(user.email_verified),
        "created_at": user.created_at,
    }

# ==================== LOGOUT ====================

@router.post("/logout")
def logout():
    """Logout (apenas limpa token no cliente)"""
    return {"message": "Logout realizado com sucesso"}
