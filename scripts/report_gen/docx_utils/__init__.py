"""Reusable docx building blocks for LAPHIS reports."""

from .theme import (
    NAVY,
    TEXT,
    GREY,
    LIGHT,
    apply_base_style,
    set_run,
)
from .blocks import (
    add_paragraph,
    add_heading,
    add_bullet,
    add_numbered,
    add_caption,
    add_code_block,
    page_break,
)
from .tables import add_table
from .toc import add_toc_entries, add_siglas
from .document_setup import configure_header, configure_footer

__all__ = [
    "NAVY",
    "TEXT",
    "GREY",
    "LIGHT",
    "apply_base_style",
    "set_run",
    "add_paragraph",
    "add_heading",
    "add_bullet",
    "add_numbered",
    "add_caption",
    "add_code_block",
    "page_break",
    "add_table",
    "add_toc_entries",
    "add_siglas",
    "configure_header",
    "configure_footer",
]
