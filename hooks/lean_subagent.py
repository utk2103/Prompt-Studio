#!/usr/bin/env python3
"""SubagentStart hook: re-inject the Lean ruleset into spawned subagents.

Parent-thread system context does not propagate to Task-spawned subagents, so
without this the subagent regresses to defaults.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from _lean_common import OFF_MODE, get_lean_instructions, read_mode


def main() -> None:
    try:
        mode = read_mode()
        if mode == OFF_MODE:
            return
        text = get_lean_instructions(mode)
        sys.stdout.write(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "SubagentStart",
                "additionalContext": text,
            }
        }))
        sys.stdout.flush()
    except Exception:
        pass


if __name__ == "__main__":
    main()
