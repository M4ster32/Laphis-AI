"""
Report section renderers.

Each module here exports a single `render(doc)` function that appends its
chapter to the document. The top-level report script composes them in
order. This makes each chapter independently editable and keeps each file
well under any reasonable length limit.
"""

from . import (
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

__all__ = [
    "front_matter",
    "introducao",
    "pertinencia",
    "especificacao",
    "solucao",
    "testes",
    "metodo",
    "resultados",
    "conclusao",
    "back_matter",
]
