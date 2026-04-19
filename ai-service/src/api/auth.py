"""
Authentication endpoints — register, login, email verification,
password reset, current-user retrieval, and logout.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
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

# ==================== CONFIGURATION ====================

SECRET_KEY = os.getenv("SECRET_KEY", "laphis-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24  # 30 days
CODE_EXPIRE_MINUTES = 15              # verification / reset code TTL

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter(prefix="/auth", tags=["auth"])

# ==================== HELPERS ====================


def hash_password(password: str) -> str:
    """Return a bcrypt hash of the given plain-text password."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check a plain-text password against its bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a signed JWT with an optional custom expiry."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> int:
    """
    Decode and validate a JWT, returning the user ID (`sub` claim).
    Raises 401 on invalid or expired tokens.
    """
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


def _find_user_by_email(email: str, db: Session) -> User:
    """Look up a user by email, raising 404 if not found."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email não encontrado")
    return user


def _validate_code(stored: str | None, provided: str, expires: datetime | None) -> None:
    """
    Validate a verification / reset code.
    Raises 400 with a user-facing message on mismatch or expiry.
    """
    if not stored or stored != provided:
        raise HTTPException(status_code=400, detail="Código inválido")
    if expires and datetime.now(timezone.utc).replace(tzinfo=None) > expires:
        raise HTTPException(status_code=400, detail="Código expirado. Pede um novo código.")


# ==================== REGISTER ====================

@router.post("/register", response_model=LoginOut)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    """Register a new user and send a verification code via email."""

    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email já registado")

    code = generate_code(6)

    new_user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        goal=payload.goal or "manter",
        created_at=datetime.now(timezone.utc),
        email_verified=0,
        verification_code=code,
        verification_code_expires=datetime.now(timezone.utc) + timedelta(minutes=CODE_EXPIRE_MINUTES),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    send_verification_email(new_user.email, code)

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
    """Authenticate a user with email + password and return a JWT."""

    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
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
    """Verify a user's email address using a 6-digit code."""

    user = _find_user_by_email(payload.email, db)

    if user.email_verified:
        return {"message": "Email já verificado", "verified": True}

    _validate_code(user.verification_code, payload.code, user.verification_code_expires)

    user.email_verified = 1
    user.verification_code = None
    user.verification_code_expires = None
    db.commit()

    return {"message": "Email verificado com sucesso! ✅", "verified": True}


# ==================== RESEND VERIFICATION CODE ====================

@router.post("/resend-code")
def resend_verification_code(payload: ResendCodeIn, db: Session = Depends(get_db)):
    """Generate and send a fresh email verification code."""

    user = _find_user_by_email(payload.email, db)

    if user.email_verified:
        return {"message": "Email já verificado"}

    code = generate_code(6)
    user.verification_code = code
    user.verification_code_expires = datetime.now(timezone.utc) + timedelta(minutes=CODE_EXPIRE_MINUTES)
    db.commit()

    send_verification_email(user.email, code)
    return {"message": "Novo código enviado! Verifica o teu email 📧"}


# ==================== FORGOT PASSWORD ====================

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordIn, db: Session = Depends(get_db)):
    """Send a password recovery code via email (safe: never reveals if email exists)."""

    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        # Don't leak whether the email is registered
        return {"message": "Se o email existir, receberás um código de recuperação 📧"}

    code = generate_code(6)
    user.reset_code = code
    user.reset_code_expires = datetime.now(timezone.utc) + timedelta(minutes=CODE_EXPIRE_MINUTES)
    db.commit()

    send_reset_password_email(user.email, code)
    return {"message": "Se o email existir, receberás um código de recuperação 📧"}


# ==================== RESET PASSWORD ====================

@router.post("/reset-password")
def reset_password(payload: ResetPasswordIn, db: Session = Depends(get_db)):
    """Reset the user's password after validating the emailed recovery code."""

    user = _find_user_by_email(payload.email, db)
    _validate_code(user.reset_code, payload.code, user.reset_code_expires)

    user.password_hash = hash_password(payload.new_password)
    user.reset_code = None
    user.reset_code_expires = None
    db.commit()

    return {"message": "Password atualizada com sucesso! 🔐"}


# ==================== ME ====================

@router.get("/me")
def get_current_user(token: str = None, db: Session = Depends(get_db)):
    """Return the authenticated user's basic info (requires JWT)."""

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
    """Server-side logout acknowledgement (token invalidation happens client-side)."""
    return {"message": "Logout realizado com sucesso"}
