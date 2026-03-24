from typing import List, Tuple
from .schemas import ProfileOut
import random


def _calc_bmi(profile: ProfileOut) -> float:
    """Calcula o IMC"""
    return round(profile.weight_kg / ((profile.height_cm / 100) ** 2), 1)


def _goal_label(goal: str) -> str:
    return {"perder_gordura": "perder gordura", "ganhar_massa": "ganhar massa muscular", "manter": "manter a forma"}.get(goal, goal)


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

        return f"🥗 Plano Nutricional — {name}", [
            f"📊 Metabolismo basal (BMR): ~{int(bmr)} cal",
            f"📊 Gasto total diário (TDEE): ~{tdee} cal",
            f"🎯 {cal_note}",
            f"💪 Proteína recomendada: ~{protein_g}g/dia ({round(protein_g/4)}g por refeição, 4 refeições)",
            "",
            "🍽️ Exemplo de dia:",
            f"• Pequeno-almoço: Ovos mexidos (3) + pão integral + fruta ({int(target_cal*0.25)} cal)",
            f"• Almoço: Frango grelhado + arroz + legumes ({int(target_cal*0.35)} cal)",
            f"• Lanche: Iogurte grego + banana + granola ({int(target_cal*0.15)} cal)",
            f"• Jantar: Peixe + batata-doce + salada ({int(target_cal*0.25)} cal)",
            "",
            "💧 Água: 2-3L por dia, mais nos dias de treino.",
            "⏰ Antes do treino (1-2h): carboidratos + proteína",
            "⏰ Depois do treino (30min): proteína + carboidratos rápidos",
        ]

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
