"""Slide 6 — Data model (entity overview)."""

from pptx.util import Inches, Emu
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN

from ...pptx_utils import (
    bg,
    textbox,
    panel,
    chip,
    slide_header,
    footer,
    solid,
    no_line,
    TEXT,
    TEXT_DIM,
    TEXT_MUTED,
    ACCENT,
    PANEL,
)
from ._common import add_blank_slide
from ..project_facts import ENTITIES


def render(prs):
    """Render the data model with entity grid."""
    slide = add_blank_slide(prs)
    bg(slide)
    slide_header(slide, "Modelo de Dados", "17 entidades bem estruturadas",
                 "User como raiz. Relações com planos, logs, chat, métricas.")

    # Entity grid: 17 entities in a 5×4 grid (drops the last 3 cells).
    # The slide is 13.333" wide and the header eats ~2.4" of vertical
    # space, so 5 cols × 4 rows fits with breathing room above the
    # footer at ~6.9".
    entities_to_show = ENTITIES[:17]
    cols = 5
    # Width math: start_x + cols*col_w + (cols-1)*gap_x must be <= SLIDE_W (13.333").
    # 0.5 + 5*2.4 + 4*0.13 = 13.02" — fits with a 0.3" right margin.
    col_w = Inches(2.4)
    row_h = Inches(1.05)
    start_x = Inches(0.5)
    start_y = Inches(2.5)
    gap_x = Inches(0.13)
    gap_y = Inches(0.13)

    for idx, (entity_name, fields, description) in enumerate(entities_to_show):
        row = idx // cols
        col = idx % cols
        x = Emu(start_x + col * (col_w + gap_x))
        y = Emu(start_y + row * (row_h + gap_y))

        panel(slide, x, y, col_w, row_h, fill=PANEL)

        # Entity name as title.
        textbox(slide, Emu(x + Inches(0.18)), Emu(y + Inches(0.12)),
                col_w, Inches(0.32),
                entity_name, size=12, bold=True, color=ACCENT)

        # Description below — kept short so it fits in one line.
        textbox(slide, Emu(x + Inches(0.18)), Emu(y + Inches(0.5)),
                Emu(col_w - Inches(0.36)), Inches(0.5),
                description, size=8.5, color=TEXT_DIM, italic=True)

    footer(slide, 6)
