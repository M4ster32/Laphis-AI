"""Slide 7 — Backend routers and endpoints."""

from pptx.util import Inches, Emu
from pptx.enum.text import PP_ALIGN

from ...pptx_utils import (
    bg,
    textbox,
    panel,
    chip,
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
from ..project_facts import BACKEND_ROUTERS


def render(prs):
    """Render the backend routers with endpoint counts."""
    slide = add_blank_slide(prs)
    bg(slide)
    slide_header(slide, "Backend", "19 routers, 100+ endpoints",
                 "API stateless, async, OpenAPI auto-doc.")

    # Summary bar.
    textbox(slide, Inches(0.6), Inches(2.3), Inches(12.1), Inches(0.35),
            "Estrutura de routers por domínio funcional.",
            size=13, color=TEXT_MUTED, italic=True)

    # Two-column layout for routers.
    col_w = Inches(5.8)
    col_h = Inches(3.8)
    col_y = Inches(2.8)
    col_x1 = Inches(0.6)
    col_x2 = Inches(6.5)

    routers_col1 = BACKEND_ROUTERS[:10]
    routers_col2 = BACKEND_ROUTERS[10:]

    def render_router_column(x, y, routers):
        panel(slide, x, y, col_w, col_h, fill=PANEL)
        row_y = y
        for name, count, desc in routers:
            accent_dot(slide, Emu(x + Inches(0.25)), Emu(row_y + Inches(0.25)), size=Inches(0.08))
            textbox(slide, Emu(x + Inches(0.5)), row_y,
                    Inches(4.5), Inches(0.25),
                    f"{name.upper()}", size=11, bold=True, color=TEXT)
            chip(slide, Emu(x + Inches(4.8)), row_y, str(count), fg=ACCENT, size=9)
            textbox(slide, Emu(x + Inches(0.5)), Emu(row_y + Inches(0.25)),
                    Inches(4.5), Inches(0.3),
                    desc, size=8, color=TEXT_DIM)
            row_y = Emu(row_y + Inches(0.45))

    render_router_column(col_x1, col_y, routers_col1)
    render_router_column(col_x2, col_y, routers_col2)

    footer(slide, 7)
