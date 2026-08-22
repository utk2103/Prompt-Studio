#!/usr/bin/env python3
"""SessionStart hook: write Lean state flag + emit ruleset into system context."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from _lean_common import (
    OFF_MODE,
    emit_session_context,
    get_lean_instructions,
    has_persisted_mode,
    read_mode,
    write_mode,
)


def main() -> None:
    persisted = has_persisted_mode()
    mode = read_mode()
    # Only write back if the user has an on-disk preference. Writing the
    # default on first launch would pin the (possibly-drifted) project-scope
    # hash key with "full", orphaning a real "ultra" choice that lives under
    # a different key from a previous run.
    if persisted:
        write_mode(mode)
    if mode == OFF_MODE:
        return
    try:
        emit_session_context(get_lean_instructions(mode))
    except Exception:
        # Silent-fail: never stall the session on hook error.
        pass


if __name__ == "__main__":
    main()
