"""Slide 10 — Quality assurance and metrics."""

from pptx.util import Inches, Emu
from pptx.enum.text import PP_ALIGN

from ...pptx_utils import (
    bg,
    textbox,
    panel,
    chip,
    slide_header,
    footer,
    TEXT,
    TEXT_DIM,
    ACCENT,
    PANEL,
    TEXT_MUTED,
)
from ._common import add_blank_slide


def render(prs):
    """Render the quality metrics and testing overview."""
    slide = add_blank_slide(prs)
    bg(slide)
    slide_header(slide, "Qualidade", "Testes, cobertura, performance",
                 "pytest + httpx no backend. Vitest no frontend.")

    # Metrics cards (3 x 2 grid).
    metrics = [
        ("Testes Backend", "250+", "Integração + unitários"),
        ("Testes Frontend", "80+", "Componentes + fluxos"),
        ("Cobertura", "85%+", "Python + TypeScript"),
        ("Performance", "<200ms", "P95 de resposta API"),
        ("Uptime", "99.5%", "SLA em produção"),
        ("Type Safety", "100%", "mypy + TypeScript strict"),
    ]

    card_w = Inches(3.7)
    card_h = Inches(1.6)
    gap = Inches(0.15)
    start_x = Inches(0.6)
    start_y = Inches(2.5)

    for idx, (label, value, desc) in enumerate(metrics):
        row = idx // 3
        col = idx % 3
        x = Emu(start_x + col * (card_w + gap))
        y = Emu(start_y + row * (card_h + gap))

        panel(slide, x, y, card_w, card_h, fill=PANEL)

        chip(slide, Emu(x + Inches(0.2)), Emu(y + Inches(0.15)), label, fg=ACCENT, size=9)
        textbox(slide, Emu(x + Inches(0.2)), Emu(y + Inches(0.5)),
                Inches(3.3), Inches(0.35),
                value, size=20, bold=True, color=ACCENT)
        textbox(slide, Emu(x + Inches(0.2)), Emu(y + Inches(0.88)),
                Inches(3.3), Inches(0.55),
                desc, size=9, color=TEXT_DIM)

    # Testing strategy at bottom.
    strat_y = Inches(5.2)
    textbox(slide, Inches(0.6), strat_y, Inches(12.1), Inches(0.3),
            "Estratégia de Testes", size=13, bold=True, color=ACCENT)

    strategy_items = [
        "Unit tests: funções isoladas (validação, conversão, lógica)",
        "Integração: testa fluxos com BD real (auth, CRUD, SAG)",
        "E2E: workflows críticos (registo → login → criar plano → chat)",
        "Cobertura: target 85%+ de linhas, focus em caminhos de erro",
    ]

    panel(slide, Inches(0.6), Emu(strat_y + Inches(0.4)), Inches(12.1), Inches(1.4), fill=PANEL)
    for j, item in enumerate(strategy_items):
        y = Emu(strat_y + Inches(0.55 + j * 0.32))
        textbox(slide, Inches(0.8), y, Inches(11.7), Inches(0.3),
                f"• {item}", size=9.5, color=TEXT_DIM)

    footer(slide, 10)
