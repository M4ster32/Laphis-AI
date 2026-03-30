"""
API de Planos — CRUD + Geração via Recommender
Endpoints para gerar, guardar, listar, editar e duplicar planos
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from ..core.db import get_db
from ..core.models import Profile, Plan
from ..core.schemas import (
    PlanGenerateIn, PlanSaveIn, PlanUpdateIn,
    PlanOut, PlanListOut, ProfileOut,
)
from ..core.recommender import recommend

router = APIRouter(prefix="/plans", tags=["plans"])


def _load_profile(profile_id: int, db: Session) -> Profile:
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


def _profile_to_out(profile: Profile) -> ProfileOut:
    return ProfileOut(
        id=profile.id,
        name=profile.name,
        age=profile.age,
        sex=profile.sex,
        height_cm=profile.height_cm,
        weight_kg=profile.weight_kg,
        goal=profile.goal,
        level=profile.level,
        days_per_week=profile.days_per_week,
    )


def _generate_plan_content(profile: Profile, plan_type: str) -> dict:
    """
    Usa o recommender para gerar conteúdo estruturado em JSON.
    Chama a função recommend com uma pergunta adequada ao tipo.
    """
    profile_out = _profile_to_out(profile)

    if plan_type == "training":
        title, bullets = recommend(profile_out, "Cria-me um plano de treino semanal detalhado")
        return {
            "type": "training",
            "title": title,
            "sections": _bullets_to_sections(bullets),
            "summary": {
                "level": profile.level,
                "days_per_week": profile.days_per_week,
                "goal": profile.goal,
            },
        }

    elif plan_type == "nutrition":
        title, bullets = recommend(profile_out, "Cria-me um plano alimentar com calorias")
        return {
            "type": "nutrition",
            "title": title,
            "sections": _bullets_to_sections(bullets),
            "summary": {
                "weight_kg": profile.weight_kg,
                "height_cm": profile.height_cm,
                "goal": profile.goal,
            },
        }

    else:  # combined
        t_title, t_bullets = recommend(profile_out, "Cria-me um plano de treino semanal detalhado")
        n_title, n_bullets = recommend(profile_out, "Cria-me um plano alimentar com calorias")
        return {
            "type": "combined",
            "training": {
                "title": t_title,
                "sections": _bullets_to_sections(t_bullets),
            },
            "nutrition": {
                "title": n_title,
                "sections": _bullets_to_sections(n_bullets),
            },
            "summary": {
                "level": profile.level,
                "days_per_week": profile.days_per_week,
                "weight_kg": profile.weight_kg,
                "height_cm": profile.height_cm,
                "goal": profile.goal,
            },
        }


def _bullets_to_sections(bullets: list) -> list:
    """
    Converte lista de bullets do recommender em secções estruturadas.
    Detecta headers (emojis, linhas vazias) e agrupa bullets.
    """
    sections = []
    current_section = {"header": "", "items": []}

    for b in bullets:
        b_stripped = b.strip()
        if not b_stripped:
            # Linha vazia = separador de secção
            if current_section["items"] or current_section["header"]:
                sections.append(current_section)
                current_section = {"header": "", "items": []}
        elif b_stripped.startswith("📅") or b_stripped.startswith("📊") or \
             b_stripped.startswith("🎯") or b_stripped.startswith("💪") or \
             b_stripped.startswith("🍽️") or b_stripped.startswith("💧") or \
             b_stripped.startswith("⏰") or b_stripped.startswith("💡") or \
             b_stripped.startswith("🌙") or b_stripped.startswith("💤") or \
             b_stripped.startswith("Recomendo:"):
            # Novo header de secção
            if current_section["items"] or current_section["header"]:
                sections.append(current_section)
            current_section = {"header": b_stripped, "items": []}
        elif b_stripped.startswith("•"):
            current_section["items"].append(b_stripped[2:].strip())
        else:
            current_section["items"].append(b_stripped)

    if current_section["items"] or current_section["header"]:
        sections.append(current_section)

    return sections


# ==================== ENDPOINTS ====================

@router.post("/generate", response_model=PlanOut)
def generate_plan(payload: PlanGenerateIn, db: Session = Depends(get_db)):
    """
    Gera um plano via recommender e guarda automaticamente na BD.
    """
    profile = _load_profile(payload.profile_id, db)
    content = _generate_plan_content(profile, payload.type)

    type_labels = {"training": "Treino", "nutrition": "Nutrição", "combined": "Combinado"}
    title = f"Plano de {type_labels.get(payload.type, 'Treino')} — {profile.name}"

    plan = Plan(
        profile_id=profile.id,
        category_id=payload.category_id,
        type=payload.type,
        title=title,
        content_json=content,
        notes=payload.notes,
        status="active",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    return PlanOut.model_validate(plan)


@router.post("/save", response_model=PlanOut)
def save_plan(payload: PlanSaveIn, db: Session = Depends(get_db)):
    """
    Guarda um plano customizado (ex: editado pelo user no chat).
    """
    profile = _load_profile(payload.profile_id, db)

    plan = Plan(
        profile_id=profile.id,
        category_id=payload.category_id,
        type=payload.type,
        title=payload.title,
        content_json=payload.content_json,
        notes=payload.notes,
        status="active",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    return PlanOut.model_validate(plan)


@router.get("/list/{profile_id}", response_model=list[PlanListOut])
def list_plans(profile_id: int, status: str = None, category_id: int = None, db: Session = Depends(get_db)):
    """
    Lista todos os planos de um perfil, ordenados por data (mais recentes primeiro).
    Filtro opcional por status (active/archived) e/ou category_id.
    """
    _load_profile(profile_id, db)

    query = db.query(Plan).filter(Plan.profile_id == profile_id)
    if status:
        query = query.filter(Plan.status == status)
    if category_id is not None:
        query = query.filter(Plan.category_id == category_id)
    plans = query.order_by(Plan.created_at.desc()).all()

    return [PlanListOut.model_validate(p) for p in plans]


@router.get("/detail/{plan_id}", response_model=PlanOut)
def get_plan_detail(plan_id: int, db: Session = Depends(get_db)):
    """
    Obtém o detalhe completo de um plano (com content_json).
    """
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return PlanOut.model_validate(plan)


@router.put("/{plan_id}", response_model=PlanOut)
def update_plan(plan_id: int, payload: PlanUpdateIn, db: Session = Depends(get_db)):
    """
    Editar título, notas ou status de um plano.
    """
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    if payload.title is not None:
        plan.title = payload.title
    if payload.notes is not None:
        plan.notes = payload.notes
    if payload.status is not None:
        plan.status = payload.status
    if payload.category_id is not None:
        plan.category_id = payload.category_id

    plan.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(plan)

    return PlanOut.model_validate(plan)


@router.post("/{plan_id}/duplicate", response_model=PlanOut)
def duplicate_plan(plan_id: int, db: Session = Depends(get_db)):
    """
    Duplica um plano existente (cópia com novo id e title).
    """
    original = db.query(Plan).filter(Plan.id == plan_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Plan not found")

    new_plan = Plan(
        profile_id=original.profile_id,
        type=original.type,
        title=f"{original.title} (cópia)",
        content_json=original.content_json,
        notes=original.notes,
        status="active",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)

    return PlanOut.model_validate(new_plan)


@router.delete("/{plan_id}")
def delete_plan(plan_id: int, db: Session = Depends(get_db)):
    """
    Apaga um plano permanentemente.
    """
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    db.delete(plan)
    db.commit()
    return {"ok": True, "detail": "Plano apagado"}
