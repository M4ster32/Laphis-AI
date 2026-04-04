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

CHAT_SYSTEM = """És o LAPHIS, um assistente AI pessoal de saúde, treino e nutrição.
Responde SEMPRE em português de Portugal.

Regras:
- Personaliza TODAS as respostas com os dados do utilizador fornecidos
- Sê direto, amigável e profissional. Usa emojis com moderação
- Formata respostas com bullet points (•) e secções quando apropriado
- Para planos de treino: especifica exercícios, séries, reps e descanso
- Para nutrição: inclui calorias aproximadas e macros baseados no perfil
- Se não souberes algo com certeza, diz honestamente
- Nunca inventes dados científicos ou valores sem base
- Sê conciso mas completo — parágrafos curtos
- Começa a resposta com um título curto e descritivo (com emoji)
- Depois do título, usa bullet points para organizar a informação

Disclaimer implícito: as tuas sugestões não substituem aconselhamento médico/nutricional profissional."""


async def ai_chat(
    profile,
    question: str,
    chat_history: list[dict] = None,
) -> tuple[str, list[str]]:
    """
    Gera resposta de chat via OpenAI.
    Retorna (title, bullets) compatível com AskOut.
    """
    profile_ctx = _build_profile_context(profile)
    nutrition = _calc_nutrition(profile)

    messages = [
        {"role": "system", "content": CHAT_SYSTEM},
        {"role": "system", "content": (
            f"PERFIL DO UTILIZADOR:\n{profile_ctx}\n\n"
            f"DADOS NUTRICIONAIS:\n"
            f"- TDEE: ~{nutrition['tdee']} cal/dia\n"
            f"- Calorias alvo: ~{nutrition['target_cal']} cal/dia\n"
            f"- Proteína recomendada: ~{nutrition['protein_g']}g/dia"
        )},
    ]

    # Incluir histórico de chat para contexto conversacional
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
- Inclui always um summary com os dados relevantes do perfil"""


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

    if notes:
        user_msg += f"\n\nNOTAS DO UTILIZADOR: {notes}"

    messages = [
        {"role": "system", "content": f"{PLAN_SYSTEM}\n\nFORMATO DE RESPOSTA — JSON válido:\n{schema}"},
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
