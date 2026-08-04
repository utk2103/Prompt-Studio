"""Shared helpers for Prompt-Studio Lean plugin hooks.

Reuses `app.services.skills` so the plugin, MCP server, and FastAPI adapters
all emit identical rules.
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

# CLAUDE_PLUGIN_ROOT is set by Claude Code when running plugin hooks.
_ROOT = Path(os.environ.get("CLAUDE_PLUGIN_ROOT", Path(__file__).resolve().parent.parent))
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from app.services.skills import MODES, get_lean_instructions, normalize_mode  # noqa: E402

_STATE_DIR = Path(os.environ.get("CLAUDE_STATE_DIR", Path.home() / ".claude"))
_STATE_FILE = _STATE_DIR / ".lean-active"


def read_mode() -> str:
    try:
        return normalize_mode(_STATE_FILE.read_text(encoding="utf-8").strip())
    except OSError:
        return "full"


def write_mode(mode: str) -> None:
    _STATE_DIR.mkdir(parents=True, exist_ok=True)
    _STATE_FILE.write_text(normalize_mode(mode), encoding="utf-8")


def clear_mode() -> None:
    try:
        _STATE_FILE.unlink()
    except OSError:
        pass


def read_stdin_json() -> dict:
    """Claude Code pipes JSON to hook stdin. Silent-fail on bad input."""
    try:
        raw = sys.stdin.read()
        return json.loads(raw) if raw.strip() else {}
    except (json.JSONDecodeError, OSError):
        return {}


def emit_session_context(text: str) -> None:
    """SessionStart contract: print raw text to stdout for Claude Code."""
    sys.stdout.write(text)
    sys.stdout.flush()


def emit_prompt_submit(system_message: str = "", additional_context: str = "") -> None:
    """UserPromptSubmit contract: emit hookSpecificOutput JSON."""
    out = {"hookSpecificOutput": {"hookEventName": "UserPromptSubmit"}}
    if system_message:
        out["hookSpecificOutput"]["systemMessage"] = system_message
    if additional_context:
        out["hookSpecificOutput"]["additionalContext"] = additional_context
    sys.stdout.write(json.dumps(out))
    sys.stdout.flush()


__all__ = [
    "MODES",
    "get_lean_instructions",
    "normalize_mode",
    "read_mode",
    "write_mode",
    "clear_mode",
    "read_stdin_json",
    "emit_session_context",
    "emit_prompt_submit",
]
