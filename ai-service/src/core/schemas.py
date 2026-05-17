from pydantic import BaseModel, ConfigDict, Field, EmailStr
from typing import Literal, Optional, List, Any
from datetime import datetime

Goal = Literal["perder_gordura", "ganhar_massa", "manter", "melhorar_saude", "ganhar_resistencia", "definicao"]
Level = Literal["iniciante", "intermedio", "avancado"]
Sex = Literal["masculino", "feminino", "outro"]

# ==================== AUTH SCHEMAS ====================

class LoginIn(BaseModel):
    email: EmailStr
    password: Optional[str] = None  # Opcional por enquanto

class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    goal: Optional[Goal] = "manter"

class LoginOut(BaseModel):
    id: int
    email: str
    access_token: str
    token_type: str = "bearer"
    email_verified: bool = False

# ==================== EMAIL VERIFICATION ====================

class VerifyEmailIn(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)

class ResendCodeIn(BaseModel):
    email: EmailStr

# ==================== PASSWORD RESET ====================

class ForgotPasswordIn(BaseModel):
    email: EmailStr

class ResetPasswordIn(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)
    new_password: str = Field(min_length=4)

# ==================== PROFILE SCHEMAS ====================

class ProfileIn(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    age: int = Field(ge=12, le=100)
    sex: Sex
    height_cm: int = Field(ge=120, le=230)
    weight_kg: float = Field(ge=35, le=250)
    goal: Goal
    level: Level
    days_per_week: int = Field(ge=1, le=7)
    diet_type: Optional[str] = Field(default=None, max_length=100)
    allergies: Optional[str] = Field(default=None, max_length=500)
    avatar: Optional[str] = Field(default=None, max_length=500000)

class ProfileOut(ProfileIn):
    id: int
    model_config = ConfigDict(from_attributes=True)

class WorkoutLogIn(BaseModel):
    date: Optional[str] = Field(default=None, description="YYYY-MM-DD (auto se vazio)")
    description: Optional[str] = Field(default=None, max_length=200)
    duration_min: Optional[int] = Field(default=None, ge=1, le=600)
    calories: Optional[int] = Field(default=None, ge=0, le=10000)
    notes: Optional[str] = Field(default=None, max_length=400)

class MealLogIn(BaseModel):
    date: Optional[str] = Field(default=None, description="YYYY-MM-DD (auto se vazio)")
    meal: Optional[str] = Field(default=None, max_length=50)
    foods: Optional[str] = Field(default=None, max_length=500)
    calories: Optional[int] = Field(default=None, ge=0, le=10000)
    protein_g: Optional[int] = Field(default=None, ge=0, le=400)
    notes: Optional[str] = Field(default=None, max_length=400)

# ---- Unified Log Schemas ----

class UnifiedLogIn(BaseModel):
    """Schema unificado para criar treinos e refeições"""
    log_type: Literal["treino", "refeicao"]
    description: Optional[str] = Field(default=None, max_length=200)
    duration_min: Optional[int] = Field(default=None, ge=1, le=600)
    calories: Optional[int] = Field(default=None, ge=0, le=10000)
    notes: Optional[str] = Field(default=None, max_length=400)
    meal_type: Optional[str] = Field(default=None, max_length=50)
    foods: Optional[str] = Field(default=None, max_length=500)

class UnifiedLogOut(BaseModel):
    id: int
    log_type: str  # "treino" ou "refeicao"
    description: Optional[str] = None
    duration_min: Optional[int] = None
    calories: Optional[int] = None
    notes: Optional[str] = None
    meal_type: Optional[str] = None
    foods: Optional[str] = None
    date: Optional[str] = None
    created_at: Optional[datetime] = None

class AskIn(BaseModel):
    profile_id: int
    question: str = Field(min_length=3, max_length=500)
    session_id: Optional[int] = None

class AskOut(BaseModel):
    title: str
    bullets: List[str]
    disclaimer: str
    session_id: Optional[int] = None

# ==================== CATEGORY SCHEMAS ====================

class CategoryIn(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    icon: Optional[str] = Field(default=None, max_length=10)
    color: Optional[str] = Field(default=None, max_length=20)

class CategoryOut(BaseModel):
    id: int
    user_id: int
    name: str
    icon: Optional[str]
    color: Optional[str]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ==================== PLAN SCHEMAS ====================

PlanType = Literal["training", "nutrition", "combined"]
PlanStatus = Literal["active", "archived"]

class PlanGenerateIn(BaseModel):
    profile_id: int
    type: PlanType = "combined"
    notes: Optional[str] = Field(default=None, max_length=500)
    category_id: Optional[int] = None

class PlanSaveIn(BaseModel):
    profile_id: int
    type: PlanType
    title: str = Field(min_length=1, max_length=200)
    content_json: dict
    notes: Optional[str] = Field(default=None, max_length=500)
    category_id: Optional[int] = None

class PlanUpdateIn(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    notes: Optional[str] = Field(default=None, max_length=500)
    status: Optional[PlanStatus] = None
    category_id: Optional[int] = None

class PlanOut(BaseModel):
    id: int
    profile_id: int
    category_id: Optional[int]
    type: str
    title: str
    content_json: dict
    notes: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class PlanListOut(BaseModel):
    id: int
    profile_id: int
    category_id: Optional[int]
    type: str
    title: str
    status: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ==================== CHAT HISTORY SCHEMAS ====================

class ChatMessageOut(BaseModel):
    id: int
    role: str
    content: str
    session_id: Optional[int] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ChatSessionOut(BaseModel):
    id: int
    title: str
    created_at: datetime
    expires_at: datetime
    message_count: int = 0
    model_config = ConfigDict(from_attributes=True)

class ChatSessionDetailOut(BaseModel):
    id: int
    title: str
    created_at: datetime
    expires_at: datetime
    messages: List[ChatMessageOut] = []
    model_config = ConfigDict(from_attributes=True)

class ChatHistoryOut(BaseModel):
    messages: List[ChatMessageOut]
    total: int
    page: int
    per_page: int

# ==================== WEEKLY SUMMARY SCHEMAS ====================

class WeeklySummaryOut(BaseModel):
    id: int
    week_start: str
    week_end: str
    summary_text: str
    highlights: Optional[List[str]] = None
    suggestions: Optional[List[str]] = None
    stats: Optional[dict] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ==================== ZEN SESSION SCHEMAS ====================

ZenType = Literal["breathing", "meditation", "gratitude", "affirmation"]
MoodType = Literal["calm", "happy", "stressed", "anxious", "tired", "energetic", "neutral"]

class ZenSessionIn(BaseModel):
    type: ZenType
    duration_min: int = Field(ge=1, le=120)
    mood_before: Optional[MoodType] = None
    mood_after: Optional[MoodType] = None
    notes: Optional[str] = Field(default=None, max_length=500)

class ZenSessionOut(BaseModel):
    id: int
    user_id: int
    type: str
    duration_min: int
    mood_before: Optional[str]
    mood_after: Optional[str]
    notes: Optional[str]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ==================== REPORTS SCHEMAS ====================

class ReportSummaryOut(BaseModel):
    total_workouts: int = 0
    total_meals: int = 0
    total_zen_sessions: int = 0
    total_plans: int = 0
    total_workout_minutes: int = 0
    total_calories: int = 0
    total_zen_minutes: int = 0
    avg_calories_per_day: float = 0
    avg_workout_duration: float = 0
    workout_streak: int = 0
    zen_streak: int = 0
    most_common_mood_before: Optional[str] = None
    most_common_mood_after: Optional[str] = None
    workouts_by_week: List[dict] = []
    calories_by_week: List[dict] = []
    zen_by_week: List[dict] = []
    mood_distribution: List[dict] = []
    member_since: Optional[str] = None

# ==================== WATER TRACKING SCHEMAS ====================

class WaterLogIn(BaseModel):
    glasses: int = Field(ge=1, le=30, description="Copos de água (250ml cada)")

class WaterLogOut(BaseModel):
    id: int
    user_id: int
    date: str
    glasses: int
    ml_total: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class WaterDailyOut(BaseModel):
    date: str
    glasses: int
    ml_total: int
    goal_glasses: int = 8
    percentage: float = 0

# ==================== WEIGHT TRACKING SCHEMAS ====================

class WeightEntryIn(BaseModel):
    weight_kg: float = Field(ge=30, le=300)
    notes: Optional[str] = Field(default=None, max_length=200)

class WeightEntryOut(BaseModel):
    id: int
    user_id: int
    weight_kg: float
    date: str
    notes: Optional[str]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ==================== PROGRESS SNAPSHOT SCHEMAS ====================

class ProgressSnapshotOut(BaseModel):
    id: int
    profile_id: int
    date: str
    weight_kg: Optional[float] = None
    body_fat_pct: Optional[float] = None
    workouts_count: int = 0
    total_workout_min: int = 0
    total_calories_burned: int = 0
    meals_count: int = 0
    avg_daily_calories: int = 0
    avg_daily_protein_g: int = 0
    zen_sessions_count: int = 0
    avg_mood_score: Optional[float] = None
    sleep_hours: Optional[float] = None
    workout_streak: int = 0
    adherence_pct: Optional[float] = None
    goal_at_time: Optional[str] = None
    level_at_time: Optional[str] = None
    active_plan_id: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ProgressInsightsOut(BaseModel):
    """Resumo de insights para o frontend — dados já processados"""
    current_snapshot: Optional[ProgressSnapshotOut] = None
    previous_snapshot: Optional[ProgressSnapshotOut] = None
    trend_direction: str = "stable"  # "improving", "declining", "stable"
    highlights: List[str] = []  # ex: ["Peso desceu 0.5kg", "Treinos aumentaram"]
    suggestions: List[str] = []  # ex: ["Considera aumentar carga", "Bom progresso!"]
    snapshots_count: int = 0

# ==================== PLAN FEEDBACK SCHEMAS ====================

FeedbackTag = Literal[
    "muito_facil", "adequado", "muito_dificil",
    "falta_tempo", "falta_equipamento", "bom_resultado",
    "sem_resultado", "gostei", "nao_gostei", "repetitivo",
]

class PlanFeedbackIn(BaseModel):
    plan_id: int
    rating: int = Field(ge=1, le=5)
    difficulty_rating: Optional[int] = Field(default=None, ge=1, le=5)
    enjoyment_rating: Optional[int] = Field(default=None, ge=1, le=5)
    effectiveness_rating: Optional[int] = Field(default=None, ge=1, le=5)
    comment: Optional[str] = Field(default=None, max_length=500)
    tags: Optional[str] = Field(default=None, max_length=255)
    completed_pct: Optional[int] = Field(default=None, ge=0, le=100)
    weeks_followed: Optional[int] = Field(default=None, ge=0, le=104)

class PlanFeedbackOut(BaseModel):
    id: int
    plan_id: int
    profile_id: int
    rating: int
    difficulty_rating: Optional[int] = None
    enjoyment_rating: Optional[int] = None
    effectiveness_rating: Optional[int] = None
    comment: Optional[str] = None
    tags: Optional[str] = None
    completed_pct: Optional[int] = None
    weeks_followed: Optional[int] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ==================== ADAPTATION LOG SCHEMAS ====================

AdaptationTrigger = Literal["weekly_review", "feedback", "stagnation", "goal_change", "manual"]
AdaptationType = Literal[
    "increase_volume", "decrease_intensity", "change_split",
    "adjust_calories", "suggest_deload", "level_up",
    "maintain", "general_advice",
]
AdaptationStatus = Literal["pending", "accepted", "rejected", "auto_applied"]

class AdaptationLogOut(BaseModel):
    id: int
    profile_id: int
    plan_id: Optional[int] = None
    trigger: str
    adaptation_type: str
    reason: str
    suggestion_json: Optional[dict] = None
    status: str
    user_response: Optional[str] = None
    responded_at: Optional[datetime] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AdaptationRespondIn(BaseModel):
    status: Literal["accepted", "rejected"]
    user_response: Optional[str] = Field(default=None, max_length=300)


# ==================== EXERCISE SCHEMAS ====================

ExerciseCategory = Literal["peito", "costas", "pernas", "ombros", "biceps", "triceps", "abdomen", "cardio", "full_body"]
ExerciseDifficulty = Literal["iniciante", "intermedio", "avancado"]

class ExerciseOut(BaseModel):
    id: int
    name: str
    name_en: Optional[str] = None
    category: str
    muscle_primary: str
    muscle_secondary: Optional[str] = None
    difficulty: str
    equipment: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    gif_url: Optional[str] = None
    instructions: Optional[str] = None
    tips: Optional[str] = None
    common_mistakes: Optional[str] = None
    default_sets: Optional[int] = 3
    default_reps: Optional[str] = "8-12"
    default_rest_sec: Optional[int] = 60
    is_compound: int = 1
    calories_per_min: Optional[float] = None
    model_config = ConfigDict(from_attributes=True)

class ExerciseListOut(BaseModel):
    id: int
    name: str
    category: str
    muscle_primary: str
    difficulty: str
    equipment: Optional[str] = None
    image_url: Optional[str] = None
    is_compound: int = 1
    model_config = ConfigDict(from_attributes=True)

class ExerciseFilterIn(BaseModel):
    category: Optional[str] = None
    difficulty: Optional[str] = None
    equipment: Optional[str] = None
    muscle: Optional[str] = None
    search: Optional[str] = None


# ==================== DAILY PLAN SCHEMAS ====================

class DailyPlanGenerateIn(BaseModel):
    profile_id: int
    date: Optional[str] = Field(default=None, description="YYYY-MM-DD, defaults to tomorrow")

class DailyPlanAdjustIn(BaseModel):
    plan_id: int
    constraint: str = Field(min_length=2, max_length=500)

class DailyPlanOut(BaseModel):
    id: int
    profile_id: int
    date: str
    workout: dict
    meals: dict
    adjustments: Optional[list] = None
    status: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)