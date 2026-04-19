"""
Modelos SQLAlchemy para a base de dados LAPHIS
Define as tabelas e relacionamentos
"""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from .db import Base


class Profile(Base):
    """
    Modelo de Perfil do Utilizador
    Informações pessoais e objetivos de treino/nutrição
    """
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(60), nullable=False)
    age = Column(Integer, nullable=False)
    sex = Column(String(20), nullable=False)  # "masculino", "feminino", "outro"
    height_cm = Column(Integer, nullable=False)
    weight_kg = Column(Float, nullable=False)
    goal = Column(String(50), nullable=False)  # "perder_gordura", "ganhar_massa", "manter"
    level = Column(String(50), nullable=False)  # "iniciante", "intermedio", "avancado"
    days_per_week = Column(Integer, nullable=False)
    diet_type = Column(String(100), nullable=True)  # texto livre ou predefinido
    allergies = Column(String(500), nullable=True)  # comma-separated: "glúten, lactose, frutos secos"
    avatar = Column(Text, nullable=True)  # preset_1..preset_10, URL ou base64 data URL

    # Relacionamentos
    user = relationship("User", back_populates="profile")
    workout_logs = relationship("WorkoutLog", back_populates="profile", cascade="all, delete-orphan")
    meal_logs = relationship("MealLog", back_populates="profile", cascade="all, delete-orphan")
    plans = relationship("Plan", back_populates="profile", cascade="all, delete-orphan")
    progress_snapshots = relationship("ProgressSnapshot", back_populates="profile", cascade="all, delete-orphan")
    plan_feedback = relationship("PlanFeedback", back_populates="profile", cascade="all, delete-orphan")
    adaptation_logs = relationship("AdaptationLog", back_populates="profile", cascade="all, delete-orphan")
    daily_plans = relationship("DailyPlan", back_populates="profile", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Profile(id={self.id}, user_id={self.user_id}, name={self.name}, goal={self.goal})>"


class WorkoutLog(Base):
    """
    Modelo de Histórico de Treino
    Regista treinos realizados por um perfil
    """
    __tablename__ = "workout_logs"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"), nullable=False, index=True)
    date = Column(String(10), nullable=False)  # "YYYY-MM-DD"
    description = Column(Text, nullable=True)  # Descrição do treino
    duration_min = Column(Integer, nullable=True)
    calories = Column(Integer, nullable=True)  # Calorias queimadas
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relacionamento
    profile = relationship("Profile", back_populates="workout_logs")

    def __repr__(self):
        return f"<WorkoutLog(id={self.id}, profile_id={self.profile_id}, date={self.date})>"


class MealLog(Base):
    """
    Modelo de Histórico de Refeição
    Regista refeições consumidas por um perfil
    """
    __tablename__ = "meal_logs"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"), nullable=False, index=True)
    date = Column(String(10), nullable=False)  # "YYYY-MM-DD"
    meal = Column(String(50), nullable=True)  # "pequeno_almoco", "almoco", "jantar", "snack"
    foods = Column(Text, nullable=True)  # Descrição dos alimentos
    calories = Column(Integer, nullable=True)
    protein_g = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relacionamento
    profile = relationship("Profile", back_populates="meal_logs")

    def __repr__(self):
        return f"<MealLog(id={self.id}, profile_id={self.profile_id}, date={self.date})>"


class WaterLog(Base):
    """
    Modelo de Registo de Água
    Acompanha a hidratação diária do utilizador
    """
    __tablename__ = "water_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    date = Column(String(10), nullable=False)  # "YYYY-MM-DD"
    glasses = Column(Integer, nullable=False, default=0)  # Copos de água (250ml cada)
    ml_total = Column(Integer, nullable=False, default=0)  # Total em ml
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relacionamento
    user = relationship("User", back_populates="water_logs")

    def __repr__(self):
        return f"<WaterLog(id={self.id}, user_id={self.user_id}, date={self.date}, glasses={self.glasses})>"


class WeightEntry(Base):
    """
    Modelo de Registo de Peso
    Acompanha a evolução do peso corporal do utilizador
    """
    __tablename__ = "weight_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    weight_kg = Column(Float, nullable=False)
    date = Column(String(10), nullable=False)  # "YYYY-MM-DD"
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relacionamento
    user = relationship("User", back_populates="weight_entries")

    def __repr__(self):
        return f"<WeightEntry(id={self.id}, user_id={self.user_id}, weight_kg={self.weight_kg})>"


class Category(Base):
    """
    Modelo de Categoria
    Cada utilizador pode criar categorias para organizar os seus planos
    Ex: "Treino de Força", "Dieta Keto", "Cardio", etc.
    """
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(60), nullable=False)
    icon = Column(String(10), nullable=True)  # emoji
    color = Column(String(20), nullable=True)  # hex color ex: "#9B6A4A"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relacionamentos
    user = relationship("User", back_populates="categories")
    plans = relationship("Plan", back_populates="category")

    def __repr__(self):
        return f"<Category(id={self.id}, user_id={self.user_id}, name={self.name})>"


class User(Base):
    """
    Modelo de Utilizador
    Armazena informações do utilizador para chat/IA
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(120), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    goal = Column(String(50), nullable=True)  # "perder_gordura", "ganhar_massa", "manter"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Email verification
    email_verified = Column(Integer, default=0, nullable=False)  # 0=não, 1=sim
    verification_code = Column(String(10), nullable=True)
    verification_code_expires = Column(DateTime, nullable=True)

    # Password reset
    reset_code = Column(String(10), nullable=True)
    reset_code_expires = Column(DateTime, nullable=True)

    # Relacionamentos
    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
    weekly_summaries = relationship("WeeklySummary", back_populates="user", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="user", cascade="all, delete-orphan")
    zen_sessions = relationship("ZenSession", back_populates="user", cascade="all, delete-orphan")
    water_logs = relationship("WaterLog", back_populates="user", cascade="all, delete-orphan")
    weight_entries = relationship("WeightEntry", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, goal={self.goal})>"


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(120), nullable=False, default="Nova conversa")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)

    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ChatSession(id={self.id}, user_id={self.user_id}, title={self.title})>"


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=True, index=True)
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    user = relationship("User", back_populates="messages")
    session = relationship("ChatSession", back_populates="messages")

    def __repr__(self):
        return f"<ChatMessage(id={self.id}, user_id={self.user_id}, role={self.role})>"


class WeeklySummary(Base):
    __tablename__ = "weekly_summaries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    week_start = Column(String(10), nullable=False)
    week_end = Column(String(10), nullable=False)
    summary_text = Column(Text, nullable=False)
    highlights = Column(JSON, nullable=True)
    suggestions = Column(JSON, nullable=True)
    stats = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="weekly_summaries")

    def __repr__(self):
        return f"<WeeklySummary(id={self.id}, user_id={self.user_id}, week_start={self.week_start})>"


class Plan(Base):
    """
    Modelo de Plano (Treino / Nutrição / Combinado)
    Armazena planos gerados pela IA e guardados pelo utilizador
    """
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True, index=True)
    type = Column(String(20), nullable=False)  # "training", "nutrition", "combined"
    title = Column(String(200), nullable=False)
    content_json = Column(JSON, nullable=False)  # Plano estruturado em JSON
    notes = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="active")  # "active", "archived"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relacionamentos
    profile = relationship("Profile", back_populates="plans")
    category = relationship("Category", back_populates="plans")
    feedback = relationship("PlanFeedback", back_populates="plan", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Plan(id={self.id}, profile_id={self.profile_id}, type={self.type}, status={self.status})>"


class ZenSession(Base):
    """
    Modelo de Sessão Zen (Meditação / Respiração)
    Regista sessões de mindfulness realizadas pelo utilizador
    """
    __tablename__ = "zen_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String(20), nullable=False)  # "breathing", "meditation"
    duration_min = Column(Integer, nullable=False)
    mood_before = Column(String(20), nullable=True)  # "calm", "stressed", "anxious", etc.
    mood_after = Column(String(20), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relacionamento
    user = relationship("User", back_populates="zen_sessions")

    def __repr__(self):
        return f"<ZenSession(id={self.id}, user_id={self.user_id}, type={self.type}, duration_min={self.duration_min})>"


# ==================== PREPARAÇÃO PARA IA FUTURA ====================

class ProgressSnapshot(Base):
    """
    Snapshot periódico de métricas do utilizador.
    Guarda o estado num dado momento para a futura IA poder analisar tendências
    e decidir adaptações (peso, volume de treino, calorias, streaks, etc.).
    """
    __tablename__ = "progress_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"), nullable=False, index=True)
    date = Column(String(10), nullable=False, index=True)  # "YYYY-MM-DD"

    # Métricas corporais
    weight_kg = Column(Float, nullable=True)
    body_fat_pct = Column(Float, nullable=True)  # preparado para futuro

    # Métricas de treino (agregadas da semana)
    workouts_count = Column(Integer, default=0)
    total_workout_min = Column(Integer, default=0)
    total_calories_burned = Column(Integer, default=0)

    # Métricas de nutrição (agregadas da semana)
    meals_count = Column(Integer, default=0)
    avg_daily_calories = Column(Integer, default=0)
    avg_daily_protein_g = Column(Integer, default=0)

    # Métricas de bem-estar
    zen_sessions_count = Column(Integer, default=0)
    avg_mood_score = Column(Float, nullable=True)  # 1-5 numérico, derivado do mood
    sleep_hours = Column(Float, nullable=True)  # preparado para wearables

    # Métricas de consistência
    workout_streak = Column(Integer, default=0)
    adherence_pct = Column(Float, nullable=True)  # % do plano cumprido

    # Contexto do snapshot
    goal_at_time = Column(String(50), nullable=True)  # objetivo no momento
    level_at_time = Column(String(50), nullable=True)  # nível no momento
    active_plan_id = Column(Integer, ForeignKey("plans.id"), nullable=True)

    # Meta
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relacionamentos
    profile = relationship("Profile", back_populates="progress_snapshots")
    active_plan = relationship("Plan", foreign_keys=[active_plan_id])

    def __repr__(self):
        return f"<ProgressSnapshot(id={self.id}, profile_id={self.profile_id}, date={self.date})>"


class PlanFeedback(Base):
    """
    Feedback do utilizador sobre um plano.
    Dados essenciais para a futura IA aprender o que funciona/não funciona.
    """
    __tablename__ = "plan_feedback"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=False, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"), nullable=False, index=True)

    # Classificação geral (1-5 estrelas)
    rating = Column(Integer, nullable=False)  # 1=muito mau, 5=excelente

    # Dimensões específicas (1-5 cada, nullable para simplicidade)
    difficulty_rating = Column(Integer, nullable=True)  # 1=muito fácil, 5=impossível
    enjoyment_rating = Column(Integer, nullable=True)   # 1=odiou, 5=adorou
    effectiveness_rating = Column(Integer, nullable=True)  # 1=sem resultado, 5=muito eficaz

    # Feedback qualitativo
    comment = Column(Text, nullable=True)
    tags = Column(String(255), nullable=True)  # "muito_dificil,falta_tempo,bom_resultado" etc.

    # Dados de contexto (snapshot do momento)
    completed_pct = Column(Integer, nullable=True)  # % do plano que completou (0-100)
    weeks_followed = Column(Integer, nullable=True)  # semanas a seguir este plano

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relacionamentos
    plan = relationship("Plan", back_populates="feedback")
    profile = relationship("Profile", back_populates="plan_feedback")

    def __repr__(self):
        return f"<PlanFeedback(id={self.id}, plan_id={self.plan_id}, rating={self.rating})>"


class AdaptationLog(Base):
    """
    Registo de cada sugestão/adaptação feita pelo sistema.
    Audit trail para a futura IA — guarda o que foi sugerido, porquê, e se o user aceitou.
    """
    __tablename__ = "adaptation_logs"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"), nullable=False, index=True)
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=True, index=True)

    # Tipo de adaptação
    trigger = Column(String(50), nullable=False)  # "weekly_review", "feedback", "stagnation", "goal_change", "manual"
    adaptation_type = Column(String(50), nullable=False)  # "increase_volume", "decrease_intensity", "change_split", "adjust_calories", "suggest_deload", "level_up"

    # O que o sistema decidiu
    reason = Column(Text, nullable=False)  # Explicação legível (ex: "3 semanas sem progressão de carga")
    suggestion_json = Column(JSON, nullable=True)  # Dados estruturados da sugestão

    # Dados de input usados para a decisão
    input_snapshot_id = Column(Integer, ForeignKey("progress_snapshots.id"), nullable=True)
    input_data_json = Column(JSON, nullable=True)  # Métricas que levaram à decisão

    # Resultado
    status = Column(String(20), nullable=False, default="pending")  # "pending", "accepted", "rejected", "auto_applied"
    user_response = Column(Text, nullable=True)  # Resposta/comentário do user
    responded_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relacionamentos
    profile = relationship("Profile", back_populates="adaptation_logs")
    plan = relationship("Plan")
    input_snapshot = relationship("ProgressSnapshot", foreign_keys=[input_snapshot_id])

    def __repr__(self):
        return f"<AdaptationLog(id={self.id}, profile_id={self.profile_id}, trigger={self.trigger}, status={self.status})>"


class DailyPlan(Base):
    """
    Plano Diário Adaptativo
    Gerado pela IA para um dia específico, com treino + refeições.
    O utilizador pode ajustar em tempo real com constraints naturais.
    """
    __tablename__ = "daily_plans"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"), nullable=False, index=True)
    date = Column(String(10), nullable=False, index=True)  # "YYYY-MM-DD"
    workout = Column(JSON, nullable=False)
    meals = Column(JSON, nullable=False)
    adjustments = Column(JSON, nullable=True)  # list of adjustment records
    status = Column(String(20), nullable=False, default="active")  # "active", "completed", "skipped"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationship
    profile = relationship("Profile", back_populates="daily_plans")

    def __repr__(self):
        return f"<DailyPlan(id={self.id}, profile_id={self.profile_id}, date={self.date}, status={self.status})>"

