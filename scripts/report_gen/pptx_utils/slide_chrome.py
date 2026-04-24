"""
Consistent header and footer helpers for content slides.

Content slides share a kicker + title + divider header and a thin
footer with page numbering.
"""

from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN

from .theme import TEXT, TEXT_DIM, TEXT_MUTED, BORDER, ACCENT
from .primitives import textbox, chip


def slide_header(slide, kicker, title, subtitle=None):
    """
    Standard header for a content slide.

    :param slide: python-pptx slide.
    :param kicker: Small coloured label above the title.
    :param title: Main slide title.
    :param subtitle: Optional italic subtitle.
    """
    chip(slide, Inches(0.6), Inches(0.55), kicker, fg=ACCENT, size=11)
    textbox(slide, Inches(0.6), Inches(0.9), Inches(12), Inches(0.95),
            title, size=34, bold=True, color=TEXT)

    if subtitle:
        textbox(slide, Inches(0.6), Inches(1.75), Inches(12), Inches(0.5),
                subtitle, size=14, color=TEXT_DIM, italic=True)

    # Divider line below the header.
    y_line = Inches(2.15) if subtitle else Inches(1.95)
    line = slide.shapes.add_connector(1, Inches(0.6), y_line,
                                       Inches(12.7), y_line)
    line.line.color.rgb = BORDER
    line.line.width = Pt(0.5)


def footer(slide, num, total=12):
    """
    Standard footer: thin rule, brand on the left, page number on the right.

    :param slide: python-pptx slide.
    :param num: Current slide number (1-indexed).
    :param total: Total number of slides in the deck.
    """
    line = slide.shapes.add_connector(1, Inches(0.6), Inches(7.05),
                                       Inches(12.7), Inches(7.05))
    line.line.color.rgb = BORDER
    line.line.width = Pt(0.5)

    textbox(slide, Inches(0.6), Inches(7.15), Inches(6), Inches(0.25),
            "LAPHIS  ·  Projeto II  ·  2026",
            size=9, color=TEXT_MUTED, bold=True)

    textbox(slide, Inches(11.5), Inches(7.15), Inches(1.2), Inches(0.25),
            f"{num:02d} / {total:02d}",
            size=9, color=TEXT_MUTED, align=PP_ALIGN.RIGHT, bold=True)
