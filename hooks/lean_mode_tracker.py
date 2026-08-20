#!/usr/bin/env python3
"""UserPromptSubmit hook: parse `/lean lite|full|ultra|off` and mutate state.

Non-matching prompts pass through untouched.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from _lean_common import (
    MODES,
    clear_mode,
    emit_prompt_submit,
    get_lean_instructions,
    read_mode,
    read_stdin_json,
    write_mode,
)
from lean_stats import format_stats

_CMD = re.compile(r"^\s*/(?:prompt-studio:)?lean\s+(\S+)\s*$", re.IGNORECASE)
_BARE = re.compile(r"^\s*/(?:prompt-studio:)?lean\s*$", re.IGNORECASE)
_OFF = re.compile(r"^\s*(stop\s+lean|normal\s+mode|/(?:prompt-studio:)?lean\s+off)\s*$", re.IGNORECASE)
_STATS = re.compile(r"^\s*/(?:prompt-studio:)?lean-stats\s*$", re.IGNORECASE)

# Claude Code delivers slash commands to hooks as an envelope, not the literal
# command (caveman #537). Rebuild "<name> <args>" so downstream regexes match.
_ENVELOPE_NAME = re.compile(r"<command-name>\s*([^<\s]+)\s*</command-name>", re.IGNORECASE)
_ENVELOPE_ARGS = re.compile(r"<command-args>\s*([^<]*?)\s*</command-args>", re.IGNORECASE)
_LEAN_SLASH = re.compile(r"^/(?:prompt-studio:)?lean(?:-stats)?$", re.IGNORECASE)


def _unwrap(prompt: str) -> str | None:
    """Return lean slash command reconstructed from envelope, prompt unchanged
    if no envelope, or None if envelope belongs to a foreign command (so
    natural-language matchers don't misfire on another command's args)."""
    name = _ENVELOPE_NAME.search(prompt)
    if not name:
        return prompt
    cmd = name.group(1)
    if not _LEAN_SLASH.match(cmd):
        return None
    args_m = _ENVELOPE_ARGS.search(prompt)
    args = args_m.group(1).strip() if args_m else ""
    return f"{cmd} {args}".strip()


def main() -> None:
    payload = read_stdin_json()
    prompt = str(payload.get("prompt", ""))

    # Scheduled/background runs must not receive Lean reinforcement — the
    # injected ruleset would hijack the task prompt (caveman parity).
    if "<scheduled-task" in prompt:
        return

    unwrapped = _unwrap(prompt)
    if unwrapped is None:
        return
    prompt = unwrapped

    if _OFF.match(prompt):
        clear_mode()  # writes "off"; persists across sessions (#488)
        emit_prompt_submit(system_message="LEAN MODE OFF")
        return

    if _STATS.match(prompt):
        try:
            msg = format_stats(payload, read_mode())
        except Exception as e:
            msg = f"LEAN STATS: unable to read session transcript ({e.__class__.__name__})"
        emit_prompt_submit(system_message=msg)
        return

    if _BARE.match(prompt):
        # ponytail #584: bare /lean reports the current mode instead of a no-op.
        emit_prompt_submit(system_message=f"LEAN MODE: {read_mode()}")
        return

    m = _CMD.match(prompt)
    if not m:
        return  # not a lean command — no hook output

    arg = m.group(1).lower()
    if arg not in MODES:
        emit_prompt_submit(system_message=f"LEAN: unknown mode '{arg}'. Valid: {', '.join(MODES)}")
        return

    write_mode(arg)
    emit_prompt_submit(
        system_message=f"LEAN MODE → {arg}",
        additional_context=get_lean_instructions(arg),
    )


if __name__ == "__main__":
    main()
