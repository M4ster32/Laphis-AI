"""Slide 2 — Problem statement."""

from pptx.util import Inches, Emu

from ...pptx_utils import (
    bg,
    textbox,
    panel,
    slide_header,
    footer,
    solid,
    no_line,
    TEXT,
    TEXT_DIM,
    ACCENT,
    ACCENT_SOFT,
    PANEL,
)
from ._common import add_blank_slide, accent_bar


def render(prs):
    """Render the three-card problem statement slide."""
    slide = add_blank_slide(prs)
    bg(slide)
    slide_header(slide, "Contexto", "Um mercado fragmentado",
                 "Tracking de saúde hoje: muitas apps, pouca "
                 "inteligência cruzada.")

    # Lead paragraph under the header.
    textbox(slide, Inches(0.6), Inches(2.4), Inches(12.1), Inches(0.9),
            "O utilizador típico usa 4-5 apps separadas. Nenhuma vê o "
            "todo — e as recomendações que oferecem são tabelas "
            "genéricas, não ajustadas ao perfil real.",
            size=15, color=TEXT_DIM)

    # Three-card layout, numbered 01 / 02 / 03 for visual rhythm.
    card_w = Inches(4.0)
    card_h = Inches(3.2)
    card_y = Inches(3.6)
    x0 = Inches(0.6)
    gap = Inches(0.15)

    problems = [
        ("01", "Silos de dados",
         "Treino no Strava. Comida no MyFitnessPal. Sono no Fitbit. Os "
         "dados nunca se cruzam — e é no cruzamento que está a "
         "inteligência."),
        ("02", "Recomendações genéricas",
         "Planos tabelados ignoram objetivos, restrições alimentares, "
         "nível de atividade real e feedback pessoal. Um plano igual "
         "para toda a gente."),
        ("03", "Zero adaptação",
         "Se o utilizador estagna, ninguém ajusta. Se progride, ninguém "
         "reage. O plano de dia 1 é o plano de dia 100."),
    ]

    for i, (num, title, desc) in enumerate(problems):
        left = Emu(x0 + (card_w + gap) * i)
        panel(slide, left, card_y, card_w, card_h, fill=PANEL)

        # Decorative large number at the top of each card.
        textbox(slide, Emu(left + Inches(0.25)),
                Emu(card_y + Inches(0.2)),
                Inches(1.5), Inches(0.6),
                num, size=28, bold=True, color=ACCENT_SOFT)

        # Title gets a 2-line tall textbox so wrapped titles
        # ("Recomendações genéricas") don't collide with the accent bar.
        textbox(slide, Emu(left + Inches(0.25)),
                Emu(card_y + Inches(0.85)),
                Inches(3.55), Inches(0.95),
                title, size=19, bold=True, color=TEXT)

        # Accent rule sits below the reserved title area so it never
        # crosses through descender characters of a wrapped title.
        accent_bar(slide,
                   Emu(left + Inches(0.25)),
                   Emu(card_y + Inches(1.85)),
                   width=Inches(1.2), height=Inches(0.04))

        textbox(slide, Emu(left + Inches(0.25)),
                Emu(card_y + Inches(2.05)),
                Inches(3.55), Inches(1.1),
                desc, size=11.5, color=TEXT_DIM)

    footer(slide, 2)
