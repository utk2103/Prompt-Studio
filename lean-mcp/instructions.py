"""Pure instruction selection for the Lean MCP server.

No MCP SDK imports here so this stays unit-testable on its own. Reuses the same
builder Prompt-Studio's provider adapters use (`app.services.skills`) so every
host emits identical rules.
"""
from __future__ import annotations

import sys
from pathlib import Path

# Allow running from either `python -m lean_mcp.server` or `python lean-mcp/server.py`.
_REPO_ROOT = Path(__file__).resolve().parent.parent
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from app.services.skills import DEFAULT_MODE, MODES, get_lean_instructions, normalize_mode  # noqa: E402

__all__ = ["MODES", "resolve_mode", "build_instructions"]


def resolve_mode(requested: str | None) -> str:
    """Resolve a requested mode to a served intensity.

    Unknown, empty, or "off" falls back to the configured default (`full`).
    """
    asked = (requested or "").strip().lower()
    if asked in MODES:
        return asked
    return normalize_mode(None) or DEFAULT_MODE


def build_instructions(requested: str | None) -> str:
    return get_lean_instructions(resolve_mode(requested))
