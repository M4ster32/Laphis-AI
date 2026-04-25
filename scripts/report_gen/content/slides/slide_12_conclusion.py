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

    # Hero panel with gradient — kept to 1.0" so it doesn't push the
    # rest of the page below the footer.
    hero_y = Inches(2.45)
    gradient_panel(slide, Inches(0.6), hero_y, Inches(12.1), Inches(1.0),
                   ACCENT_SOFT, PANEL_HI, angle=90)

    textbox(slide, Inches(1.0), Emu(hero_y + Inches(0.2)),
            Inches(11), Inches(0.6),
            "Do tracking fragmentado para a inteligência unificada.",
            size=22, bold=True, color=TEXT, align=PP_ALIGN.CENTER)

    # Achievements section — 6 items in a 3×2 grid inside a single panel.
    achieve_y = Inches(3.7)
    textbox(slide, Inches(0.6), achieve_y, Inches(12.1), Inches(0.28),
            "Conquistado", size=13, bold=True, color=ACCENT)

    achievements = [
        ("✓", "Plataforma web escalável com 17 páginas"),
        ("✓", "API robusta com 100+ endpoints"),
        ("✓", "Assistente IA com RAG integrado"),
        ("✓", "Testes automatizados e cobertura 85%+"),
        ("✓", "Deploy contínuo com GitHub Actions"),
        ("✓", "Dark/light mode, JWT, design system premium"),
    ]

    achieve_panel_y = Inches(4.05)
    panel(slide, Inches(0.6), achieve_panel_y, Inches(12.1), Inches(1.35), fill=PANEL)

    for i, (icon, text) in enumerate(achievements):
        row = i // 3
        col = i % 3
        x = Emu(Inches(0.8 + col * 4.0))
        y = Emu(achieve_panel_y + Inches(0.18 + row * 0.5))
        textbox(slide, x, y, Inches(3.8), Inches(0.35),
                f"{icon}  {text}", size=11, color=TEXT)

    # Next steps — single panel with items rendered in a 2×2 grid so it
    # fits in 1.1" of vertical space above the footer.
    next_y = Inches(5.65)
    textbox(slide, Inches(0.6), next_y, Inches(12.1), Inches(0.28),
            "Próximos Passos", size=13, bold=True, color=ACCENT)

    next_items = [
        "App móvel (React Native / Flutter)",
        "Push notifications e engagement",
        "Internacionalização (i18n)",
        "Escalar base de utilizadores",
    ]

    next_panel_y = Inches(6.0)
    panel(slide, Inches(0.6), next_panel_y, Inches(12.1), Inches(0.85), fill=PANEL)
    for j, item in enumerate(next_items):
        row = j // 2
        col = j % 2
        x = Emu(Inches(0.85 + col * 6.0))
        y = Emu(next_panel_y + Inches(0.13 + row * 0.34))
        textbox(slide, x, y, Inches(5.8), Inches(0.3),
                f"·  {item}", size=11, color=TEXT_DIM)

    footer(slide, 12)
