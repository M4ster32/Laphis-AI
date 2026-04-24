"""
Slide renderers — one module per slide.

Each module exports a `render(prs)` function that appends its slide to
the presentation. The build script composes them in order. Splitting by
slide keeps individual files short and makes it trivial to swap or
reorder slides without touching neighbours.
"""

from . import (
    slide_01_cover,
    slide_02_problem,
    slide_03_solution,
    slide_04_architecture,
    slide_05_stack,
    slide_06_datamodel,
    slide_07_backend,
    slide_08_frontend,
    slide_09_intelligence,
    slide_10_quality,
    slide_11_deploy,
    slide_12_conclusion,
)

# Ordered list makes the build script trivially a for-loop.
ALL_SLIDES = [
    slide_01_cover,
    slide_02_problem,
    slide_03_solution,
    slide_04_architecture,
    slide_05_stack,
    slide_06_datamodel,
    slide_07_backend,
    slide_08_frontend,
    slide_09_intelligence,
    slide_10_quality,
    slide_11_deploy,
    slide_12_conclusion,
]

__all__ = ["ALL_SLIDES"]
