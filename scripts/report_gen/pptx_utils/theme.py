"""
Colour palette and slide geometry constants for the LAPHIS deck.

Matches the premium monochromatic language used by the frontend
(inspired by Linear / Notion / Stripe), so the presentation feels
visually consistent with the actual product.
"""

from pptx.util import Inches
from pptx.dml.color import RGBColor


# ---------------------------------------------------------------------------
# Dark surfaces (main background and panels)
# ---------------------------------------------------------------------------

BG_DEEP = RGBColor(0x05, 0x07, 0x0C)
BG_GRAD_END = RGBColor(0x0D, 0x11, 0x1C)
PANEL = RGBColor(0x10, 0x14, 0x1F)
PANEL_HI = RGBColor(0x16, 0x1B, 0x28)

# ---------------------------------------------------------------------------
# Borders and hairlines
# ---------------------------------------------------------------------------

BORDER = RGBColor(0x23, 0x2A, 0x3D)
BORDER_HI = RGBColor(0x33, 0x3D, 0x57)

# ---------------------------------------------------------------------------
# Text scale
# ---------------------------------------------------------------------------

TEXT = RGBColor(0xF5, 0xF7, 0xFA)
TEXT_DIM = RGBColor(0xA5, 0xAE, 0xC0)
TEXT_MUTED = RGBColor(0x6B, 0x74, 0x88)

# ---------------------------------------------------------------------------
# Accent colours — blue/violet gradient stops and semantic alerts
# ---------------------------------------------------------------------------

ACCENT = RGBColor(0x4F, 0x8C, 0xF7)
ACCENT_2 = RGBColor(0x8B, 0x5C, 0xF6)
ACCENT_SOFT = RGBColor(0x26, 0x3D, 0x80)
SUCCESS = RGBColor(0x22, 0xC5, 0x5E)
WARN = RGBColor(0xF5, 0x9E, 0x0B)

# ---------------------------------------------------------------------------
# 16:9 widescreen geometry
# ---------------------------------------------------------------------------

SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)
