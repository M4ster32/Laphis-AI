"""
LAPHIS AI Engine — Camada unificada de integração com OpenAI.

Fornece IA real quando OPENAI_API_KEY está configurada,
com fallback gracioso para o sistema de regras (recommender.py).

Funções principais:
- is_ai_available()        → verifica se a chave está configurada
- ai_chat()                → respostas de chat com contexto do perfil
- ai_generate_plan()       → geração de planos estruturados
- ai_daily_plan()          → plano diário (treino + refeições)
- ai_adaptation_analysis() → análise inteligente de adaptação
"""
import os
import json
import re
import logging
import httpx
from typing import Optional

logger = logging.getLogger("laphis.ai_engine")

# --------------- CONFIG ---------------

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
CHAT_MODEL = os.getenv("LAPHIS_CHAT_MODEL", "gpt-4o-mini")
API_URL = "https://api.openai.com/v1/chat/completions"


# --------------- CATALOGO DE EXERCICIOS COM ANIMACAO ---------------
# Lista canonica dos 33 exercicios que tem stickman animation no frontend.
# A IA SO pode recomendar exercicios desta lista — assim cada exercicio
# recomendado tem uma animacao dedicada (sem cair em fallbacks genericos).
# Se a IA precisar de mencionar variacoes, deve usar o nome canonico mais proximo.

ANIMATED_EXERCISES = {
    "Peito": [
        "Supino reto com barra",
        "Supino inclinado com halteres",
        "Flexões",
        "Crucifixo com halteres",
        "Dips / Fundos em paralelas",
    ],
    "Costas": [
        "Pull-up / Barra fixa",
        "Lat pulldown / Puxada frontal",
        "Remada com barra",
        "Levantamento terra / Deadlift",
        "Face pull",
    ],
    "Ombros": [
        "Press militar com barra",
        "Elevação lateral com halteres",
        "Elevação frontal com halteres",
        "Encolhimento / Shrug",
    ],
    "Bíceps": [
        "Rosca direta com barra",
        "Rosca alternada com halteres",
        "Rosca martelo",
    ],
    "Tríceps": [
        "Extensão de tríceps na polia",
        "Tríceps testa / Skull crusher",
    ],
    "Pernas": [
        "Agachamento com barra",
        "Stiff / Romanian deadlift",
        "Leg press",
        "Cadeira extensora / Leg extension",
        "Mesa flexora / Leg curl",
        "Afundo / Lunge",
        "Elevação de panturrilha",
        "Hip thrust",
        "Ponte de glúteo / Glute bridge",
    ],
    "Abdómen / Core": [
        "Prancha / Plank",
        "Crunch / Abdominal",
        "Elevação de pernas / Leg raise",
        "Russian twist",
    ],
    "Cardio / Full Body": [
        "Burpee",
        "Mountain climber / Escalador",
        "Polichinelos / Jumping jacks",
        "Kettlebell swing",
        "Corrida no lugar / High knees",
    ],
}


HOME_EXERCISES = {
    "Peito / Tríceps (sem equipamento)": [
        "Flexões",
        "Dips / Fundos em paralelas (usar cadeira ou bancada)",
    ],
    "Costas / Bíceps (opcional: barra de porta)": [
        "Pull-up / Barra fixa (se tiver barra de porta — menciona que é opcional)",
    ],
    "Pernas / Glúteos (sem equipamento)": [
        "Agachamento (peso corporal)",
        "Afundo / Lunge",
        "Elevação de panturrilha",
        "Ponte de glúteo / Glute bridge",
    ],
    "Abdómen / Core (sem equipamento)": [
        "Prancha / Plank",
        "Crunch / Abdominal",
        "Elevação de pernas / Leg raise",
        "Russian twist",
    ],
    "Cardio / Full Body (sem equipamento)": [
        "Burpee",
        "Mountain climber / Escalador",
        "Polichinelos / Jumping jacks",
        "Corrida no lugar / High knees",
    ],
}

HOME_KEYWORDS = [
    "casa", "home", "sem ginásio", "sem ginasio", "sem equipamento",
    "bodyweight", "calistenia", "calisthenics", "sem material",
    "apartamento", "quarto", "sala",
]


def _detect_home_workout(text: str) -> bool:
    """Devolve True se o texto indica treino em casa / sem equipamento."""
    if not text:
        return False
    lower = text.lower()
    return any(kw in lower for kw in HOME_KEYWORDS)


def _format_exercise_constraint() -> str:
    """Constroi o bloco de constraint para injetar nos system prompts."""
    lines = [
        "CATÁLOGO OBRIGATÓRIO DE EXERCÍCIOS — usa APENAS estes nomes:",
        "(cada exercício tem animação dedicada na app; usar nomes fora desta lista resulta em animação genérica)",
        "",
    ]
    for category, items in ANIMATED_EXERCISES.items():
        lines.append(f"• {category}:")
        for item in items:
            lines.append(f"   - {item}")
    lines.extend([
        "",
        "REGRAS:",
        "- Quando recomendares um exercício, copia o nome EXATAMENTE como está acima",
        "- Se o nome tem barra (e.g. 'Pull-up / Barra fixa'), usa qualquer dos lados",
        "- Para variações (ex: agachamento sumo, agachamento hack), usa o nome base ('Agachamento com barra')",
        "- NÃO inventes exercícios fora desta lista — se uma necessidade não couber, escolhe o mais próximo",
    ])
    return "\n".join(lines)


def _format_home_constraint() -> str:
    """Bloco de constraint restrito a exercícios sem equipamento de ginásio."""
    lines = [
        "⚠️ TREINO EM CASA — RESTRIÇÃO OBRIGATÓRIA DE EQUIPAMENTO:",
        "O utilizador treina EM CASA, sem acesso a ginásio, máquinas ou pesos livres.",
        "USA APENAS os exercícios desta lista reduzida (todos realizáveis sem equipamento ou com barra de porta):",
        "",
    ]
    for category, items in HOME_EXERCISES.items():
        lines.append(f"• {category}:")
        for item in items:
            lines.append(f"   - {item}")
    lines.extend([
        "",
        "NOME CORRETO PARA AGACHAMENTO EM CASA: escreve sempre 'Agachamento (peso corporal)' — NUNCA 'Agachamento com barra'.",
        "",
        "EQUIPAMENTO TOTALMENTE PROIBIDO (utilizador NÃO tem nada disso em casa):",
        "❌ Barra olímpica / barbell",
        "❌ Halteres / dumbbells",
        "❌ Kettlebell",
        "❌ Leg press (máquina)",
        "❌ Cadeira extensora / leg extension (máquina)",
        "❌ Mesa flexora / leg curl (máquina)",
        "❌ Polia / cabo / pulldown (máquina)",
        "❌ Banco de musculação com suportes",
        "❌ Qualquer máquina de ginásio",
        "",
        "Se precisares de mais volume, aumenta séries e repetições dos exercícios disponíveis.",
        "Menciona quando um exercício precisa de barra de porta (Pull-up) ou cadeira (Dips).",
    ])
    return "\n".join(lines)


EXERCISE_CONSTRAINT = _format_exercise_constraint()
HOME_EXERCISE_CONSTRAINT = _format_home_constraint()


def is_ai_available() -> bool:
    """True se a chave OpenAI está configurada e não é placeholder."""
    return bool(OPENAI_API_KEY) and OPENAI_API_KEY not in ("", "sk-xxx", "YOUR_KEY_HERE")


# --------------- CORE OpenAI CALL ---------------

async def _call_openai(
    messages: list[dict],
    max_tokens: int = 1500,
    temperature: float = 0.7,
    json_mode: bool = False,
) -> str:
    """
    Faz uma chamada à API do OpenAI via httpx.
    Retorna o texto da resposta.
    """
    if not is_ai_available():
        raise RuntimeError("OPENAI_API_KEY não configurada")

    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }
    body = {
        "model": CHAT_MODEL,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
    }
    if json_mode:
        body["response_format"] = {"type": "json_object"}

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(API_URL, headers=headers, json=body)

    if resp.status_code != 200:
        error_text = resp.text[:300]
        logger.error("OpenAI error %d: %s", resp.status_code, error_text)
        raise RuntimeError(f"OpenAI error {resp.status_code}: {error_text}")

    data = resp.json()
    usage = data.get("usage", {})
    logger.info(
        "OpenAI %s — %d tokens (prompt=%d, completion=%d)",
        CHAT_MODEL,
        usage.get("total_tokens", 0),
        usage.get("prompt_tokens", 0),
        usage.get("completion_tokens", 0),
    )
    return data["choices"][0]["message"]["content"]


# --------------- HELPERS ---------------

def _build_profile_context(profile) -> str:
    """Constrói contexto textual do perfil para os prompts."""
    parts = []
    name = getattr(profile, "name", None)
    if name:
        parts.append(f"Nome: {name}")
    age = getattr(profile, "age", None)
    if age:
        parts.append(f"Idade: {age} anos")
    sex = getattr(profile, "sex", None)
    if sex:
        parts.append(f"Sexo: {sex}")
    height = getattr(profile, "height_cm", None)
    weight = getattr(profile, "weight_kg", None)
    if height:
        parts.append(f"Altura: {height} cm")
    if weight and height:
        bmi = round(weight / ((height / 100) ** 2), 1)
        parts.append(f"Peso: {weight} kg (IMC: {bmi})")
    elif weight:
        parts.append(f"Peso: {weight} kg")

    goal_map = {
        "perder_gordura": "Perder gordura",
        "ganhar_massa": "Ganhar massa muscular",
        "manter": "Manter forma",
        "melhorar_saude": "Melhorar saúde geral",
        "ganhar_resistencia": "Ganhar resistência",
        "definicao": "Definição muscular",
    }
    goal = getattr(profile, "goal", None)
    if goal:
        parts.append(f"Objetivo: {goal_map.get(goal, goal)}")
    level = getattr(profile, "level", None)
    if level:
        parts.append(f"Nível: {level}")
    dpw = getattr(profile, "days_per_week", None)
    if dpw:
        parts.append(f"Treinos/semana: {dpw}")
    diet = getattr(profile, "diet_type", None)
    if diet and diet != "omnivoro":
        parts.append(f"Dieta: {diet}")
    allergies = getattr(profile, "allergies", None)
    if allergies:
        parts.append(f"Alergias: {allergies}")

    return "\n".join(parts) if parts else "Sem dados de perfil"


def _calc_nutrition(profile) -> dict:
    """Calcula BMR, TDEE, calorias alvo e proteína."""
    sex = getattr(profile, "sex", "masculino")
    weight = getattr(profile, "weight_kg", 70)
    height = getattr(profile, "height_cm", 175)
    age = getattr(profile, "age", 25)
    dpw = getattr(profile, "days_per_week", 3)
    goal = getattr(profile, "goal", "manter")

    if sex == "masculino":
        bmr = 88.36 + (13.4 * weight) + (4.8 * height) - (5.7 * age)
    else:
        bmr = 447.6 + (9.2 * weight) + (3.1 * height) - (4.3 * age)

    mult = {1: 1.2, 2: 1.375, 3: 1.55, 4: 1.55, 5: 1.725, 6: 1.725, 7: 1.9}
    tdee = int(bmr * mult.get(dpw, 1.55))

    if goal == "perder_gordura":
        target = tdee - 400
    elif goal == "ganhar_massa":
        target = tdee + 300
    else:
        target = tdee

    protein = int(weight * 1.8)
    return {"bmr": int(bmr), "tdee": tdee, "target_cal": target, "protein_g": protein}


# =====================================================================
#  1. AI CHAT — Respostas de chat inteligentes
# =====================================================================

CHAT_SYSTEM = """És o LAPHIS — um coach pessoal de saúde, treino e nutrição.
Fala SEMPRE em português de Portugal, tu-a-tu (2ª pessoa do singular), tom de treinador pessoal: firme, caloroso, motivador, direto.

VOZ:
- Trata o utilizador pelo primeiro nome quando disponível. Cumprimenta de forma natural; não robotizes.
- Sê conciso: respostas curtas quando a pergunta é curta. Nunca enches chouriços.
- Zero linguagem corporativa ("nesta resposta vou…"). Vai direto ao valor.
- Dá *conselhos concretos e numéricos* (cargas, reps, calorias, minutos) — não platitudes ("tenta comer melhor").

REGRAS DE RESPOSTA:
- **Personaliza com os dados fornecidos** (perfil, logs recentes, adaptações). Se referes dados, cita o número real.
- Quando existem logs recentes, refere-te a eles ("vi que treinaste 3× esta semana"). Mostra que prestas atenção.
- Usa emojis *com intenção* (no título e para separar secções), nunca a cada bullet.
- Se a pergunta é técnica, dá a resposta certa + *uma* linha sobre porquê.
- Se a pergunta é vaga ("o que faço hoje?"), assume o contexto e recomenda — não peças detalhes extra.
- Se a pergunta está fora do domínio (política, religião, etc.), redireciona de forma simpática para saúde/treino.

FORMATO:
- Linha 1: título curto com emoji principal (ex: "💪 Treino de peito em casa")
- Linhas seguintes: bullets (•). 3-7 bullets na maioria dos casos.
- Se dás um plano de treino: **exercício — séries × reps (descanso)**.
- Se dás nutrição: **alimento (quantidade) — ~Xcal, Yg proteína**.
- Termina com *uma* frase motivadora curta *só* quando faz sentido (progresso, dúvidas, começo).

NUNCA:
- Inventes dados científicos, estudos ou valores que não conheces.
- Prometas resultados garantidos ou deem conselhos médicos específicos para patologias.
- Sejas paternalista ou dês sermões sobre saúde.

Disclaimer implícito: sugestões não substituem aconselhamento médico/nutricional profissional."""


# --------- RECENT LOGS CONTEXT ---------

def _build_recent_activity_context(recent_workouts: list, recent_meals: list,
                                    recent_weight: list, water_today: int = None) -> str:
    """
    Build a compact snapshot of the last-week activity so the model can
    refer to concrete numbers ("you trained 3× this week", "yesterday you
    had 2100 kcal"). Each section is dropped when empty so we never waste
    context on zeros.

    :param recent_workouts: list of dicts {description, duration_min, calories, date}
    :param recent_meals:    list of dicts {foods, calories, meal_type, date}
    :param recent_weight:   list of dicts {weight_kg, date}
    :param water_today:     glasses consumed today (optional)
    :returns: plain-text context block, or empty string if nothing to say.
    """
    blocks: list[str] = []

    if recent_workouts:
        count = len(recent_workouts)
        total_min = sum((w.get("duration_min") or 0) for w in recent_workouts)
        total_cal = sum((w.get("calories") or 0) for w in recent_workouts)
        lines = [f"TREINOS (últimos 7 dias): {count} sessões, {total_min} min, {total_cal} kcal"]
        for w in recent_workouts[:5]:
            lines.append(
                f"  • {w.get('date', '?')} — {w.get('description') or 'treino'}"
                f" ({w.get('duration_min') or '?'} min, {w.get('calories') or '?'} kcal)"
            )
        blocks.append("\n".join(lines))

    if recent_meals:
        total_cal = sum((m.get("calories") or 0) for m in recent_meals)
        days = len({m.get("date") for m in recent_meals if m.get("date")})
        avg_day = int(total_cal / days) if days else 0
        blocks.append(
            f"REFEIÇÕES (últimos 7 dias): {len(recent_meals)} registos, "
            f"média ~{avg_day} kcal/dia"
        )

    if recent_weight and len(recent_weight) >= 2:
        first = recent_weight[0].get("weight_kg")
        last = recent_weight[-1].get("weight_kg")
        if first and last:
            delta = round(last - first, 1)
            trend = "estável" if abs(delta) < 0.3 else (f"+{delta}kg" if delta > 0 else f"{delta}kg")
            blocks.append(f"PESO: tendência {trend} ({len(recent_weight)} pesagens recentes)")

    if water_today is not None:
        blocks.append(f"HIDRATAÇÃO HOJE: {water_today} copos registados")

    return "\n\n".join(blocks)


async def ai_chat(
    profile,
    question: str,
    chat_history: list[dict] = None,
    adaptation_ctx: str = "",
    recent_activity_ctx: str = "",
) -> tuple[str, list[str]]:
    """
    Gera resposta de chat via OpenAI com contexto RAG dos documentos indexados.

    :param profile: ORM profile.
    :param question: User question.
    :param chat_history: Last N messages {role, content}.
    :param adaptation_ctx: Pending adaptation suggestions block (optional).
    :param recent_activity_ctx: Recent logs snapshot block (optional).
    :returns: (title, bullets) compatible with AskOut.
    """
    profile_ctx = _build_profile_context(profile)
    nutrition = _calc_nutrition(profile)

    system_parts = [
        f"PERFIL DO UTILIZADOR:\n{profile_ctx}",
        (
            "DADOS NUTRICIONAIS CALCULADOS:\n"
            f"- TDEE: ~{nutrition['tdee']} cal/dia\n"
            f"- Calorias alvo: ~{nutrition['target_cal']} cal/dia\n"
            f"- Proteína recomendada: ~{nutrition['protein_g']}g/dia"
        ),
    ]
    if recent_activity_ctx:
        system_parts.append(f"ATIVIDADE RECENTE:\n{recent_activity_ctx}")
    if adaptation_ctx:
        system_parts.append(adaptation_ctx)

    # Injetar contexto RAG se houver documentos indexados
    try:
        from .rag import get_single_embedding, semantic_search
        query_embedding = await get_single_embedding(question)
        rag_chunks = semantic_search(query_embedding, top_k=5)
        if rag_chunks:
            rag_parts = []
            for c in rag_chunks:
                rag_parts.append(c["content"])
            rag_ctx = "CONHECIMENTO DOS DOCUMENTOS (usa isto para enriquecer a resposta):\n\n" + "\n\n---\n\n".join(rag_parts)
            system_parts.append(rag_ctx)
    except Exception:
        pass  # Se RAG falhar, continua sem ele

    messages = [
        {"role": "system", "content": CHAT_SYSTEM},
        {"role": "system", "content": EXERCISE_CONSTRAINT},
        {"role": "system", "content": "\n\n".join(system_parts)},
    ]

    # Include conversation history so follow-ups feel continuous
    if chat_history:
        for msg in chat_history[-8:]:
            messages.append({"role": msg["role"], "content": msg["content"]})

    messages.append({"role": "user", "content": question})

    response_text = await _call_openai(messages, max_tokens=1200, temperature=0.7)

    # Parse em title + bullets
    lines = response_text.strip().split("\n")
    title = lines[0].strip() if lines else "Resposta"
    # Remover marcadores markdown do título
    title = re.sub(r'^#+\s*', '', title)
    title = title.strip("*_")
    if not title:
        title = "💡 Resposta"

    bullets = []
    for line in lines[1:]:
        stripped = line.strip()
        if stripped:
            # Normalizar bullets (-, *, •, numbered)
            stripped = re.sub(r'^[-*]\s+', '• ', stripped)
            stripped = re.sub(r'^\d+\.\s+', '• ', stripped)
            bullets.append(stripped)

    if not bullets:
        bullets = [response_text.strip()]

    return title, bullets


# =====================================================================
#  2. AI PLAN GENERATION — Planos estruturados via IA
# =====================================================================

PLAN_SYSTEM = """És o motor de geração de planos do LAPHIS.
Gera planos DETALHADOS e PERSONALIZADOS em formato JSON válido.

Regras obrigatórias:
- Respeita SEMPRE o nível, objetivo, dias por semana e dieta do utilizador
- Se o utilizador tem dieta vegetariana/vegan/pescetariana, adapta TODAS as refeições
- Se tem alergias, NÃO incluas esses alimentos de forma alguma
- Exercícios com séries, reps e tempo de descanso realistas
- Refeições com calorias calculadas para o objetivo
- Usa nomes de exercícios em português de Portugal
- Sê específico (ex: "Supino plano com barra 4×8-10" em vez de "exercício de peito")
- Para treino, organiza por dias (Dia 1, Dia 2, etc.)
- Para nutrição, organiza por refeição com horários sugeridos
- Inclui always um summary com os dados relevantes do perfil
- Se as notas indicarem treino em casa / sem equipamento, usa EXCLUSIVAMENTE exercícios sem máquinas nem pesos de ginásio

CARGAS (obrigatório para exercícios com pesos):
- Sugere sempre a carga em kg baseada no peso corporal e nível do utilizador
- Formato obrigatório: "Nome do exercício — séries×reps @Xkg (descanso Ys)"
- Exemplo: "Supino reto com barra — 4×8-10 @60kg (descanso 90s)"
- Iniciante: 20-40% do peso corporal nos grandes grupos, cargas leves nos isolados
- Intermédio: 50-70% do peso corporal nos compostos, moderado nos isolados
- Avançado: 75-100%+ nos compostos conforme o objetivo
- Para exercícios de peso corporal (flexões, prancha, etc.) NÃO colocar @kg"""


def _plan_json_schema(plan_type: str) -> str:
    """Retorna a estrutura JSON esperada para cada tipo de plano."""
    if plan_type == "training":
        return """{
  "type": "training",
  "title": "Título do plano com emoji",
  "sections": [
    {"header": "📅 Dia X — Foco muscular", "items": ["Exercício séries×reps (descanso Xs)"]}
  ],
  "summary": {"level": "string", "days_per_week": number, "goal": "string"}
}"""
    elif plan_type == "nutrition":
        return """{
  "type": "nutrition",
  "title": "Título do plano com emoji",
  "sections": [
    {"header": "🍽️ Refeição — HH:MM", "items": ["Alimento (quantidade) — Xcal, Yg proteína"]}
  ],
  "summary": {"weight_kg": number, "height_cm": number, "goal": "string", "target_calories": number, "protein_g": number}
}"""
    else:  # combined
        return """{
  "type": "combined",
  "training": {
    "title": "Título treino com emoji",
    "sections": [
      {"header": "📅 Dia X — Foco", "items": ["Exercício séries×reps (descanso)"]}
    ]
  },
  "nutrition": {
    "title": "Título nutrição com emoji",
    "sections": [
      {"header": "🍽️ Refeição — HH:MM", "items": ["Alimento — calorias, proteína"]}
    ]
  },
  "summary": {
    "level": "string", "days_per_week": number,
    "weight_kg": number, "height_cm": number,
    "goal": "string", "target_calories": number, "protein_g": number
  }
}"""


async def ai_generate_plan(profile, plan_type: str, notes: str = None) -> dict:
    """
    Gera um plano estruturado via OpenAI.
    Retorna dict pronto para content_json.
    """
    profile_ctx = _build_profile_context(profile)
    nutrition = _calc_nutrition(profile)
    schema = _plan_json_schema(plan_type)

    type_labels = {"training": "treino", "nutrition": "nutrição", "combined": "treino + nutrição"}

    user_msg = f"""Gera um plano completo de {type_labels.get(plan_type, plan_type)} para este utilizador.

PERFIL:
{profile_ctx}

DADOS NUTRICIONAIS CALCULADOS:
- BMR: {nutrition['bmr']} cal
- TDEE: {nutrition['tdee']} cal
- Calorias alvo: {nutrition['target_cal']} cal/dia
- Proteína alvo: {nutrition['protein_g']}g/dia"""

    is_home = _detect_home_workout(notes)

    if notes:
        user_msg += f"\n\nNOTAS DO UTILIZADOR: {notes}"

    exercise_block = HOME_EXERCISE_CONSTRAINT if is_home else EXERCISE_CONSTRAINT

    messages = [
        {"role": "system", "content": f"{PLAN_SYSTEM}\n\nFORMATO DE RESPOSTA — JSON válido:\n{schema}"},
        {"role": "system", "content": exercise_block},
        {"role": "user", "content": user_msg},
    ]

    response_text = await _call_openai(
        messages, max_tokens=3000, temperature=0.6, json_mode=True
    )

    try:
        plan_json = json.loads(response_text)
    except json.JSONDecodeError:
        # Tentar extrair JSON de code blocks
        match = re.search(r'```(?:json)?\s*([\s\S]*?)```', response_text)
        if match:
            plan_json = json.loads(match.group(1))
        else:
            logger.error("AI returned invalid JSON: %s", response_text[:500])
            raise RuntimeError("AI retornou JSON inválido para geração de plano")

    # Garantir que tem o tipo correto
    plan_json.setdefault("type", plan_type)
    return plan_json


# =====================================================================
#  3. AI DAILY PLAN — Plano diário estruturado
# =====================================================================

DAILY_SYSTEM = """És o motor de plano diário do LAPHIS.
Gera um plano completo para UM DIA específico.

FORMATO DE RESPOSTA — JSON válido obrigatório:
{
  "workout": {
    "title": "emoji + título descritivo",
    "focus": "descrição curta do foco do treino",
    "duration_min": number,
    "warmup": "5 min cardio leve + mobilidade articular",
    "exercises": [
      {
        "name": "Nome do exercício em PT",
        "sets": number,
        "reps": "8-10 ou 30s",
        "rest_sec": number,
        "muscle": "peito/costas/pernas/ombros/biceps/triceps/core/posterior",
        "bw": "Alternativa bodyweight"
      }
    ],
    "cooldown": "5 min alongamentos estáticos",
    "tips": ["dica 1", "dica 2"]
  },
  "meals": {
    "total_calories": number,
    "total_protein_g": number,
    "meals": [
      {
        "type": "emoji + nome da refeição",
        "time": "HH:MM",
        "foods": ["alimento (quantidade)"],
        "calories": number,
        "protein_g": number
      }
    ],
    "hydration": "💧 Beber X litros de água",
    "tips": ["dica nutricional"]
  }
}

Regras:
- Varia exercícios e refeições (não repetir sempre o mesmo)
- Adapta à dieta do utilizador (vegetariano/vegan/pescetariano)
- Respeita alergias alimentares (NÃO incluir)
- 4-7 exercícios adequados ao nível
- 4 refeições: pequeno-almoço (~08h), almoço (~13h), lanche (~16:30), jantar (~20h)
- Calorias distribuídas: 25% PA, 35% almoço, 15% lanche, 25% jantar
- Nomes em português de Portugal"""


async def ai_daily_plan(profile, target_date: str) -> dict:
    """
    Gera plano diário via OpenAI.
    Retorna dict com 'workout' e 'meals'.
    """
    from datetime import datetime as _dt

    profile_ctx = _build_profile_context(profile)
    nutrition = _calc_nutrition(profile)

    d = _dt.strptime(target_date, "%Y-%m-%d")
    weekday_names = [
        "Segunda-feira", "Terça-feira", "Quarta-feira",
        "Quinta-feira", "Sexta-feira", "Sábado", "Domingo",
    ]
    weekday = weekday_names[d.weekday()]

    messages = [
        {"role": "system", "content": DAILY_SYSTEM},
        {"role": "system", "content": EXERCISE_CONSTRAINT},
        {"role": "user", "content": (
            f"Gera um plano completo para {weekday}, {target_date}.\n\n"
            f"PERFIL:\n{profile_ctx}\n\n"
            f"NUTRIÇÃO:\n"
            f"- Calorias alvo: {nutrition['target_cal']} cal/dia\n"
            f"- Proteína alvo: {nutrition['protein_g']}g/dia\n"
            f"- Hidratação: {max(2.0, round(getattr(profile, 'weight_kg', 70) * 0.033, 1))}L/dia"
        )},
    ]

    response_text = await _call_openai(
        messages, max_tokens=2000, temperature=0.7, json_mode=True
    )

    result = json.loads(response_text)

    # Garantir estrutura mínima
    if "workout" not in result:
        result["workout"] = {"title": "Treino do dia", "exercises": [], "tips": []}
    if "meals" not in result:
        result["meals"] = {"total_calories": nutrition["target_cal"], "meals": [], "tips": []}

    return result


# =====================================================================
#  4. AI ADAPTATION ANALYSIS — Análise inteligente de adaptação
# =====================================================================

ADAPTATION_SYSTEM = """És o motor de adaptação inteligente do LAPHIS.
Analisa os dados do utilizador e sugere ajustes personalizados ao plano.

FORMATO DE RESPOSTA — JSON válido obrigatório:
{
  "suggestions": [
    {
      "trigger": "feedback|stagnation|weekly_review|goal_change",
      "adaptation_type": "increase_volume|decrease_intensity|change_split|adjust_calories|suggest_deload|level_up|general_advice",
      "reason": "Explicação clara e motivadora em português de Portugal",
      "suggestion_json": {
        "action": "string descritiva",
        "details": "informação adicional"
      }
    }
  ]
}

Regras:
- Analisa os dados objetivamente
- Sê específico nas sugestões (não genérico)
- Máximo 3 sugestões por análise
- Motiva o utilizador mesmo quando sugeres mudanças
- Se não há dados suficientes para sugerir, retorna {"suggestions": []}
- Cada sugestão deve ter um reason claro e actionable
- adaptation_type deve ser um dos valores listados acima"""


async def ai_adaptation_analysis(
    profile,
    workout_data: dict,
    feedback_data: dict = None,
) -> list[dict]:
    """
    Análise de adaptação via OpenAI.
    Retorna lista de sugestões estruturadas.
    """
    profile_ctx = _build_profile_context(profile)

    data_parts = [f"PERFIL:\n{profile_ctx}\n"]
    data_parts.append("DADOS DE TREINO (últimas 2 semanas):")
    data_parts.append(
        f"- Semana atual: {workout_data.get('wk1_count', 0)} treinos, "
        f"{workout_data.get('wk1_minutes', 0)} min total"
    )
    data_parts.append(
        f"- Semana anterior: {workout_data.get('wk2_count', 0)} treinos, "
        f"{workout_data.get('wk2_minutes', 0)} min total"
    )
    data_parts.append(f"- Dias planeados/semana: {getattr(profile, 'days_per_week', 'N/A')}")

    if feedback_data:
        data_parts.append("\nFEEDBACK RECENTE:")
        if feedback_data.get("rating"):
            data_parts.append(f"- Avaliação geral: {feedback_data['rating']}/5")
        if feedback_data.get("difficulty"):
            data_parts.append(f"- Dificuldade: {feedback_data['difficulty']}/5")
        if feedback_data.get("effectiveness"):
            data_parts.append(f"- Eficácia: {feedback_data['effectiveness']}/5")
        if feedback_data.get("completed_pct") is not None:
            data_parts.append(f"- Completado: {feedback_data['completed_pct']}%")
        if feedback_data.get("comment"):
            data_parts.append(f"- Comentário: \"{feedback_data['comment']}\"")

    messages = [
        {"role": "system", "content": ADAPTATION_SYSTEM},
        {"role": "user", "content": "\n".join(data_parts)},
    ]

    response_text = await _call_openai(
        messages, max_tokens=1000, temperature=0.5, json_mode=True
    )

    result = json.loads(response_text)
    return result.get("suggestions", [])
