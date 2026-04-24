"""
Low-level shape-fill helpers.

python-pptx exposes solid fills but not linear gradients; `gradient_fill`
assembles the OOXML manually.
"""

from pptx.util import Pt
from pptx.oxml.ns import qn
from lxml import etree


def _rgb_tuple(color):
    """
    Normalise either an (r,g,b) tuple or a python-pptx RGBColor to a tuple.

    :param color: RGBColor instance or 3-tuple of ints.
    :returns: 3-tuple of ints.
    """
    if hasattr(color, "__iter__") and not isinstance(color, str):
        return (color[0], color[1], color[2])
    return color


def solid(shape, rgb):
    """
    Apply a solid fill to a shape.

    :param shape: python-pptx shape.
    :param rgb: RGBColor instance.
    """
    shape.fill.solid()
    shape.fill.fore_color.rgb = rgb


def no_line(shape):
    """Remove the outline of a shape."""
    shape.line.fill.background()


def set_line(shape, rgb, width=0.75):
    """
    Set line colour and weight on a shape.

    :param shape: python-pptx shape.
    :param rgb: RGBColor for the line.
    :param width: Line width in points.
    """
    shape.line.color.rgb = rgb
    shape.line.width = Pt(width)


def gradient_fill(shape, rgb_from, rgb_to, angle=90):
    """
    Apply a two-stop linear gradient fill to a shape via direct OOXML.

    Built manually because python-pptx has no high-level gradient API.
    The existing fill element is cleared before the gradient is inserted
    to avoid Office refusing to open the file due to conflicting fills.

    :param shape: python-pptx shape.
    :param rgb_from: Start colour (tuple or RGBColor).
    :param rgb_to: End colour (tuple or RGBColor).
    :param angle: Gradient angle in degrees (0 = left→right, 90 = top→bottom).
    """
    spPr = shape.fill._xPr

    # Wipe every possible fill element so our gradFill becomes the only one.
    for tag in ("a:solidFill", "a:gradFill", "a:noFill",
                "a:blipFill", "a:pattFill"):
        for el in spPr.findall(qn(tag)):
            spPr.remove(el)

    c1 = _rgb_tuple(rgb_from)
    c2 = _rgb_tuple(rgb_to)

    grad = etree.SubElement(spPr, qn("a:gradFill"))
    grad.set("flip", "none")
    grad.set("rotWithShape", "1")

    stops = etree.SubElement(grad, qn("a:gsLst"))
    for pos, rgb in ((0, c1), (100000, c2)):
        gs = etree.SubElement(stops, qn("a:gs"))
        gs.set("pos", str(pos))
        srgb = etree.SubElement(gs, qn("a:srgbClr"))
        srgb.set("val", f"{rgb[0]:02X}{rgb[1]:02X}{rgb[2]:02X}")

    lin = etree.SubElement(grad, qn("a:lin"))
    # OOXML angles are measured in sixtieths of a degree.
    lin.set("ang", str(angle * 60000))
    lin.set("scaled", "0")
    etree.SubElement(grad, qn("a:tileRect"))
