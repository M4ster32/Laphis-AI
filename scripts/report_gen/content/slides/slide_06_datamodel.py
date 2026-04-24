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

    # Entity grid: 17 entities in 3 rows (6 + 6 + 5).
    entities_to_show = ENTITIES[:17]

    col_w = Inches(3.8)
    row_h = Inches(1.8)
    start_x = Inches(0.6)
    start_y = Inches(2.5)
    gap_x = Inches(0.15)
    gap_y = Inches(0.15)

    for idx, (entity_name, fields, description) in enumerate(entities_to_show):
        row = idx // 6
        col = idx % 6
        x = Emu(start_x + col * (col_w + gap_x))
        y = Emu(start_y + row * (row_h + gap_y))

        panel(slide, x, y, col_w, row_h, fill=PANEL)

        # Entity name as title.
        textbox(slide, Emu(x + Inches(0.2)), Emu(y + Inches(0.15)),
                col_w, Inches(0.35),
                entity_name, size=14, bold=True, color=ACCENT)

        # Fields summary (first line only, truncated).
        textbox(slide, Emu(x + Inches(0.2)), Emu(y + Inches(0.55)),
                Inches(3.5), Inches(0.65),
                fields, size=8, color=TEXT_MUTED)

        # Description.
        textbox(slide, Emu(x + Inches(0.2)), Emu(y + Inches(1.25)),
                Inches(3.5), Inches(0.45),
                description, size=9, color=TEXT_DIM, italic=True)

    footer(slide, 6)
