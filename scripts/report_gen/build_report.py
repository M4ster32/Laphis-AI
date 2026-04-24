"""
Main orchestrator for the LAPHIS Projeto II report (Lusofona template).

This script has a single responsibility: compose the document by calling
each section module in order. All formatting logic lives in docx_utils;
all content lives in content/*. To regenerate the report, run:

    python -m scripts.report_gen.build_report

The output path is docs/LAPHIS_Relatorio_ProjetoII_Lusofona.docx.
"""

from pathlib import Path

from docx import Document

from .docx_utils import apply_base_style, configure_header, configure_footer
from .content import PROJECT
from .content.report_sections import (
    front_matter,
    introducao,
    pertinencia,
    especificacao,
    solucao,
    testes,
    metodo,
    resultados,
    conclusao,
    back_matter,
)


# Resolved relative to the repository root so the script can be invoked
# from anywhere without path surprises.
OUTPUT_PATH = (
    Path(__file__).resolve().parent.parent.parent
    / "docs"
    / "LAPHIS_Relatorio_ProjetoII_Lusofona.docx"
)


def build() -> Path:
    """
    Assemble the full report document and save it to disk.

    :returns: Path of the generated .docx file.
    """
    doc = Document()
    apply_base_style(doc)

    # Running header uses the work's full title — mirrors the template.
    configure_header(doc, f"{PROJECT['name']} — {PROJECT['full_name']}")
    configure_footer(doc)

    # Canonical report flow. Order is significant for numbering.
    front_matter.render(doc)
    introducao.render(doc)
    pertinencia.render(doc)
    especificacao.render(doc)
    solucao.render(doc)
    testes.render(doc)
    metodo.render(doc)
    resultados.render(doc)
    conclusao.render(doc)
    back_matter.render(doc)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    doc.save(OUTPUT_PATH)
    return OUTPUT_PATH


if __name__ == "__main__":
    path = build()
    print(f"Relatório gerado: {path}")
