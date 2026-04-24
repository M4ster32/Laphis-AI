"""
LAPHIS report generation package.

Splits monolithic report/presentation scripts into focused modules:
  - docx_utils/   reusable helpers for python-docx (styles, blocks, tables)
  - pptx_utils/   reusable helpers for python-pptx (layout primitives)
  - content/      single source of truth for project facts and narrative

The rationale is DRY + SRP: both the Word report and PowerPoint deck pull
from the same content module, so updating a single fact (e.g. endpoint
count) propagates everywhere.
"""
