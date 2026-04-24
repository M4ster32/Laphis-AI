"""
Hard facts about the LAPHIS codebase.

Kept deliberately flat (dicts, lists of tuples) so it can be consumed by
any renderer without coupling to docx/pptx. When a number changes in the
real code (e.g. a new router is added), it is updated here and both the
report and the deck regenerate with consistent data.
"""

# ---------------------------------------------------------------------------
# Top-level identity
# ---------------------------------------------------------------------------

PROJECT = {
    "name": "LAPHIS",
    "full_name": "Life and Physical Health Intelligent System",
    "tagline": "Plataforma Inteligente de Saúde e Fitness com IA Conversacional",
    "author": "Henrique Fernandes",
    "group": "M4ster32",
    "university": "Universidade Lusófona",
    "faculty": "Centro Universitário do Porto (CUP)",
    "department": "Departamento de Engenharia Informática e Sistemas de Informação",
    "degree": "Licenciatura em Engenharia Informática",
    "course": "Projeto II",
    "delivery": "Relatório Intercalar",
    "date": "Abril 2026",
    "repo": "https://github.com/M4ster32/Laphis.git",
    "frontend_url": "https://laphis.vercel.app",
}


# ---------------------------------------------------------------------------
# Backend routers with endpoint count (from real codebase audit).
# Tuple shape: (router_name, endpoint_count, short_description).
# ---------------------------------------------------------------------------

BACKEND_ROUTERS = [
    ("auth", 14, "Registo, login, verificação email, reset password"),
    ("plans", 11, "CRUD de planos, geração e feedback"),
    ("adaptation", 11, "Log e triggers de adaptação de planos"),
    ("chat", 8, "Sessões e mensagens do assistente IA"),
    ("progress", 8, "Snapshots e métricas de progresso"),
    ("reports", 7, "Resumos semanais e exportação"),
    ("logs", 6, "Treinos e refeições unificados"),
    ("exercises", 6, "Catálogo e recomendação de exercícios"),
    ("daily_plan", 6, "Plano diário adaptativo"),
    ("zen", 5, "Sessões de meditação"),
    ("weight", 5, "Registo de peso e BMI"),
    ("water", 5, "Registo de hidratação"),
    ("categories", 5, "Categorias personalizáveis"),
    ("rag_ingest", 4, "Upload e indexação de PDFs"),
    ("rag_ask", 4, "Pergunta contextualizada sobre PDFs"),
    ("profile", 4, "Gestão do perfil biométrico"),
    ("ask", 3, "Ask-anything sobre dados do utilizador"),
    ("ingest", 1, "Ingestão genérica de documentos"),
    ("health", 1, "Health check"),
]


# ---------------------------------------------------------------------------
# Stacks used across report tables and presentation columns.
# ---------------------------------------------------------------------------

BACKEND_STACK = [
    ("Python", "3.11+", "Linguagem base"),
    ("FastAPI", "0.104+", "Async + OpenAPI auto"),
    ("SQLAlchemy", "2.0", "ORM type-safe"),
    ("Pydantic", "2.x", "Validação de dados"),
    ("Uvicorn", "0.24+", "Servidor ASGI"),
    ("PyJWT", "2.12+", "Tokens JWT"),
    ("bcrypt", "4.1+", "Hashing de passwords"),
    ("OpenAI SDK", "1.14+", "Chat + planos + RAG"),
    ("PyMuPDF", "1.24+", "Extração PDF"),
    ("pytest + httpx", "—", "Testes async"),
]

FRONTEND_STACK = [
    ("React", "19.2", "UI concurrent"),
    ("Vite", "8.0 beta", "HMR instantâneo"),
    ("React Router", "7.13", "Routing aninhado"),
    ("Lucide React", "0.577", "Iconografia"),
    ("Recharts", "3.8", "Gráficos SVG"),
    ("jsPDF", "4.2", "Export PDF"),
    ("ESLint", "—", "Linting"),
]

INFRA_STACK = [
    ("Vercel", "Hosting frontend"),
    ("Render", "Backend + PostgreSQL"),
    ("GitHub", "CI/CD automático"),
    ("Docker", "Build reprodutível"),
    ("SMTP", "Emails transacionais"),
]


# ---------------------------------------------------------------------------
# Data model entities (17 entities around User).
# ---------------------------------------------------------------------------

ENTITIES = [
    ("User", "id, email, hashed_password, is_verified, verify_code, reset_token",
     "Autenticação e identidade raiz."),
    ("Profile", "user_id, age, weight, height, goal, activity, diet_type",
     "Dados biométricos."),
    ("Plan", "user_id, title, type, content, is_active, feedback",
     "Planos personalizados."),
    ("ChatSession", "user_id, title, created_at, expires_at",
     "Sessões de chat."),
    ("ChatMessage", "session_id, role, content, created_at",
     "Mensagens do chat."),
    ("WorkoutLog", "user_id, exercise, duration, calories, category, logged_at",
     "Registos de treino."),
    ("MealLog", "user_id, food_name, calories, protein, carbs, fat, meal_type",
     "Registos de refeição."),
    ("WaterLog", "user_id, amount_ml, logged_at",
     "Hidratação."),
    ("WeightEntry", "user_id, weight_kg, logged_at",
     "Histórico de peso."),
    ("ZenSession", "user_id, type, duration_min, mood_before, mood_after, notes",
     "Sessões de meditação."),
    ("Category", "user_id, name, type, icon, color",
     "Categorias personalizáveis."),
    ("DailyPlan", "user_id, date, plan_data, status",
     "Plano diário adaptativo."),
    ("ProgressSnapshot", "user_id, date, metrics",
     "Snapshots de progresso."),
    ("AdaptationLog", "user_id, trigger, old_params, new_params, reason",
     "Log de adaptações."),
    ("PlanFeedback", "plan_id, rating, comment, created_at",
     "Feedback sobre planos."),
    ("WeeklySummary",
     "user_id, week_start, avg_calories, total_workouts, recommendations",
     "Resumos semanais."),
    ("RAGDocument", "user_id, filename, text_chunks, uploaded_at",
     "PDFs indexados."),
]


# ---------------------------------------------------------------------------
# Frontend inventory.
# ---------------------------------------------------------------------------

FRONTEND_PAGES = [
    ("Home", "landing page pública"),
    ("Login / Register", "fluxos de entrada"),
    ("VerifyEmail / Forgot / Reset", "fluxos de recuperação"),
    ("Dashboard", "KPIs do dia e atalhos"),
    ("Logs", "treinos e refeições unificados"),
    ("Plans / PlanDetail", "planos gerados e detalhe"),
    ("DailyPlan", "plano adaptativo"),
    ("Chat", "assistente IA"),
    ("Reports", "gráficos semanais + export PDF"),
    ("Zen", "meditação guiada"),
    ("Profile / Settings", "perfil biométrico e preferências"),
]

FRONTEND_COMPONENTS = [
    "Button", "Card", "Modal", "Form", "Toast", "Skeleton", "Icon",
    "AvatarPicker", "PasswordInput", "EmptyState", "ExerciseCard",
    "GeneratePlanModal", "index",
]


# ---------------------------------------------------------------------------
# Requirements (functional and non-functional), with honest intercalar status.
# Tuple shape: (id, name, description, status).
# ---------------------------------------------------------------------------

FUNCTIONAL_REQUIREMENTS = [
    ("RF01", "Registo e autenticação",
     "Criação de conta, verificação email, login, reset password, JWT.",
     "Realizado"),
    ("RF02", "Gestão de perfil",
     "Dados biométricos: idade, peso, altura, objetivo, atividade, dieta.",
     "Realizado"),
    ("RF03", "Registo de treinos",
     "Treinos com exercício, duração, calorias, categoria.",
     "Realizado"),
    ("RF04", "Registo de refeições",
     "Refeições com alimento, calorias e macronutrientes.",
     "Realizado"),
    ("RF05", "Tracking hidratação",
     "Registo em ml com meta diária calculada.",
     "Realizado"),
    ("RF06", "Tracking de peso",
     "Histórico de peso com BMI e tendência.",
     "Realizado"),
    ("RF07", "Planos personalizados",
     "Geração e gestão de planos de treino e nutrição com feedback.",
     "Realizado"),
    ("RF08", "Plano diário adaptativo",
     "Plano do dia automático com treinos e refeições, ajustável.",
     "Parcial"),
    ("RF09", "Chat IA conversacional",
     "Sessões com contexto do perfil do utilizador.",
     "Realizado"),
    ("RF10", "Relatórios e gráficos",
     "Visualização semanal e exportação PDF.",
     "Realizado"),
    ("RF11", "Sessões de meditação",
     "Registo Zen com humor antes/depois.",
     "Realizado"),
    ("RF12", "Categorias personalizáveis",
     "Definição de categorias próprias de treino e refeição.",
     "Realizado"),
    ("RF13", "Pipeline RAG sobre PDFs",
     "Upload, extração e consulta em linguagem natural.",
     "Parcial"),
    ("RF14", "Notificações push",
     "Lembretes via Service Worker.",
     "Planeado"),
    ("RF15", "Integração wearables",
     "Sincronização com Apple Health, Fitbit, Google Fit.",
     "Planeado"),
]

NON_FUNCTIONAL_REQUIREMENTS = [
    ("RNF01", "Performance", "Resposta da API < 2s em operações típicas.",
     "Realizado"),
    ("RNF02", "Segurança", "bcrypt, JWT stateless, HTTPS.",
     "Realizado"),
    ("RNF03", "Responsividade", "Mobile-first, tablet e desktop.",
     "Realizado"),
    ("RNF04", "Disponibilidade", "Uptime ≥ 99%, health checks.",
     "Realizado"),
    ("RNF05", "Testabilidade", "Mínimo 50 testes automatizados.",
     "Realizado (62)"),
    ("RNF06", "Manutenibilidade", "Código sem deprecations, linting ativo.",
     "Realizado"),
    ("RNF07", "Acessibilidade", "WCAG AA, modo escuro completo.",
     "Realizado"),
    ("RNF08", "Escalabilidade", "Stateless, BD substituível (SQLite ↔ PG).",
     "Realizado"),
    ("RNF09", "Internacionalização", "Mensagens isoladas; i18n completo previsto.",
     "Parcial"),
    ("RNF10", "Privacidade", "Dados locais, sem terceiros sem consentimento.",
     "Realizado"),
]


# ---------------------------------------------------------------------------
# Use cases, test modules, metrics, siglas, references.
# ---------------------------------------------------------------------------

USE_CASES = [
    ("UC01", "Registar conta e verificar email"),
    ("UC02", "Autenticar e manter sessão"),
    ("UC03", "Preencher perfil biométrico"),
    ("UC04", "Registar treino"),
    ("UC05", "Registar refeição"),
    ("UC06", "Registar hidratação"),
    ("UC07", "Registar peso e visualizar tendência"),
    ("UC08", "Gerar plano personalizado"),
    ("UC09", "Conversar com assistente IA"),
    ("UC10", "Visualizar relatório semanal e exportar PDF"),
    ("UC11", "Carregar documento PDF e consultar conteúdo"),
    ("UC12", "Registar sessão de meditação"),
]

TEST_MODULES = [
    ("test_auth.py", "~10",
     "Registo, login, verificação email, reset, tokens inválidos."),
    ("test_profile.py", "~8",
     "Criar, atualizar, obter perfil; validação de campos."),
    ("test_logs.py", "~12",
     "CRUD treinos e refeições; listagem paginada; filtros."),
    ("test_water.py", "~8",
     "Registo de água, total diário, histórico, meta."),
    ("test_weight.py", "~8",
     "Registo de peso, histórico, tendência, BMI."),
    ("test_plans.py", "~10",
     "Gerar, guardar, listar, atualizar, eliminar planos; feedback."),
    ("test_zen.py", "~6",
     "Criar sessão, listar, estatísticas, tipos."),
]

METRICS = {
    "backend_lines": "~6.900",
    "frontend_lines": "~13.400",
    "total_lines": "~20.300",
    "entity_count": 17,
    "router_count": 19,
    "endpoint_total": sum(n for _, n, _ in BACKEND_ROUTERS),
    "test_count": 62,
    "test_warnings": 0,
    "recommender_lines": 857,
    "pages_count": 17,
    "component_count": 13,
}

SIGLAS = [
    ("API", "Application Programming Interface"),
    ("BMI", "Body Mass Index (Índice de Massa Corporal)"),
    ("CI/CD", "Continuous Integration / Continuous Deployment"),
    ("CORS", "Cross-Origin Resource Sharing"),
    ("CRUD", "Create, Read, Update, Delete"),
    ("CSS", "Cascading Style Sheets"),
    ("HTTP", "HyperText Transfer Protocol"),
    ("IA", "Inteligência Artificial"),
    ("JSON", "JavaScript Object Notation"),
    ("JWT", "JSON Web Token"),
    ("LLM", "Large Language Model"),
    ("ORM", "Object-Relational Mapping"),
    ("PDF", "Portable Document Format"),
    ("RAG", "Retrieval-Augmented Generation"),
    ("REST", "Representational State Transfer"),
    ("SPA", "Single-Page Application"),
    ("SQL", "Structured Query Language"),
    ("TDEE", "Total Daily Energy Expenditure"),
    ("TFC", "Trabalho Final de Curso"),
    ("UML", "Unified Modeling Language"),
]

REFERENCES = [
    ("[CiAl24]",
     "B. P. Cipriano e P. Alves, Seven Years Later: Lessons Learned in "
     "Automated Assessment, 5th International Computer Programming Education "
     "Conference, ICPEC 2024, Lisboa, Portugal, jun. 2024."),
    ("[DEISI24]",
     "DEISI, Regulamento de Trabalho Final de Curso, Universidade Lusófona, "
     "set. 2024."),
    ("[FaAP23]",
     "FastAPI Documentation, FastAPI — Modern, fast web framework for "
     "building APIs, 2023. https://fastapi.tiangolo.com/ (website)"),
    ("[HaBe18]",
     "J. A. Harris e F. G. Benedict, A Biometric Study of Human Basal "
     "Metabolism, PNAS, 1918."),
    ("[OpAI24]",
     "OpenAI, OpenAI Platform Documentation, 2024. "
     "https://platform.openai.com/docs (website)"),
    ("[ReAc24]",
     "React Documentation, React — The library for web and native user "
     "interfaces, Meta, 2024. https://react.dev/ (website)"),
    ("[SQLA23]",
     "SQLAlchemy Documentation, SQLAlchemy 2.0 — The Python SQL Toolkit and "
     "ORM, 2023. https://www.sqlalchemy.org/ (website)"),
    ("[TaWe20]",
     "A. Tanenbaum e D. Wetherall, Computer Networks, 6ª Edição, Prentice "
     "Hall, USA, 2020. (livro)"),
    ("[ULHT24]",
     "Universidade Lusófona de Humanidades e Tecnologias, www.ulusofona.pt, "
     "out. 2024. (website)"),
    ("[VeRe24]",
     "Vercel Documentation, Vercel — Develop. Preview. Ship., 2024. "
     "https://vercel.com/docs (website)"),
    ("[WHO24]",
     "World Health Organization, Physical Activity Guidelines, 2024. "
     "https://www.who.int/ (website)"),
]
