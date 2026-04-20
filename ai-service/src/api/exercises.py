"""
API de Exercícios — LAPHIS
Base de dados de exercícios com imagens, vídeos e instruções
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from ..core.db import get_db
from ..core.models import Exercise
from ..core.schemas import ExerciseOut, ExerciseListOut

router = APIRouter(prefix="/exercises", tags=["exercises"])


@router.get("", response_model=List[ExerciseListOut])
def list_exercises(
    category: Optional[str] = Query(None, description="Filtrar por categoria (peito, costas, pernas, etc.)"),
    difficulty: Optional[str] = Query(None, description="Filtrar por dificuldade (iniciante, intermedio, avancado)"),
    equipment: Optional[str] = Query(None, description="Filtrar por equipamento"),
    muscle: Optional[str] = Query(None, description="Filtrar por músculo"),
    search: Optional[str] = Query(None, description="Pesquisar por nome"),
    compound_only: Optional[bool] = Query(None, description="Apenas exercícios compostos"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Lista exercícios com filtros opcionais.
    Retorna lista resumida (sem instruções completas).
    """
    query = db.query(Exercise)
    
    if category:
        query = query.filter(Exercise.category == category.lower())
    if difficulty:
        query = query.filter(Exercise.difficulty == difficulty.lower())
    if equipment:
        query = query.filter(Exercise.equipment.ilike(f"%{equipment}%"))
    if muscle:
        query = query.filter(
            (Exercise.muscle_primary.ilike(f"%{muscle}%")) |
            (Exercise.muscle_secondary.ilike(f"%{muscle}%"))
        )
    if search:
        query = query.filter(
            (Exercise.name.ilike(f"%{search}%")) |
            (Exercise.name_en.ilike(f"%{search}%"))
        )
    if compound_only is True:
        query = query.filter(Exercise.is_compound == 1)
    
    exercises = query.order_by(Exercise.category, Exercise.name).limit(limit).all()
    return exercises


@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    """
    Retorna lista de categorias disponíveis com contagem de exercícios.
    """
    from sqlalchemy import func
    results = db.query(
        Exercise.category,
        func.count(Exercise.id).label("count")
    ).group_by(Exercise.category).order_by(Exercise.category).all()
    
    return [{"category": r[0], "count": r[1]} for r in results]


@router.get("/random", response_model=List[ExerciseListOut])
def get_random_exercises(
    category: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    count: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """
    Retorna exercícios aleatórios para sugestões.
    """
    from sqlalchemy.sql.expression import func
    
    query = db.query(Exercise)
    if category:
        query = query.filter(Exercise.category == category.lower())
    if difficulty:
        query = query.filter(Exercise.difficulty == difficulty.lower())
    
    exercises = query.order_by(func.random()).limit(count).all()
    return exercises


@router.get("/{exercise_id}", response_model=ExerciseOut)
def get_exercise(exercise_id: int, db: Session = Depends(get_db)):
    """
    Retorna detalhes completos de um exercício.
    Inclui instruções, dicas e vídeo.
    """
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercício não encontrado")
    return exercise


@router.get("/by-name/{name}", response_model=ExerciseOut)
def get_exercise_by_name(name: str, db: Session = Depends(get_db)):
    """
    Busca exercício por nome (fuzzy match).
    Útil para integração com o chat.
    """
    # Tentar match exato primeiro
    exercise = db.query(Exercise).filter(
        (Exercise.name.ilike(name)) |
        (Exercise.name_en.ilike(name))
    ).first()
    
    if not exercise:
        # Tentar match parcial
        exercise = db.query(Exercise).filter(
            (Exercise.name.ilike(f"%{name}%")) |
            (Exercise.name_en.ilike(f"%{name}%"))
        ).first()
    
    if not exercise:
        raise HTTPException(status_code=404, detail=f"Exercício '{name}' não encontrado")
    return exercise


@router.get("/for-muscle/{muscle}", response_model=List[ExerciseListOut])
def get_exercises_for_muscle(
    muscle: str,
    limit: int = Query(10, ge=1, le=30),
    db: Session = Depends(get_db)
):
    """
    Retorna exercícios que trabalham um músculo específico.
    """
    exercises = db.query(Exercise).filter(
        (Exercise.muscle_primary.ilike(f"%{muscle}%")) |
        (Exercise.muscle_secondary.ilike(f"%{muscle}%"))
    ).order_by(Exercise.is_compound.desc(), Exercise.name).limit(limit).all()
    
    return exercises
