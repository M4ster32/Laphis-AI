"""
Funções utilitárias para o backend
"""
from datetime import datetime
from pathlib import Path


def get_project_root() -> Path:
    """Obter caminho raiz do projeto"""
    return Path(__file__).resolve().parent.parent.parent


def format_datetime(dt: datetime) -> str:
    """Formatar datetime para string ISO"""
    return dt.isoformat() if dt else None


def validate_email(email: str) -> bool:
    """Validar formato de email"""
    import re
    pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return re.match(pattern, email) is not None


def calculate_bmi(weight_kg: float, height_cm: float) -> float:
    """Calcular IMC (Índice de Massa Corporal)"""
    height_m = height_cm / 100
    return round(weight_kg / (height_m ** 2), 2)


def get_bmi_category(bmi: float) -> str:
    """Classificar BMI"""
    if bmi < 18.5:
        return "Baixo peso"
    elif bmi < 25:
        return "Peso normal"
    elif bmi < 30:
        return "Sobrepeso"
    else:
        return "Obesidade"


def sanitize_input(input_str: str) -> str:
    """Limpar input removendo caracteres perigosos"""
    return input_str.strip() if input_str else ""
