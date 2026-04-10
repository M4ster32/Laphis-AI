from typing import List, Tuple
from .schemas import ProfileOut
import random


def _calc_bmi(profile: ProfileOut) -> float:
    """Calcula o IMC"""
    return round(profile.weight_kg / ((profile.height_cm / 100) ** 2), 1)


def _goal_label(goal: str) -> str:
    return {"perder_gordura": "perder gordura", "ganhar_massa": "ganhar massa muscular", "manter": "manter a forma", "melhorar_saude": "melhorar a saúde", "ganhar_resistencia": "ganhar resistência", "definicao": "definição muscular"}.get(goal, goal)


def _is_greeting(q: str) -> bool:
    greetings = ["ola", "olá", "oi", "hey", "boas", "hello", "hi", "eai", "e ai",
                 "tudo bem", "como vai", "bom dia", "boa tarde", "boa noite",
                 "yo", "fala", "salve", "whats up", "sup"]
    return any(g in q for g in greetings)


def _is_thanks(q: str) -> bool:
    return any(w in q for w in ["obrigad", "thanks", "valeu", "agradeç", "top", "fixe", "nice"])


def recommend(profile: ProfileOut, question: str) -> Tuple[str, List[str]]:
    """
    Gera recomendações personalizadas baseadas no perfil e pergunta.
    Responde de forma conversacional e amigável.
    """
    q = question.lower().strip()
    name = profile.name.split()[0] if profile.name else "atleta"
    bmi = _calc_bmi(profile)
    goal = _goal_label(profile.goal)

    # ==================== SAUDAÇÕES ====================
    if _is_greeting(q):
        greets = [
            f"Olá {name}! 👋",
            f"E aí {name}, tudo bem? 💪",
            f"Boas {name}! Como estás? 🏋️",
        ]
        return random.choice(greets), [
            f"Sou o teu AI Coach do LAPHIS! Estou aqui para te ajudar a {goal}.",
            f"O teu perfil: {profile.age} anos, {profile.height_cm}cm, {profile.weight_kg}kg, IMC {bmi}",
            f"Treinas {profile.days_per_week}x por semana — nível {profile.level}.",
            "Pergunta-me o que quiseres! Exemplos:",
            "• 'Cria-me um plano de treino semanal'",
            "• 'O que devo comer antes do treino?'",
            "• 'Quantas calorias preciso por dia?'",
            "• 'Dá-me motivação!'",
        ]

    # ==================== AGRADECIMENTOS ====================
    if _is_thanks(q):
        return f"De nada, {name}! 😊", [
            "Estou sempre aqui para ajudar!",
            "Se tiveres mais dúvidas sobre treino ou nutrição, é só perguntar.",
            f"Continua focado no teu objetivo de {goal} — vais conseguir! 💪",
        ]

    # ==================== PLANO DE TREINO ====================
    if any(w in q for w in ["plano", "treino", "exercicio", "exercício", "workout",
                             "serie", "série", "rotina", "split", "programa"]):
        title = f"🏋️ Plano de Treino — {name}"
        bullets = [f"Objetivo: {goal} | Nível: {profile.level} | {profile.days_per_week} dias/semana"]

        # ========== TREINO ESPECÍFICO POR GRUPO MUSCULAR ==========
        if any(w in q for w in ["perna", "pernas", "leg", "glúteo", "gluteo", "quad", "femur"]):
            return f"🦵 Treino de Pernas — {name}", [
                f"Objetivo: {goal} | Nível: {profile.level}",
                "",
                "📅 Treino de Pernas (Full Leg):",
                "• Agachamento 4x6-8 (força/hipertrofia)",
                "• Leg press 3x10-12 (volume/quads)",
                "• Stiff 3x8-10 (posterior da coxa, glúteos)",
                "• Extensão pernas 3x12-15 (isolamento quads)",
                "• Curl pernas deitado 3x10-12 (isolamento posterior)",
                "• Gémeos máquina 3x15-20 (panturrilhas)",
                "• Agachamento búlgaro (opcional) 2x10 cada lado",
                "",
                "⏱️ Descanso: 60-90s entre séries compostas, 45-60s isolamento",
                "💡 Rep range: força (6-8), hipertrofia (8-12), definição (12-20)",
                "🔄 Frequência recomendada: 1x/semana completo ou 2x com volumes diferentes",
            ]

        if any(w in q for w in ["peito", "chest", "pec", "supino", "bench"]):
            return f"💪 Treino de Peito — {name}", [
                f"Objetivo: {goal} | Nível: {profile.level}",
                "",
                "📅 Treino de Peito (Full Chest):",
                "• Supino plano barra 4x6-8 (força/hipertrofia)",
                "• Supino inclinado halteres 3x8-10 (clavicular)",
                "• Supino máquina (ou peck deck) 3x10-12 (isolamento)",
                "• Crucifixo com halteres 3x12-15 (stretch/contração)",
                "• Flexões (ou resistida) 2x8-12 (funcional)",
                "• Push-ups assistidos ou máquina 2x12-20 (volume final)",
                "",
                "⏱️ Descanso: 2-3 min entre séries pesadas, 60s isolamento",
                "💡 Progressão: aumenta carga a cada semana ou reps",
                "🔄 Frequência: 1x/semana ou 2x (volume+intensidade) se avançado",
            ]

        if any(w in q for w in ["costa", "back", "remada", "puxada", "dorsal", "lat"]):
            return f"🔙 Treino de Costas — {name}", [
                f"Objetivo: {goal} | Nível: {profile.level}",
                "",
                "📅 Treino de Costas (Full Back):",
                "• Puxada frente larga 4x6-8 (lats, força)",
                "• Remada barra ou máquina 4x6-8 (espessura)",
                "• Remada unilateral 3x8-10 (desequilíbrio/ativação)",
                "• Face pull 3x12-15 (posterior ombros, postura)",
                "• Puxada fechada ou inversa 3x8-10 (ativação lats)",
                "• Encolhimento halteres 3x10-12 (trapézio)",
                "• Prancha ou ab wheel 2x10-15 (core)",
                "",
                "⏱️ Descanso: 2-3 min compostas, 60s isolamento",
                "💡 Dica: foca-te no 'mind-muscle' (conexão mental)",
                "🔄 Frequência: 1x/semana ou 2x se tens dias específicos",
            ]

        if any(w in q for w in ["ombro", "shoulder", "press", "elevação", "elevacao", "deltoid"]):
            return f"💥 Treino de Ombros — {name}", [
                f"Objetivo: {goal} | Nível: {profile.level}",
                "",
                "📅 Treino de Ombros (Full Shoulders):",
                "• Press ombros militar 4x6-8 (deltoides anterior/medial)",
                "• Press ombros máquina ou halteres 3x8-10 (força)",
                "• Elevação lateral halteres 3x12-15 (deltoides medial)",
                "• Elevação frontal 3x12-15 (deltoides anterior)",
                "• Elevação traseira (pec deck invertido) 3x12-15 (deltoides posterior)",
                "• Encolhimento barra 3x8-10 (trapézio)",
                "• Elevação lateral com cabo 2x15-20 (drop set final)",
                "",
                "⏱️ Descanso: 2 min compostas, 45s isolamento",
                "💡 Cuidado: ombros são frágeis, técnica > carga",
                "🔄 Frequência: 1x/semana (treino isolado é raro, geralmente em splits)",
            ]

        if any(w in q for w in ["braço", "braco", "bícep", "bicep", "trícep", "tricep", "arm"]):
            return f"💪 Treino de Braços — {name}", [
                f"Objetivo: {goal} | Nível: {profile.level}",
                "",
                "📅 Treino de Braços (Bíceps + Tríceps):",
                "",
                "🔵 BÍCEPS:",
                "• Curl barra 4x6-8 (força pura)",
                "• Curl halteres 3x8-10 (amplitude, cada lado)",
                "• Curl máquina 3x10-12 (hipertrofia isolada)",
                "• Curl martelo 2x12 (braquial, espessura)",
                "",
                "🔴 TRÍCEPS:",
                "• Tríceps corda 4x8-10 (hipertrofia)",
                "• Extensão francesa (ou acima da cabeça) 3x8-10 (alongamento)",
                "• Tríceps máquina 3x10-12 (volume)",
                "• Mergulhos (ou assistidos) 2x6-10 (força funcional)",
                "",
                "⏱️ Descanso: 60-90s entre séries",
                "💡 Dica: braços crescem também com costas/peito — não overtraino!",
                "🔄 Frequência: 2x/semana idealmente (junto com compostas)",
            ]

        if any(w in q for w in ["abdomen", "abs", "abdominais", "core", "barriga", "Six-pack"]):
            return f"🎯 Treino de Core/Abdominais — {name}", [
                f"Objetivo: {goal} | Nível: {profile.level}",
                "",
                "📅 Treino de Abdominais (3x/semana):",
                "• Crunch máquina 3x12-15 (isolamento reto)",
                "• Prancha frontal 3x30-60s (isométrico)",
                "• Ab wheel 3x8-12 (desafio total)",
                "• Elevação joelhos suspensão 3x10-15 (inferior)",
                "• Rotação cabo 3x12 cada lado (oblíquos)",
                "• Prancha lateral 2x30-45s cada lado",
                "",
                "⏱️ Descanso: 45-60s",
                "🔥 IMPORTANTE: abs são visíveis com DIETA! Treino + défice calórico.",
                "💡 Core forte = melhor desempenho em compostas (agachamento, deadlift)",
            ]

        # ========== TREINO GENÉRICO (caso não mencione grupo específico) ==========
        if profile.days_per_week <= 3:
            bullets += [
                "Recomendo: Full-Body 3x/semana (Seg, Qua, Sex)",
                "",
                "📅 Dia A — Full Body (Foco Peito/Costas):",
                "• Supino plano 3x8-12",
                "• Remada máquina 3x10",
                "• Agachamento 3x10",
                "• Press ombros halteres 3x10",
                "• Curl bíceps 2x12 + Tríceps corda 2x12",
                "",
                "📅 Dia B — Full Body (Foco Pernas/Ombros):",
                "• Leg press 3x12",
                "• Puxada frente 3x10",
                "• Supino inclinado halteres 3x10",
                "• Elevações laterais 3x15",
                "• Extensão pernas 2x12 + Curl pernas 2x12",
                "",
                "Alterna: A-B-A uma semana, B-A-B na seguinte.",
            ]
        elif profile.days_per_week == 4:
            bullets += [
                "Recomendo: Upper/Lower Split 4x/semana",
                "",
                "📅 Seg — Upper:",
                "• Supino plano 4x8 | Remada barra 4x8",
                "• Press ombros 3x10 | Puxada 3x10",
                "• Curl bíceps 3x12 | Tríceps 3x12",
                "",
                "📅 Ter — Lower:",
                "• Agachamento 4x8 | Leg press 3x12",
                "• Stiff 3x10 | Extensão pernas 3x12",
                "• Gémeos 4x15 | Abdominais 3x15",
                "",
                "Qui — Upper (mais volume), Sex — Lower (mais intensidade)",
            ]
        else:
            bullets += [
                "Recomendo: Push/Pull/Legs (PPL) 5-6x/semana",
                "",
                "📅 Push (Peito, Ombros, Tríceps):",
                "• Supino 4x8 | Supino inclinado 3x10",
                "• Press ombros 3x10 | Elevações laterais 3x15",
                "• Tríceps corda 3x12 | Tríceps francês 2x12",
                "",
                "📅 Pull (Costas, Bíceps):",
                "• Puxada frente 4x8 | Remada baixa 3x10",
                "• Face pull 3x15 | Curl barra 3x10",
                "• Curl martelo 2x12",
                "",
                "📅 Legs (Pernas, Glúteos):",
                "• Agachamento 4x8 | Leg press 3x12",
                "• Stiff 3x10 | Búlgaras 3x10",
                "• Gémeos 4x15 | Abdominais 3x15",
            ]

        if profile.level == "iniciante":
            bullets.append("\n💡 Dica: Foca-te na técnica antes de aumentar carga. Pede ajuda a um instrutor.")
        elif profile.level == "avancado":
            bullets.append("\n💡 Dica: Faz deload a cada 4-5 semanas. Periodiza entre força e hipertrofia.")

        return title, bullets

    # ==================== NUTRIÇÃO / DIETA ====================
    if any(w in q for w in ["caloria", "dieta", "comer", "nutri", "proteina", "proteína",
                             "refeição", "refeicao", "macro", "alimenta", "comida",
                             "pequeno", "almoço", "jantar", "snack", "lanche"]):
        # Calorias estimadas (Harris-Benedict simplificado)
        if profile.sex == "masculino":
            bmr = 88.36 + (13.4 * profile.weight_kg) + (4.8 * profile.height_cm) - (5.7 * profile.age)
        else:
            bmr = 447.6 + (9.2 * profile.weight_kg) + (3.1 * profile.height_cm) - (4.3 * profile.age)

        activity_mult = {1: 1.2, 2: 1.375, 3: 1.55, 4: 1.55, 5: 1.725, 6: 1.725, 7: 1.9}
        tdee = int(bmr * activity_mult.get(profile.days_per_week, 1.55))

        if profile.goal == "perder_gordura":
            target_cal = tdee - 400
            cal_note = f"Défice de ~400 cal → {target_cal} cal/dia"
        elif profile.goal == "ganhar_massa":
            target_cal = tdee + 300
            cal_note = f"Excedente de ~300 cal → {target_cal} cal/dia"
        else:
            target_cal = tdee
            cal_note = f"Manutenção → {target_cal} cal/dia"

        protein_g = int(profile.weight_kg * 1.8)

        # ===== RF-09: Personalização por dieta e alergias =====
        diet = getattr(profile, "diet_type", None) or "omnivoro"
        allergy_str = getattr(profile, "allergies", None) or ""
        allergies = {a.strip().lower() for a in allergy_str.split(",") if a.strip()} if allergy_str else set()

        # Meal examples per diet type
        _MEAL_EXAMPLES = {
            "omnivoro": {
                "pa": "Ovos mexidos (3) + pão integral + fruta",
                "almoco": "Frango grelhado + arroz + legumes",
                "lanche": "Iogurte grego + banana + granola",
                "jantar": "Peixe + batata-doce + salada",
            },
            "vegetariano": {
                "pa": "Tofu mexido + pão integral + abacate",
                "almoco": "Lentilhas estufadas + arroz integral + legumes",
                "lanche": "Iogurte de soja + banana + frutos secos",
                "jantar": "Grão-de-bico assado + quinoa + salada",
            },
            "vegan": {
                "pa": "Papas de aveia com leite vegetal + sementes + fruta",
                "almoco": "Bowl de tofu + arroz + edamame + legumes",
                "lanche": "Batido proteico vegetal + frutos secos",
                "jantar": "Seitan grelhado + batata-doce + espinafres",
            },
            "pescetariano": {
                "pa": "Ovos mexidos (3) + pão integral + fruta",
                "almoco": "Salmão grelhado + arroz + legumes",
                "lanche": "Iogurte grego + banana + granola",
                "jantar": "Atum + quinoa + salada",
            },
        }
        meals = _MEAL_EXAMPLES.get(diet, _MEAL_EXAMPLES["omnivoro"])

        # Apply allergy filter to meal descriptions
        _ALLERGY_SWAPS = {
            "glúten": {"pão integral": "tosta de arroz", "pão": "tosta de arroz", "granola": "frutos secos", "aveia": "arroz tufado"},
            "gluten": {"pão integral": "tosta de arroz", "pão": "tosta de arroz", "granola": "frutos secos", "aveia": "arroz tufado"},
            "lactose": {"iogurte grego": "iogurte de soja", "iogurte": "iogurte sem lactose", "queijo": "queijo sem lactose"},
            "ovo": {"ovos mexidos (3)": "tofu mexido", "ovos": "tofu mexido"},
            "frutos secos": {"frutos secos": "sementes de abóbora", "granola": "sementes", "amendoim": "sementes de girassol"},
            "soja": {"tofu": "seitan", "soja": "grão-de-bico", "edamame": "ervilhas"},
            "marisco": {"camarão": "peixe branco"},
        }

        if allergies:
            for allergy in allergies:
                swaps = _ALLERGY_SWAPS.get(allergy, {})
                for key in meals:
                    for orig, sub in swaps.items():
                        meals[key] = meals[key].replace(orig, sub).replace(orig.capitalize(), sub.capitalize())

        diet_labels = {"omnivoro": "Omnívora", "vegetariano": "Vegetariana", "vegan": "Vegan", "pescetariano": "Pescetariana"}
        diet_label = diet_labels.get(diet, diet.capitalize())

        bullets = [
            f"📊 Metabolismo basal (BMR): ~{int(bmr)} cal",
            f"📊 Gasto total diário (TDEE): ~{tdee} cal",
            f"🎯 {cal_note}",
            f"💪 Proteína recomendada: ~{protein_g}g/dia ({round(protein_g/4)}g por refeição, 4 refeições)",
        ]

        if diet != "omnivoro":
            bullets.append(f"🥗 Dieta: {diet_label}")
        if allergies:
            bullets.append(f"⚠️ Alergias consideradas: {', '.join(a.capitalize() for a in sorted(allergies))}")

        bullets += [
            "",
            f"🍽️ Exemplo de dia ({diet_label}):",
            f"• Pequeno-almoço: {meals['pa']} ({int(target_cal*0.25)} cal)",
            f"• Almoço: {meals['almoco']} ({int(target_cal*0.35)} cal)",
            f"• Lanche: {meals['lanche']} ({int(target_cal*0.15)} cal)",
            f"• Jantar: {meals['jantar']} ({int(target_cal*0.25)} cal)",
            "",
            "💧 Água: 2-3L por dia, mais nos dias de treino.",
            "⏰ Antes do treino (1-2h): carboidratos + proteína",
            "⏰ Depois do treino (30min): proteína + carboidratos rápidos",
        ]

        if diet == "vegan":
            bullets.append("💡 Vegan: garante vitamina B12 (suplemento), ferro e cálcio de fontes vegetais.")
        elif diet == "vegetariano":
            bullets.append("💡 Vegetariano: inclui ovos e laticínios para completar aminoácidos.")

        return f"🥗 Plano Nutricional — {name}", bullets

    # ==================== MOTIVAÇÃO ====================
    if any(w in q for w in ["motivação", "motivacao", "desistir", "difícil", "dificil",
                             "cansado", "resultado", "progresso", "animo", "ânimo", "inspiração"]):
        quotes = [
            "'O corpo alcança o que a mente acredita.' 🧠",
            "'Não pares quando estiveres cansado, pára quando terminares.' 💪",
            "'A dor que sentes hoje será a força que sentirás amanhã.' 🔥",
            "'Disciplina é fazer o que precisa ser feito, mesmo quando não apetece.' 🏆",
        ]
        return f"🔥 Motivação para ti, {name}!", [
            random.choice(quotes),
            "",
            f"Lembra-te do teu objetivo: {goal}!",
            f"Com {profile.days_per_week} dias de treino por semana, já estás à frente de 90% das pessoas.",
            "Resultados reais levam 8-12 semanas — não desistas no mês 1!",
            "",
            "📈 Dicas para manter consistência:",
            "• Treina à mesma hora todos os dias (cria hábito)",
            "• Celebra pequenas vitórias (mais 1 rep, mais energia, melhor sono)",
            "• Tira fotos de progresso mensais — vais surpreender-te!",
            "• Arranja um partner de treino — accountability funciona!",
        ]

    # ==================== LESÃO / DOR ====================
    if any(w in q for w in ["dor", "lesão", "lesao", "doi", "magoei", "segurança",
                             "seguranca", "magoa", "inflamação", "inflamacao"]):
        return f"⚠️ Segurança em Primeiro, {name}", [
            "🔴 Se é dor AGUDA ou persistente → consulta um profissional de saúde!",
            "🟡 Se é DOMS (dor muscular 24-48h após treino) → é normal, passa em poucos dias.",
            "",
            "Dicas para evitar lesões:",
            "• Aquece SEMPRE 5-10 min antes de treinar",
            "• Técnica > Carga — nunca sacrifiques forma",
            "• Se um exercício dói, substitui por uma alternativa",
            "• Progressão gradual: máximo +5% de carga por semana",
            "• Descanso adequado: 48h entre treinar o mesmo músculo",
            "",
            "⚡ Disclaimer: Não sou médico. Para dores persistentes, consulta sempre um profissional.",
        ]

    # ==================== DESCANSO / SONO ====================
    if any(w in q for w in ["sono", "dormir", "descanso", "recupera", "descansar", "repouso"]):
        return f"😴 Recuperação — {name}", [
            "O sono é quando o corpo REALMENTE cresce e recupera!",
            "",
            "🌙 Recomendações:",
            "• 7-9 horas de sono por noite (não negociável!)",
            "• Deita-te e levanta-te à mesma hora todos os dias",
            "• Evita ecrãs 30-60 min antes de dormir",
            "• Quarto escuro e fresco (~18-20°C)",
            "",
            "💤 Impacto no treino:",
            "• Sono insuficiente = -30% de força e resistência",
            "• Aumenta cortisol (hormona do stress) e reduz testosterona",
            "• Dificulta a perda de gordura e ganho muscular",
        ]

    # ==================== SUPLEMENTOS ====================
    if any(w in q for w in ["suplemento", "whey", "creatina", "cafeina", "bcaa", "pre-treino"]):
        return f"💊 Suplementos — {name}", [
            "Os suplementos são o bónus, NÃO a base! Alimentação primeiro.",
            "",
            "✅ Suplementos com evidência científica:",
            "• Creatina monohidratada: 3-5g/dia (o mais estudado e eficaz)",
            "• Whey Protein: se não consegues proteína suficiente pela dieta",
            "• Cafeína: 3-6mg/kg 30min antes do treino (boost de energia)",
            "",
            "❌ Não vale o dinheiro:",
            "• BCAAs (se já comes proteína suficiente, são redundantes)",
            "• Fat burners (efeito mínimo, riscos desnecessários)",
            "• Testosterona natural / boosters (sem evidência real)",
            "",
            f"Para o teu objetivo ({goal}), foca-te em comer bem + treinar consistentemente.",
        ]

    # ==================== PERGUNTA GENÉRICA (fallback) ====================
    return f"💡 Conselho para {name}", [
        f"Baseado no teu perfil: {profile.age} anos, {profile.weight_kg}kg, IMC {bmi} — objetivo: {goal}.",
        f"Treinas {profile.days_per_week}x por semana como {profile.level}.",
        "",
        "Posso ajudar-te com:",
        "• 🏋️ Planos de treino personalizados",
        "• 🥗 Nutrição e dieta (com calorias calculadas!)",
        "• 🔥 Motivação e mindset",
        "• 💊 Suplementos",
        "• 😴 Descanso e recuperação",
        "• ⚠️ Lesões e segurança",
        "",
        "Experimenta: 'Cria-me um plano de treino' ou 'Quantas calorias preciso?'",
    ]


# ==================== DAILY PLAN GENERATION ====================

import re as _re
import copy as _copy
from datetime import datetime as _dt

# Exercise pool — each entry has a bodyweight alternative
_EXERCISE_POOL = {
    "peito": [
        {"name": "Supino plano barra", "sets": 4, "reps": "8-10", "rest_sec": 90, "muscle": "peito", "bw": "Flexões"},
        {"name": "Supino inclinado halteres", "sets": 3, "reps": "10-12", "rest_sec": 60, "muscle": "peito", "bw": "Flexões inclinadas"},
        {"name": "Crossover cabos", "sets": 3, "reps": "12-15", "rest_sec": 45, "muscle": "peito", "bw": "Flexões largas"},
    ],
    "costas": [
        {"name": "Puxada frente", "sets": 4, "reps": "8-10", "rest_sec": 90, "muscle": "costas", "bw": "Puxadas na barra"},
        {"name": "Remada baixa", "sets": 3, "reps": "10-12", "rest_sec": 90, "muscle": "costas", "bw": "Remada invertida"},
        {"name": "Remada unilateral", "sets": 3, "reps": "10-12", "rest_sec": 60, "muscle": "costas", "bw": "Superman"},
    ],
    "ombros": [
        {"name": "Press ombros halteres", "sets": 3, "reps": "10-12", "rest_sec": 60, "muscle": "ombros", "bw": "Pike push-ups"},
        {"name": "Elevação lateral", "sets": 3, "reps": "15-20", "rest_sec": 45, "muscle": "ombros", "bw": "Elevação lateral garrafas"},
        {"name": "Face pull", "sets": 3, "reps": "15-20", "rest_sec": 45, "muscle": "ombros", "bw": "Band pull-apart"},
    ],
    "pernas": [
        {"name": "Agachamento barra", "sets": 4, "reps": "8-10", "rest_sec": 120, "muscle": "pernas", "bw": "Agachamento livre"},
        {"name": "Leg press", "sets": 3, "reps": "12-15", "rest_sec": 90, "muscle": "pernas", "bw": "Agachamento búlgaro"},
        {"name": "Extensão pernas", "sets": 3, "reps": "12-15", "rest_sec": 60, "muscle": "pernas", "bw": "Sissy squat"},
    ],
    "posterior": [
        {"name": "Stiff", "sets": 3, "reps": "10-12", "rest_sec": 90, "muscle": "posterior", "bw": "Ponte glúteos"},
        {"name": "Curl pernas deitado", "sets": 3, "reps": "12-15", "rest_sec": 60, "muscle": "posterior", "bw": "Nordic curl"},
        {"name": "Hip thrust", "sets": 3, "reps": "10-12", "rest_sec": 60, "muscle": "posterior", "bw": "Ponte glúteos unilateral"},
    ],
    "biceps": [
        {"name": "Curl bíceps barra", "sets": 3, "reps": "10-12", "rest_sec": 45, "muscle": "biceps", "bw": "Curl com mochila"},
        {"name": "Curl martelo", "sets": 2, "reps": "12-15", "rest_sec": 45, "muscle": "biceps", "bw": "Curl isométrico"},
    ],
    "triceps": [
        {"name": "Tríceps corda", "sets": 3, "reps": "12-15", "rest_sec": 45, "muscle": "triceps", "bw": "Diamond push-ups"},
        {"name": "Extensão tríceps", "sets": 2, "reps": "12-15", "rest_sec": 45, "muscle": "triceps", "bw": "Dips no banco"},
    ],
    "core": [
        {"name": "Prancha frontal", "sets": 3, "reps": "30-45s", "rest_sec": 30, "muscle": "core", "bw": "Prancha frontal"},
        {"name": "Crunch máquina", "sets": 3, "reps": "15-20", "rest_sec": 30, "muscle": "core", "bw": "Crunch no chão"},
        {"name": "Elevação joelhos", "sets": 2, "reps": "12-15", "rest_sec": 30, "muscle": "core", "bw": "Mountain climbers"},
    ],
}

# Workout templates — pick exercises from pool by muscle group
_WORKOUT_TEMPLATES = [
    {
        "title": "💪 Full Body — Força",
        "focus": "Treino composto para todo o corpo",
        "picks": {"peito": 1, "costas": 1, "pernas": 1, "ombros": 1, "biceps": 1, "triceps": 1},
    },
    {
        "title": "🦵 Lower Body — Pernas & Core",
        "focus": "Foco em pernas, glúteos e core",
        "picks": {"pernas": 2, "posterior": 2, "core": 2},
    },
    {
        "title": "🏋️ Upper Body — Tronco",
        "focus": "Foco no tronco superior",
        "picks": {"peito": 2, "costas": 2, "ombros": 1, "biceps": 1, "triceps": 1},
    },
    {
        "title": "⚡ Push — Peito, Ombros & Tríceps",
        "focus": "Movimentos de empurrar",
        "picks": {"peito": 2, "ombros": 2, "triceps": 2},
    },
    {
        "title": "🔙 Pull — Costas & Bíceps",
        "focus": "Movimentos de puxar",
        "picks": {"costas": 3, "biceps": 2, "posterior": 1},
    },
]

# Meal templates
_MEAL_TEMPLATES = {
    "pequeno_almoco": [
        {"foods": ["Ovos mexidos (3)", "Pão integral (2 fatias)", "Banana"], "base_cal": 450, "base_prot": 28},
        {"foods": ["Papas de aveia (60g)", "Iogurte grego (150g)", "Mel e frutos vermelhos"], "base_cal": 420, "base_prot": 25},
        {"foods": ["Tosta integral com ovo e abacate", "Sumo de laranja natural"], "base_cal": 480, "base_prot": 22},
        {"foods": ["Panquecas de aveia (3)", "Manteiga de amendoim", "Fruta da época"], "base_cal": 460, "base_prot": 24},
    ],
    "almoco": [
        {"foods": ["Frango grelhado (150g)", "Arroz integral (100g)", "Brócolos e cenoura"], "base_cal": 550, "base_prot": 42},
        {"foods": ["Salmão no forno (150g)", "Batata-doce (150g)", "Salada mista"], "base_cal": 580, "base_prot": 38},
        {"foods": ["Peru grelhado (150g)", "Massa integral (100g)", "Legumes salteados"], "base_cal": 520, "base_prot": 40},
        {"foods": ["Atum em posta (150g)", "Quinoa (100g)", "Espinafres salteados"], "base_cal": 510, "base_prot": 44},
    ],
    "lanche": [
        {"foods": ["Iogurte grego (200g)", "Granola (30g)", "Banana"], "base_cal": 300, "base_prot": 18},
        {"foods": ["Batido proteico", "Frutos secos (30g)"], "base_cal": 280, "base_prot": 25},
        {"foods": ["Tosta de arroz com manteiga de amendoim", "Maçã"], "base_cal": 260, "base_prot": 10},
        {"foods": ["Queijo fresco (100g)", "Cenoura baby", "Húmus"], "base_cal": 250, "base_prot": 15},
    ],
    "jantar": [
        {"foods": ["Peito de frango (150g)", "Batata cozida (150g)", "Salada de tomate e pepino"], "base_cal": 480, "base_prot": 40},
        {"foods": ["Peixe grelhado (150g)", "Arroz basmati (80g)", "Legumes no vapor"], "base_cal": 450, "base_prot": 35},
        {"foods": ["Omelete (3 ovos) com legumes", "Pão integral", "Sopa de legumes"], "base_cal": 420, "base_prot": 30},
        {"foods": ["Carne de vaca magra (120g)", "Puré de batata", "Brócolos gratinados"], "base_cal": 500, "base_prot": 38},
    ],
}

# Vegetarian replacements for common protein sources
_VEGGIE_SUBS = {
    "Frango grelhado (150g)": "Tofu grelhado (200g)",
    "Salmão no forno (150g)": "Tofu marinado (200g)",
    "Peru grelhado (150g)": "Seitan grelhado (150g)",
    "Atum em posta (150g)": "Grão-de-bico cozido (200g)",
    "Peito de frango (150g)": "Tempeh (150g)",
    "Peixe grelhado (150g)": "Lentilhas cozidas (200g)",
    "Carne de vaca magra (120g)": "Seitan (150g)",
    "Iogurte grego (150g)": "Iogurte de soja (150g)",
    "Iogurte grego (200g)": "Iogurte de coco (200g)",
    "Queijo fresco (100g)": "Tofu sedoso (100g)",
    "Ovos mexidos (3)": "Tofu mexido (200g)",
}


def _daily_tdee(profile: ProfileOut):
    """Calculate BMR, TDEE, target calories and protein for daily plan."""
    if profile.sex == "masculino":
        bmr = 88.36 + (13.4 * profile.weight_kg) + (4.8 * profile.height_cm) - (5.7 * profile.age)
    else:
        bmr = 447.6 + (9.2 * profile.weight_kg) + (3.1 * profile.height_cm) - (4.3 * profile.age)

    mult = {1: 1.2, 2: 1.375, 3: 1.55, 4: 1.55, 5: 1.725, 6: 1.725, 7: 1.9}
    tdee = int(bmr * mult.get(profile.days_per_week, 1.55))

    if profile.goal == "perder_gordura":
        target = tdee - 400
    elif profile.goal == "ganhar_massa":
        target = tdee + 300
    else:
        target = tdee

    protein = int(profile.weight_kg * 1.8)
    return int(bmr), tdee, target, protein


def _build_daily_workout(profile: ProfileOut, date_str: str) -> dict:
    """Build a structured workout for the given date."""
    d = _dt.strptime(date_str, "%Y-%m-%d")
    day_num = d.timetuple().tm_yday
    template = _WORKOUT_TEMPLATES[day_num % len(_WORKOUT_TEMPLATES)]

    base_dur = {"iniciante": 35, "intermedio": 45, "avancado": 55}.get(profile.level, 45)

    exercises = []
    for muscle, count in template["picks"].items():
        pool = _EXERCISE_POOL.get(muscle, [])
        for i in range(min(count, len(pool))):
            idx = (day_num + i) % len(pool)
            ex = _copy.deepcopy(pool[idx])
            if profile.level == "iniciante":
                ex["sets"] = max(2, ex["sets"] - 1)
            elif profile.level == "avancado":
                ex["sets"] = ex["sets"] + 1
            exercises.append(ex)

    return {
        "title": template["title"],
        "focus": template["focus"],
        "duration_min": base_dur,
        "warmup": "5 min cardio leve + mobilidade articular",
        "exercises": exercises,
        "cooldown": "5 min alongamentos estáticos",
        "tips": [
            "Mantém boa técnica em todos os exercícios",
            f"Descanso: {90 if profile.level == 'iniciante' else 60}-{120 if profile.level == 'avancado' else 90}s entre séries",
            "Hidrata-te durante o treino",
        ],
    }


def _build_daily_meals(profile: ProfileOut, target_cal: int, protein_g: int, date_str: str) -> dict:
    """Build structured meal plan for a specific date."""
    d = _dt.strptime(date_str, "%Y-%m-%d")
    seed = d.timetuple().tm_yday

    dist = [
        ("pequeno_almoco", 0.25, "🌅 Pequeno-almoço", "08:00"),
        ("almoco", 0.35, "🍽️ Almoço", "13:00"),
        ("lanche", 0.15, "🥤 Lanche", "16:30"),
        ("jantar", 0.25, "🌙 Jantar", "20:00"),
    ]

    # Determine if we need vegetarian substitutions
    diet = getattr(profile, "diet_type", None) or "omnivoro"
    needs_veggie = diet in ("vegetariano", "vegan")
    needs_pesc = diet == "pescetariano"

    # Parse allergies into a set for filtering
    allergy_str = getattr(profile, "allergies", None) or ""
    allergies = {a.strip().lower() for a in allergy_str.split(",") if a.strip()} if allergy_str else set()

    meals = []
    for i, (key, pct, label, time) in enumerate(dist):
        pool = _MEAL_TEMPLATES[key]
        idx = (seed + profile.id + i) % len(pool)
        tpl = pool[idx]
        foods = list(tpl["foods"])

        # Apply vegetarian/vegan substitutions
        if needs_veggie:
            foods = [_VEGGIE_SUBS.get(f, f) for f in foods]
        elif needs_pesc:
            # Pescetarian: replace meat but keep fish
            meat_subs = {k: v for k, v in _VEGGIE_SUBS.items()
                         if not any(fish in k.lower() for fish in ["salmão", "atum", "peixe"])}
            foods = [meat_subs.get(f, f) for f in foods]

        # Filter out allergy-triggering foods (simple keyword match)
        if allergies:
            allergy_map = {
                "glúten": ["pão", "massa", "aveia", "panquecas", "tosta", "granola"],
                "gluten": ["pão", "massa", "aveia", "panquecas", "tosta", "granola"],
                "lactose": ["iogurte", "queijo", "leite"],
                "frutos secos": ["amendoim", "frutos secos", "granola"],
                "marisco": ["marisco", "camarão"],
                "ovo": ["ovo", "ovos", "omelete"],
                "soja": ["tofu", "soja", "tempeh"],
            }
            blocked_words = set()
            for allergy in allergies:
                for key_a, words in allergy_map.items():
                    if allergy in key_a or key_a in allergy:
                        blocked_words.update(words)
            if blocked_words:
                foods = [f for f in foods if not any(bw in f.lower() for bw in blocked_words)]
                if not foods:
                    foods = ["Alternativa personalizada (consultar nutricionista)"]

        meals.append({
            "type": label,
            "time": time,
            "foods": foods,
            "calories": int(target_cal * pct),
            "protein_g": int(protein_g * pct),
        })

    water_l = max(2.0, round(profile.weight_kg * 0.033, 1))
    diet_note = ""
    if diet != "omnivoro":
        diet_labels = {"vegetariano": "vegetariana", "vegan": "vegan", "pescetariano": "pescetariana"}
        diet_note = f"🥗 Dieta {diet_labels.get(diet, diet)} aplicada"

    tips = [
        "Comer 1-2h antes do treino (carboidratos + proteína)",
        "Pós-treino (30 min): proteína + carboidratos rápidos",
        "Distribuir proteína ao longo do dia",
    ]
    if diet_note:
        tips.insert(0, diet_note)
    if allergies:
        tips.append(f"⚠️ Alergias consideradas: {', '.join(allergies)}")

    return {
        "total_calories": target_cal,
        "total_protein_g": protein_g,
        "meals": meals,
        "hydration": f"💧 Beber {water_l}L de água ao longo do dia",
        "tips": tips,
    }


def generate_daily_plan(profile: ProfileOut, target_date: str) -> dict:
    """
    Generate a complete structured daily plan with workout and meals.
    Returns dict with 'workout' and 'meals' keys.
    """
    _, _, target_cal, protein_g = _daily_tdee(profile)
    workout = _build_daily_workout(profile, target_date)
    meals = _build_daily_meals(profile, target_cal, protein_g, target_date)
    return {"workout": workout, "meals": meals}


def adjust_daily_plan(plan_data: dict, constraint: str, profile: ProfileOut):
    """
    Adjust a daily plan based on a natural-language constraint.
    Returns (adjusted_plan_data, adjustment_record).
    """
    c = constraint.lower().strip()
    workout = _copy.deepcopy(plan_data.get("workout", {}))
    meals = _copy.deepcopy(plan_data.get("meals", {}))
    changes = []

    # ======= TIME CONSTRAINT =======
    time_match = _re.search(r'(\d+)\s*(min|minuto)', c)
    half_hour = "meia hora" in c
    if time_match or half_hour or any(w in c for w in ["pouco tempo", "rápido", "despachar", "à pressa"]):
        avail = int(time_match.group(1)) if time_match else (30 if half_hour else 20)
        exs = workout.get("exercises", [])
        compounds = [e for e in exs if e.get("sets", 0) >= 3]
        isolation = [e for e in exs if e.get("sets", 0) < 3]

        if avail <= 20:
            kept = compounds[:3]
            for e in kept:
                e["sets"] = min(e["sets"], 2)
        elif avail <= 30:
            kept = compounds[:4]
            for e in kept:
                e["sets"] = min(e["sets"], 3)
        elif avail <= 45:
            kept = compounds + isolation[:1]
        else:
            kept = exs

        workout["exercises"] = kept
        workout["duration_min"] = avail
        base = workout.get("title", "").split("—")[0].strip()
        workout["title"] = f"{base} — {avail} min"
        changes.append(f"⏱️ Treino ajustado para {avail} min ({len(kept)} exercícios)")

    # ======= HOME / BODYWEIGHT =======
    if any(w in c for w in ["casa", "sem equipamento", "sem ginásio", "sem gym", "bodyweight", "sem máquina"]):
        for ex in workout.get("exercises", []):
            bw = ex.pop("bw", None)
            if bw:
                ex["name"] = bw
        base = workout.get("title", "").split("—")[0].strip()
        workout["title"] = f"{base} — Em Casa"
        workout["focus"] = "Treino bodyweight sem equipamento"
        changes.append("🏠 Exercícios adaptados para treinar em casa")

    # ======= BODY PART PAIN =======
    body_map = {
        "ombro": ["ombros"],
        "joelho": ["pernas"],
        "costa": ["costas"],
        "braço": ["biceps", "triceps"],
        "pulso": ["biceps", "triceps", "peito"],
        "perna": ["pernas", "posterior"],
        "peito": ["peito"],
        "lombar": ["costas", "posterior"],
    }
    for part, muscles in body_map.items():
        if part in c and any(w in c for w in ["dói", "dor", "magoa", "lesão", "lesao", "não posso", "nao posso", "magoei"]):
            before = len(workout.get("exercises", []))
            workout["exercises"] = [
                e for e in workout.get("exercises", [])
                if e.get("muscle", "") not in muscles
            ]
            removed = before - len(workout.get("exercises", []))
            if removed > 0:
                changes.append(f"⚠️ Removidos {removed} exercícios que envolvem {part} — cuida-te!")
                workout.setdefault("tips", []).append(f"🩹 Evita exercícios que causem dor no {part}")

    # ======= SKIP WORKOUT =======
    if any(w in c for w in ["não vou treinar", "nao vou treinar", "descanso", "dia off", "folga", "skip treino"]):
        workout["exercises"] = []
        workout["title"] = "🧘 Dia de Descanso"
        workout["focus"] = "Recuperação ativa"
        workout["duration_min"] = 0
        workout["warmup"] = ""
        workout["cooldown"] = "10 min alongamentos suaves (opcional)"
        workout["tips"] = [
            "Descansa bem — o corpo cresce durante o repouso!",
            "Faz alongamentos leves se quiseres",
            "Foca-te na alimentação e hidratação",
        ]
        total = meals.get("total_calories", 0)
        if total:
            meals["total_calories"] = total - 300
            for m in meals.get("meals", []):
                m["calories"] = int(m["calories"] * 0.85)
        changes.append("🧘 Dia de descanso — calorias reduzidas em ~300 cal")

    # ======= VEGETARIAN =======
    if any(w in c for w in ["vegetariano", "vegan", "sem carne", "não como carne", "nao como carne", "plant based"]):
        for meal in meals.get("meals", []):
            meal["foods"] = [_VEGGIE_SUBS.get(f, f) for f in meal.get("foods", [])]
        changes.append("🌱 Refeições adaptadas — proteína animal substituída por vegetal")

    # ======= MORE FOOD =======
    if any(w in c for w in ["mais fome", "comer mais", "mais comida", "pouca comida"]):
        extra = 200
        meals["total_calories"] = meals.get("total_calories", 0) + extra
        for m in meals.get("meals", []):
            m["calories"] = int(m["calories"] * 1.1)
        meals["meals"].insert(3, {
            "type": "🍎 Snack extra",
            "time": "15:00",
            "foods": ["Fruta + punhado de frutos secos (30g)"],
            "calories": extra,
            "protein_g": 8,
        })
        changes.append(f"📈 +{extra} cal — snack extra incluído")

    # ======= LESS FOOD =======
    elif any(w in c for w in ["menos fome", "comer menos", "menos comida", "mais leve", "leve"]):
        meals["total_calories"] = meals.get("total_calories", 0) - 200
        for m in meals.get("meals", []):
            m["calories"] = int(m["calories"] * 0.9)
        changes.append("📉 Calorias reduzidas em ~200 cal")

    # ======= FALLBACK =======
    if not changes:
        changes.append(f"📝 Nota registada: \"{constraint}\"")
        workout.setdefault("tips", []).append(f"📝 {constraint}")

    record = {
        "constraint": constraint,
        "changes": changes,
        "timestamp": _dt.utcnow().isoformat(),
    }
    return {"workout": workout, "meals": meals}, record
