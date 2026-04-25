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

    # Metrics cards (3 × 2 grid). Heights chosen so the bottom row ends
    # before y=5.2", leaving 1.5" of vertical space for the strategy
    # block and the footer at ~6.85".
    card_w = Inches(4.05)
    card_h = Inches(1.25)
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
        textbox(slide, Emu(x + Inches(0.2)), Emu(y + Inches(0.45)),
                Inches(3.7), Inches(0.4),
                value, size=22, bold=True, color=ACCENT)
        textbox(slide, Emu(x + Inches(0.2)), Emu(y + Inches(0.88)),
                Inches(3.7), Inches(0.32),
                desc, size=9, color=TEXT_DIM)

    # Testing strategy panel — placed below the second row of cards
    # (which ends at start_y + 2*card_h + gap = 2.5 + 2.65 = 5.15) so
    # it never overlaps. The panel itself runs from 5.35 to 6.65,
    # comfortably above the footer at 6.85.
    strat_title_y = Inches(5.3)
    textbox(slide, Inches(0.6), strat_title_y, Inches(12.1), Inches(0.28),
            "Estratégia de Testes", size=13, bold=True, color=ACCENT)

    strategy_items = [
        "Unit tests: funções isoladas (validação, conversão, lógica)",
        "Integração: testa fluxos com BD real (auth, CRUD, SAG)",
        "E2E: workflows críticos (registo → login → criar plano → chat)",
        "Cobertura: target 85%+ de linhas, focus em caminhos de erro",
    ]

    strat_panel_y = Inches(5.65)
    panel(slide, Inches(0.6), strat_panel_y, Inches(12.1), Inches(1.05), fill=PANEL)
    for j, item in enumerate(strategy_items):
        # 4 items in 0.95" of inner panel = 0.24" stride.
        y = Emu(strat_panel_y + Inches(0.13 + j * 0.22))
        textbox(slide, Inches(0.8), y, Inches(11.7), Inches(0.22),
                f"• {item}", size=9.5, color=TEXT_DIM)

    footer(slide, 10)
