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

OFF_MODE = "off"


def _state_dir() -> Path:
    # ponytail #34: honor CLAUDE_CONFIG_DIR (Claude Code standard) too.
    for var in ("CLAUDE_STATE_DIR", "CLAUDE_CONFIG_DIR"):
        v = os.environ.get(var)
        if v:
            return Path(v)
    return Path.home() / ".claude"


_STATE_FILE = _state_dir() / ".lean-active"


def read_mode() -> str:
    try:
        raw = _STATE_FILE.read_text(encoding="utf-8").strip().lower()
    except OSError:
        return "full"
    if raw == OFF_MODE:
        return OFF_MODE
    return normalize_mode(raw)


def write_mode(mode: str) -> None:
    m = OFF_MODE if mode == OFF_MODE else normalize_mode(mode)
    try:
        _STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
        _STATE_FILE.write_text(m, encoding="utf-8")
    except OSError:
        # ponytail #386: disk full / perm error must not crash the hook.
        pass


def clear_mode() -> None:
    # #488: "off" persists across sessions instead of deleting the flag.
    write_mode(OFF_MODE)


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
    "OFF_MODE",
    "get_lean_instructions",
    "normalize_mode",
    "read_mode",
    "write_mode",
    "clear_mode",
    "read_stdin_json",
    "emit_session_context",
    "emit_prompt_submit",
]
