"""
API de Plano Diário Adaptativo
Generate, retrieve and adjust daily plans (workout + meals).
The user can adjust the plan in real-time with natural language constraints.
Uses AI (OpenAI) when available, with fallback to rule-based recommender.
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import Optional
import logging

from ..core.db import get_db
from ..core.models import Profile, DailyPlan
from ..core.schemas import (
    DailyPlanGenerateIn,
    DailyPlanAdjustIn,
    DailyPlanOut,
    ProfileOut,
)
from ..core.recommender import generate_daily_plan, adjust_daily_plan
from ..core.ai_engine import is_ai_available, ai_daily_plan

logger = logging.getLogger("laphis.daily_plan")

router = APIRouter(prefix="/daily-plan", tags=["daily-plan"])


def _load_profile(profile_id: int, db: Session) -> Profile:
    """Load profile or raise 404."""
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


def _profile_to_out(profile: Profile) -> ProfileOut:
    """Convert SQLAlchemy Profile to Pydantic ProfileOut."""
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
        diet_type=getattr(profile, 'diet_type', None),
        allergies=getattr(profile, 'allergies', None),
    )


@router.post("/generate", response_model=DailyPlanOut)
async def gen_daily_plan(payload: DailyPlanGenerateIn, db: Session = Depends(get_db)):
    """
    Generate a daily plan for a specific date.
    If a plan already exists for that date, returns the existing one.
    Defaults to tomorrow if no date is provided.
    Uses AI when OPENAI_API_KEY is available, else rule-based.
    """
    profile = _load_profile(payload.profile_id, db)
    target_date = payload.date or (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d")

    # Return existing plan if one already exists for this date
    existing = (
        db.query(DailyPlan)
        .filter(DailyPlan.profile_id == payload.profile_id, DailyPlan.date == target_date)
        .first()
    )
    if existing:
        return DailyPlanOut.model_validate(existing)

    # Generate new plan — AI first, fallback to recommender
    profile_out = _profile_to_out(profile)

    if is_ai_available():
        try:
            result = await ai_daily_plan(profile, target_date)
            logger.info("AI-generated daily plan for profile %d, date %s", profile.id, target_date)
        except Exception as e:
            logger.warning("AI daily plan failed, using recommender: %s", e)
            result = generate_daily_plan(profile_out, target_date)
    else:
        result = generate_daily_plan(profile_out, target_date)

    plan = DailyPlan(
        profile_id=payload.profile_id,
        date=target_date,
        workout=result["workout"],
        meals=result["meals"],
        adjustments=[],
        status="active",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    return DailyPlanOut.model_validate(plan)


@router.get("/today/{profile_id}")
def get_daily_plan(
    profile_id: int,
    date: Optional[str] = Query(default=None, description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    """
    Get the daily plan for a given date (defaults to today).
    Returns null if no plan exists yet.
    """
    target = date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    plan = (
        db.query(DailyPlan)
        .filter(DailyPlan.profile_id == profile_id, DailyPlan.date == target)
        .first()
    )
    if not plan:
        return None
    return DailyPlanOut.model_validate(plan)


@router.post("/adjust", response_model=DailyPlanOut)
def adjust_plan(payload: DailyPlanAdjustIn, db: Session = Depends(get_db)):
    """
    Adjust an existing daily plan based on a natural-language constraint.
    E.g. 'Só tenho 30 minutos', 'Vou treinar em casa', 'Sou vegetariano'.
    """
    plan = db.query(DailyPlan).filter(DailyPlan.id == payload.plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Daily plan not found")

    profile = db.query(Profile).filter(Profile.id == plan.profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile_out = _profile_to_out(profile)
    current_data = {"workout": plan.workout, "meals": plan.meals}
    new_data, record = adjust_daily_plan(current_data, payload.constraint, profile_out)

    # Update plan (create new list to ensure SQLAlchemy detects the change)
    plan.workout = new_data["workout"]
    plan.meals = new_data["meals"]
    plan.adjustments = list(plan.adjustments or []) + [record]
    plan.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(plan)

    return DailyPlanOut.model_validate(plan)


@router.delete("/{plan_id}")
def delete_daily_plan(plan_id: int, db: Session = Depends(get_db)):
    """Delete a daily plan."""
    plan = db.query(DailyPlan).filter(DailyPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Daily plan not found")
    db.delete(plan)
    db.commit()
    return {"ok": True, "detail": "Plano diário apagado"}
