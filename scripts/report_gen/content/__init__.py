"""
Single source of truth for LAPHIS project facts and narrative content.

Both the Word report and the PowerPoint deck import from here, so a
factual update (e.g. endpoint count) lands in one place only.
"""

from .project_facts import (
    PROJECT,
    BACKEND_ROUTERS,
    BACKEND_STACK,
    FRONTEND_STACK,
    INFRA_STACK,
    ENTITIES,
    FRONTEND_PAGES,
    FRONTEND_COMPONENTS,
    FUNCTIONAL_REQUIREMENTS,
    NON_FUNCTIONAL_REQUIREMENTS,
    USE_CASES,
    TEST_MODULES,
    METRICS,
    SIGLAS,
    REFERENCES,
)

__all__ = [
    "PROJECT",
    "BACKEND_ROUTERS",
    "BACKEND_STACK",
    "FRONTEND_STACK",
    "INFRA_STACK",
    "ENTITIES",
    "FRONTEND_PAGES",
    "FRONTEND_COMPONENTS",
    "FUNCTIONAL_REQUIREMENTS",
    "NON_FUNCTIONAL_REQUIREMENTS",
    "USE_CASES",
    "TEST_MODULES",
    "METRICS",
    "SIGLAS",
    "REFERENCES",
]
