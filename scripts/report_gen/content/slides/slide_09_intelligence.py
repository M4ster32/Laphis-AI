"""Slide 9 — AI and RAG system."""

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
    TEXT,
    TEXT_DIM,
    ACCENT,
    ACCENT_SOFT,
    PANEL,
    PANEL_HI,
)
from ._common import add_blank_slide


def render(prs):
    """Render the AI and RAG capabilities."""
    slide = add_blank_slide(prs)
    bg(slide)
    slide_header(slide, "Inteligência Artificial", "OpenAI + RAG integrado",
                 "Chat conversacional, geração de planos, análise contextualizada.")

    # Three-block flow: Chat -> Plans -> RAG.
    blocks = [
        ("Assistente IA", "Chat", "Conversas contextualizadas com histórico\ne fallback a regras."),
        ("Gerador de Planos", "Plans", "Planos personalizados baseados em\nperfil + histórico do utilizador."),
        ("RAG (Documentos)", "Files", "Upload de PDFs. Perguntas sobre\ndocumentos pessoais/médicos."),
    ]

    bw = Inches(3.5)
    bh = Inches(2.0)
    by = Inches(2.6)
    gap = Inches(0.2)
    total_w = bw * 3 + gap * 2
    bx0 = Emu((Inches(13.333) - total_w) / 2)

    for i, (title, badge, desc) in enumerate(blocks):
        x = Emu(bx0 + i * (bw + gap))
        panel(slide, x, by, bw, bh, fill=PANEL)

        chip(slide, Emu(x + Inches(0.25)), Emu(by + Inches(0.15)), badge, fg=ACCENT, size=9)
        textbox(slide, Emu(x + Inches(0.25)), Emu(by + Inches(0.45)),
                Inches(3.0), Inches(0.4), title, size=14, bold=True, color=TEXT)
        textbox(slide, Emu(x + Inches(0.25)), Emu(by + Inches(0.9)),
                Inches(3.0), Inches(0.9), desc, size=10, color=TEXT_DIM)

    # Bottom section: Key features.
    feat_y = Inches(4.9)
    textbox(slide, Inches(0.6), feat_y, Inches(12.1), Inches(0.35),
            "Capacidades", size=14, bold=True, color=ACCENT)

    features = [
        "🧠 Context window até 8K: sumariza histórico do utilizador",
        "📊 Fallback automático: se IA falha, volta para planos tabelados",
        "📄 RAG com embedding: pergunta sobre teus PDFs sem treino",
        "🎯 Planos adaptativos: feedback contínuo refina as recomendações",
    ]

    feat_panel_y = Inches(5.3)
    panel(slide, Inches(0.6), feat_panel_y, Inches(12.1), Inches(1.5), fill=PANEL)

    for j, feature in enumerate(features):
        y = Emu(feat_panel_y + Inches(0.2 + j * 0.3))
        textbox(slide, Inches(0.85), y, Inches(11.7), Inches(0.25),
                feature, size=11, color=TEXT_DIM)

    footer(slide, 9)
