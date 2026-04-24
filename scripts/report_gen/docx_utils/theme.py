"""
Shared colour palette and low-level run/style helpers for the Lusofona
report template. Isolated here so future theme tweaks (e.g. brand colour
change) touch a single file.
"""

from docx.shared import Pt, Cm, RGBColor


# Lusofona brand-aligned navy, used for headings and table headers.
NAVY = RGBColor(0x1F, 0x3A, 0x68)
# Body text default.
TEXT = RGBColor(0x1A, 0x1A, 0x1A)
# Secondary text (captions, placeholders).
GREY = RGBColor(0x55, 0x5A, 0x63)
# Very light text used sparingly for muted annotations.
LIGHT = RGBColor(0x8A, 0x90, 0x9A)


def set_run(run, name="Calibri", size=11, bold=False, italic=False, color=None):
    """
    Apply font attributes to a docx run in a single call.

    Centralises the repetitive run-styling boilerplate so callers stay
    declarative.

    :param run: python-docx Run instance to mutate.
    :param name: Font family name.
    :param size: Font size in points.
    :param bold: Whether the run is bold.
    :param italic: Whether the run is italic.
    :param color: Optional RGBColor; when None, current colour is kept.
    :returns: The same run, for optional chaining.
    """
    run.font.name = name
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    if color is not None:
        run.font.color.rgb = color
    return run


def apply_base_style(doc):
    """
    Configure margins and the Normal style to match the Lusofona template.

    Called once at document creation time. Left margin is 3.0 cm to keep
    binding clearance, remaining margins follow the template.

    :param doc: python-docx Document instance.
    """
    # Page geometry mirrors the official Lusofona PDF template.
    for section in doc.sections:
        section.top_margin = Cm(2.5)
        section.bottom_margin = Cm(2.5)
        section.left_margin = Cm(3.0)
        section.right_margin = Cm(2.5)
        section.header_distance = Cm(1.25)
        section.footer_distance = Cm(1.25)

    # Body text baseline: Calibri 11pt with 1.15 line spacing, matches the
    # readability profile of the reference template.
    style = doc.styles["Normal"]
    style.font.name = "Calibri"
    style.font.size = Pt(11)
    style.paragraph_format.space_after = Pt(6)
    style.paragraph_format.line_spacing = 1.15
