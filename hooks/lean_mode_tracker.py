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
    read_stdin_json,
    write_mode,
)

_CMD = re.compile(r"^\s*/(?:prompt-studio:)?lean\s+(\S+)\s*$", re.IGNORECASE)
_OFF = re.compile(r"^\s*(stop\s+lean|normal\s+mode|/(?:prompt-studio:)?lean\s+off)\s*$", re.IGNORECASE)


def main() -> None:
    payload = read_stdin_json()
    prompt = str(payload.get("prompt", ""))

    if _OFF.match(prompt):
        clear_mode()
        emit_prompt_submit(system_message="LEAN MODE OFF")
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
