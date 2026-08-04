#!/usr/bin/env python3
"""SessionStart hook: write Lean state flag + emit ruleset into system context."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from _lean_common import emit_session_context, get_lean_instructions, read_mode, write_mode


def main() -> None:
    mode = read_mode()
    write_mode(mode)
    try:
        emit_session_context(get_lean_instructions(mode))
    except Exception:
        # Silent-fail: never stall the session on hook error.
        pass


if __name__ == "__main__":
    main()
