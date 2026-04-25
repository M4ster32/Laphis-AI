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
    textbox(slide, Inches(0.6), Inches(2.35), Inches(12.1), Inches(0.3),
            "Estrutura de routers por domínio funcional.",
            size=12, color=TEXT_MUTED, italic=True)

    # Two-column layout for routers. The slide bottom (footer) sits
    # around y=6.9", so the panel needs to fit between 2.75 and 6.7.
    # 10 items per column × 0.39" stride = 3.9" inside a 3.95" panel.
    col_w = Inches(6.0)
    col_h = Inches(4.05)
    col_y = Inches(2.75)
    col_x1 = Inches(0.6)
    col_x2 = Inches(6.75)
    item_stride = Inches(0.39)
    name_h = Inches(0.2)
    desc_h = Inches(0.18)

    routers_col1 = BACKEND_ROUTERS[:10]
    routers_col2 = BACKEND_ROUTERS[10:]

    def render_router_column(x, y, routers):
        """Render one column of router rows inside its background panel."""
        panel(slide, x, y, col_w, col_h, fill=PANEL)
        # Inset content from the panel edges so text never touches them.
        inner_x = Emu(x + Inches(0.22))
        row_y = Emu(y + Inches(0.18))
        for name, count, desc in routers:
            accent_dot(slide, inner_x, Emu(row_y + Inches(0.07)), size=Inches(0.08))
            textbox(slide, Emu(inner_x + Inches(0.22)), row_y,
                    Inches(4.6), name_h,
                    name.upper(), size=10.5, bold=True, color=TEXT)
            # Endpoint count on the right edge as a small accent number.
            textbox(slide, Emu(x + col_w - Inches(0.6)), row_y,
                    Inches(0.45), name_h,
                    str(count), size=10.5, bold=True, color=ACCENT,
                    align=PP_ALIGN.RIGHT)
            textbox(slide, Emu(inner_x + Inches(0.22)),
                    Emu(row_y + Inches(0.2)),
                    Inches(5.0), desc_h,
                    desc, size=8, color=TEXT_DIM)
            row_y = Emu(row_y + item_stride)

    render_router_column(col_x1, col_y, routers_col1)
    render_router_column(col_x2, col_y, routers_col2)

    footer(slide, 7)
