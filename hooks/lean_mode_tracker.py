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

_CMD = re.compile(r"^\s*/(?:prompt-studio:)?lean\s+(\S+)\s*$", re.IGNORECASE)
_BARE = re.compile(r"^\s*/(?:prompt-studio:)?lean\s*$", re.IGNORECASE)
_OFF = re.compile(r"^\s*(stop\s+lean|normal\s+mode|/(?:prompt-studio:)?lean\s+off)\s*$", re.IGNORECASE)


def _probe_log(payload: dict) -> None:
    """TEMP: log every hook invocation to verify which prompts trigger UserPromptSubmit."""
    import json as _j
    import time as _t
    try:
        with open("/tmp/lean-usage-probe.log", "a", encoding="utf-8") as _f:
            _f.write(_j.dumps({
                "ts": _t.time(),
                "prompt": (payload.get("prompt") or "")[:200],
                "keys": sorted(payload.keys()),
            }) + "\n")
    except OSError:
        pass


def main() -> None:
    payload = read_stdin_json()
    _probe_log(payload)
    prompt = str(payload.get("prompt", ""))

    if _OFF.match(prompt):
        clear_mode()  # writes "off"; persists across sessions (#488)
        emit_prompt_submit(system_message="LEAN MODE OFF")
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
