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

    # Left column: Pages.
    textbox(slide, Inches(0.6), Inches(2.4), Inches(5.5), Inches(0.35),
            "Páginas", size=14, bold=True, color=ACCENT)

    pages_panel_h = Inches(3.5)
    panel(slide, Inches(0.6), Inches(2.8), Inches(5.8), pages_panel_h, fill=PANEL)

    page_y = Inches(2.95)
    for i, (page_name, description) in enumerate(FRONTEND_PAGES):
        accent_dot(slide, Inches(0.8), Emu(page_y + Inches(i * 0.35)), size=Inches(0.08))
        textbox(slide, Inches(1.1), Emu(page_y + Inches(i * 0.35)),
                Inches(5.0), Inches(0.3),
                page_name, size=11, bold=True, color=TEXT)
        textbox(slide, Inches(1.1), Emu(page_y + Inches(i * 0.35 + 0.2)),
                Inches(5.0), Inches(0.2),
                description, size=8, color=TEXT_DIM)

    # Right column: Components.
    textbox(slide, Inches(6.75), Inches(2.4), Inches(5.5), Inches(0.35),
            "Componentes", size=14, bold=True, color=ACCENT)

    comps_panel_h = Inches(3.5)
    panel(slide, Inches(6.75), Inches(2.8), Inches(5.8), comps_panel_h, fill=PANEL)

    comp_y = Inches(2.95)
    for i, comp_name in enumerate(FRONTEND_COMPONENTS):
        accent_dot(slide, Inches(6.95), Emu(comp_y + Inches(i * 0.35)), size=Inches(0.08))
        textbox(slide, Inches(7.2), Emu(comp_y + Inches(i * 0.35)),
                Inches(5.0), Inches(0.3),
                comp_name, size=11, bold=True, color=TEXT)

    footer(slide, 8)
