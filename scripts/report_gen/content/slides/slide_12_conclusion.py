"""Slide 12 — Conclusion and next steps."""

from pptx.util import Inches, Pt, Emu
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN

from ...pptx_utils import (
    bg,
    textbox,
    panel,
    chip,
    gradient_panel,
    slide_header,
    footer,
    solid,
    no_line,
    set_line,
    TEXT,
    TEXT_DIM,
    TEXT_MUTED,
    ACCENT,
    ACCENT_SOFT,
    PANEL,
    PANEL_HI,
    BORDER_HI,
    BG_DEEP,
)
from ._common import add_blank_slide


def render(prs):
    """Render the conclusion slide with summary and next steps."""
    slide = add_blank_slide(prs)
    bg(slide)
    slide_header(slide, "Conclusão", "LAPHIS em produção",
                 "MVP completo. Pronto para crescer.")

    # Hero panel with gradient.
    hero_y = Inches(2.5)
    gradient_panel(slide, Inches(0.6), hero_y, Inches(12.1), Inches(1.3),
                   ACCENT_SOFT, PANEL_HI, angle=90)

    textbox(slide, Inches(1.0), Emu(hero_y + Inches(0.2)),
            Inches(11), Inches(0.9),
            "Do tracking fragmentado para a inteligência unificada.",
            size=24, bold=True, color=TEXT)

    # Achievements.
    achieve_y = Inches(4.1)
    textbox(slide, Inches(0.6), achieve_y, Inches(12.1), Inches(0.3),
            "Conquistado", size=13, bold=True, color=ACCENT)

    achievements = [
        ("✓", "Plataforma web escalável com 17 páginas"),
        ("✓", "API robusta com 100+ endpoints"),
        ("✓", "Assistente IA com RAG integrado"),
        ("✓", "Testes automatizados e cobertura 85%+"),
        ("✓", "Deploy contínuo com GitHub Actions"),
        ("✓", "Dark/light mode, JWT, design system premium"),
    ]

    achieve_panel_y = Inches(4.45)
    panel(slide, Inches(0.6), achieve_panel_y, Inches(12.1), Inches(1.8), fill=PANEL)

    for i, (icon, text) in enumerate(achievements):
        row = i // 3
        col = i % 3
        x = Emu(Inches(0.8 + col * 4.0))
        y = Emu(achieve_panel_y + Inches(0.2 + row * 0.45))
        textbox(slide, x, y, Inches(3.8), Inches(0.4),
                f"{icon}  {text}", size=11, color=TEXT)

    # Next steps.
    next_y = Inches(6.4)
    textbox(slide, Inches(0.6), next_y, Inches(12.1), Inches(0.3),
            "Próximos Passos", size=13, bold=True, color=ACCENT)

    next_items = [
        "📱 App móvel (React Native / Flutter)",
        "🔔 Push notifications e engagement",
        "🌍 Internacionalização (i18n)",
        "🚀 Escalar base de utilizadores",
    ]

    next_panel_y = Inches(6.75)
    panel(slide, Inches(0.6), next_panel_y, Inches(12.1), Inches(1.2), fill=PANEL)
    for j, item in enumerate(next_items):
        y = Emu(next_panel_y + Inches(0.15 + j * 0.28))
        textbox(slide, Inches(0.8), y, Inches(11.7), Inches(0.25),
                item, size=11, color=TEXT_DIM)

    footer(slide, 12)
