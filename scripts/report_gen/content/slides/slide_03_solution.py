"""Slide 3 — Solution overview and objectives."""

from pptx.util import Inches, Pt, Emu
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN

from ...pptx_utils import (
    bg,
    textbox,
    panel,
    gradient_panel,
    slide_header,
    footer,
    solid,
    set_line,
    TEXT,
    TEXT_DIM,
    TEXT_MUTED,
    ACCENT,
    ACCENT_SOFT,
    PANEL_HI,
    BG_DEEP,
    BORDER_HI,
    PANEL,
)
from ._common import add_blank_slide


def render(prs):
    """Render the solution pitch with pillars and objective cards."""
    slide = add_blank_slide(prs)
    bg(slide)
    slide_header(slide, "Proposta", "Uma plataforma. Todos os domínios.",
                 "LAPHIS integra tracking + recomendação + IA "
                 "conversacional num só produto.")

    # Hero panel with gradient — headlines the value proposition.
    hero_y = Inches(2.5)
    gradient_panel(slide, Inches(0.6), hero_y, Inches(12.1), Inches(1.8),
                   ACCENT_SOFT, PANEL_HI, angle=90)
    textbox(slide, Inches(1.0), Emu(hero_y + Inches(0.3)),
            Inches(11), Inches(0.55),
            "Plataforma web com IA que cruza todos os domínios num "
            "único perfil.",
            size=22, bold=True, color=TEXT)

    # Domain pillars in-line inside the hero.
    pillars = ["Treino", "Nutrição", "Hidratação", "Peso",
               "Meditação", "Plano Diário"]
    px0 = Inches(1.0)
    pgap = Inches(0.1)
    pw = Inches(1.73)
    py = Emu(hero_y + Inches(1.05))
    for i, name in enumerate(pillars):
        left = Emu(px0 + (pw + pgap) * i)
        shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE,
                                        left, py, pw, Inches(0.5))
        shape.adjustments[0] = 0.4
        solid(shape, BG_DEEP)
        set_line(shape, BORDER_HI, 0.5)
        textbox(slide, left, Emu(py + Inches(0.13)), pw, Inches(0.3),
                name, size=11, bold=True, color=ACCENT,
                align=PP_ALIGN.CENTER)

    # Objectives grid — five compact numbered cards.
    textbox(slide, Inches(0.6), Inches(4.7), Inches(12), Inches(0.45),
            "Objetivos de Projeto II", size=16, bold=True, color=TEXT)
    textbox(slide, Inches(0.6), Inches(5.1), Inches(12), Inches(0.35),
            "Do protótipo funcional ao produto em produção.",
            size=11, color=TEXT_MUTED, italic=True)

    objs = [
        ("01", "Plataforma web completa"),
        ("02", "Motor de recomendação"),
        ("03", "Assistente IA + RAG"),
        ("04", "Design system premium"),
        ("05", "Testes & deploy real"),
    ]
    ow = Inches(2.35); oh = Inches(1.3); oy = Inches(5.6)
    ogap = Inches(0.125); ox = Inches(0.6)
    for i, (num, text) in enumerate(objs):
        left = Emu(ox + (ow + ogap) * i)
        panel(slide, left, oy, ow, oh, fill=PANEL)
        textbox(slide, Emu(left + Inches(0.25)), Emu(oy + Inches(0.15)),
                ow, Inches(0.4), num, size=16, bold=True, color=ACCENT)
        textbox(slide, Emu(left + Inches(0.25)), Emu(oy + Inches(0.55)),
                Inches(2.1), Inches(0.7), text,
                size=12, bold=True, color=TEXT)

    footer(slide, 3)
