"""Slide 11 — Deployment and DevOps."""

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
    ACCENT,
    PANEL,
    BORDER,
)
from ._common import add_blank_slide


def render(prs):
    """Render the deployment pipeline and DevOps."""
    slide = add_blank_slide(prs)
    bg(slide)
    slide_header(slide, "Deploy & DevOps", "Git push → CI/CD automático",
                 "GitHub Actions, Docker, Render + Vercel, SMTP transacional.")

    # Deployment flow: Dev → GitHub → Render/Vercel → Prod.
    flow_y = Inches(2.6)
    flow_items = [
        ("Dev", "Local environment", "git push origin"),
        ("CI/CD", "GitHub Actions", "pytest, build, lint"),
        ("Backend", "Render", "Docker + PostgreSQL"),
        ("Frontend", "Vercel", "Build + CDN global"),
        ("Prod", "Live", "laphis.vercel.app"),
    ]

    item_w = Inches(2.3)
    item_h = Inches(1.3)
    gap = Inches(0.12)
    total_w = item_w * 5 + gap * 4
    x0 = Emu((Inches(13.333) - total_w) / 2)

    for i, (stage, platform, detail) in enumerate(flow_items):
        x = Emu(x0 + i * (item_w + gap))
        panel(slide, x, flow_y, item_w, item_h, fill=PANEL)

        textbox(slide, Emu(x + Inches(0.15)), Emu(flow_y + Inches(0.12)),
                Inches(2.0), Inches(0.3),
                stage, size=13, bold=True, color=ACCENT)
        textbox(slide, Emu(x + Inches(0.15)), Emu(flow_y + Inches(0.45)),
                Inches(2.0), Inches(0.3),
                platform, size=10, color=TEXT)
        textbox(slide, Emu(x + Inches(0.15)), Emu(flow_y + Inches(0.78)),
                Inches(2.0), Inches(0.4),
                detail, size=8, color=TEXT_DIM)

        # Arrow to next stage.
        if i < 4:
            arrow = slide.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW,
                                           Emu(x + item_w + Inches(0.02)),
                                           Emu(flow_y + item_h / 2 - Inches(0.1)),
                                           Inches(0.2), Inches(0.2))
            solid(arrow, ACCENT)
            no_line(arrow)

    # Infrastructure details.
    infra_y = Inches(4.2)
    textbox(slide, Inches(0.6), infra_y, Inches(12.1), Inches(0.3),
            "Infraestrutura", size=13, bold=True, color=ACCENT)

    infra_panels = [
        ("Backend", "FastAPI + Uvicorn\nPostgreSQL (Render)\nAutomatic migrations"),
        ("Frontend", "React SPA (Vercel)\nGlobal CDN\nSSL + HTTPS"),
        ("CI/CD", "pytest workflow\nESLint checks\nDocker build + push"),
    ]

    panel_w = Inches(3.9)
    panel_h = Inches(1.4)
    gap = Inches(0.15)
    for j, (label, content) in enumerate(infra_panels):
        x = Emu(Inches(0.6) + j * (panel_w + gap))
        y = Emu(infra_y + Inches(0.4))
        panel(slide, x, y, panel_w, panel_h, fill=PANEL)

        textbox(slide, Emu(x + Inches(0.15)), Emu(y + Inches(0.1)),
                Inches(3.6), Inches(0.25),
                label, size=11, bold=True, color=ACCENT)
        textbox(slide, Emu(x + Inches(0.15)), Emu(y + Inches(0.38)),
                Inches(3.6), Inches(0.9),
                content, size=9, color=TEXT_DIM)

    footer(slide, 11)
