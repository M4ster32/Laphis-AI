"""Slide 8 — Frontend pages and components."""

from pptx.util import Inches, Emu
from pptx.enum.text import PP_ALIGN

from ...pptx_utils import (
    bg,
    textbox,
    panel,
    accent_dot,
    slide_header,
    footer,
    TEXT,
    TEXT_DIM,
    ACCENT,
    PANEL,
    TEXT_MUTED,
)
from ._common import add_blank_slide
from ..project_facts import FRONTEND_PAGES, FRONTEND_COMPONENTS


def render(prs):
    """Render the frontend pages and components."""
    slide = add_blank_slide(prs)
    bg(slide)
    slide_header(slide, "Frontend", "17 pages, 13 components",
                 "React 19 SPA, routing protegido, dark/light mode.")

    # Both panels share the same Y range so the slide reads as a clean
    # left/right split. Panel ends at 2.8 + 4.0 = 6.8" — clears the footer.
    panel_y = Inches(2.8)
    panel_h = Inches(4.0)
    item_stride = Inches(0.31)

    # ---------- Left column: Pages (12 items, single column) ----------
    textbox(slide, Inches(0.6), Inches(2.4), Inches(5.5), Inches(0.35),
            "Páginas", size=14, bold=True, color=ACCENT)
    panel(slide, Inches(0.6), panel_y, Inches(5.8), panel_h, fill=PANEL)

    page_y = Inches(2.95)
    # Drop description to keep stride small enough that all 12 pages fit
    # inside the 4.0" panel; show name only — descriptions live in the
    # full report.
    for i, (page_name, description) in enumerate(FRONTEND_PAGES):
        y = Emu(page_y + i * item_stride)
        accent_dot(slide, Inches(0.8), Emu(y + Inches(0.06)), size=Inches(0.08))
        textbox(slide, Inches(1.1), y, Inches(5.0), Inches(0.22),
                page_name, size=11, bold=True, color=TEXT)
        textbox(slide, Inches(1.1), Emu(y + Inches(0.16)),
                Inches(5.0), Inches(0.16),
                description, size=8, color=TEXT_DIM)

    # ---------- Right column: Components (13 items, 2 inner columns) ----------
    textbox(slide, Inches(6.75), Inches(2.4), Inches(5.5), Inches(0.35),
            "Componentes", size=14, bold=True, color=ACCENT)
    panel(slide, Inches(6.75), panel_y, Inches(5.8), panel_h, fill=PANEL)

    # 2 inner columns × ~7 rows fits 13 with one empty cell.
    comp_inner_cols = 2
    comp_stride_y = Inches(0.45)
    comp_col_w = Inches(2.7)
    comp_x0 = Inches(6.95)
    comp_y0 = Inches(2.98)

    for i, comp_name in enumerate(FRONTEND_COMPONENTS):
        row = i // comp_inner_cols
        col = i % comp_inner_cols
        x = Emu(comp_x0 + col * comp_col_w)
        y = Emu(comp_y0 + row * comp_stride_y)
        accent_dot(slide, x, Emu(y + Inches(0.08)), size=Inches(0.08))
        textbox(slide, Emu(x + Inches(0.25)), y,
                Inches(2.4), Inches(0.3),
                comp_name, size=11, bold=True, color=TEXT)

    footer(slide, 8)
