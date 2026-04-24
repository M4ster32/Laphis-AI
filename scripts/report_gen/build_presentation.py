"""
Main orchestrator for the LAPHIS Projeto II presentation.

This script has a single responsibility: compose the presentation by calling
each slide module in order. All formatting logic lives in pptx_utils;
all content lives in content/slides/*. To regenerate the presentation, run:

    python -m scripts.report_gen.build_presentation

The output path is docs/LAPHIS_Apresentacao_ProjetoII.pptx.
"""

from pathlib import Path

from pptx import Presentation

from .content import PROJECT
from .content.slides import (
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


OUTPUT_PATH = (
    Path(__file__).resolve().parent.parent.parent
    / "docs"
    / "LAPHIS_Apresentacao_ProjetoII.pptx"
)


def build() -> Path:
    """
    Assemble the full presentation and save it to disk.

    :returns: Path of the generated .pptx file.
    """
    prs = Presentation()

    # Canonical presentation flow — 12 slides in sequence.
    slide_01_cover.render(prs)
    slide_02_problem.render(prs)
    slide_03_solution.render(prs)
    slide_04_architecture.render(prs)
    slide_05_stack.render(prs)
    slide_06_datamodel.render(prs)
    slide_07_backend.render(prs)
    slide_08_frontend.render(prs)
    slide_09_intelligence.render(prs)
    slide_10_quality.render(prs)
    slide_11_deploy.render(prs)
    slide_12_conclusion.render(prs)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    prs.save(str(OUTPUT_PATH))
    return OUTPUT_PATH


if __name__ == "__main__":
    path = build()
    print(f"Apresentação gerada: {path}")
