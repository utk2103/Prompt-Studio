#!/usr/bin/env python3
"""TEMP probe: log every UserPromptSubmit invocation.

Delete after verifying whether /usage fires this hook.
"""
from __future__ import annotations

import json
import sys
import time
from pathlib import Path

LOG = Path("/tmp/lean-usage-probe.log")


def main() -> None:
    try:
        raw = sys.stdin.read()
        data = json.loads(raw) if raw.strip() else {}
    except Exception:
        data = {"_parse_error": True, "_raw": raw[:200] if raw else ""}
    entry = {
        "ts": time.time(),
        "prompt": (data.get("prompt") or "")[:200],
        "keys": sorted(data.keys()),
    }
    try:
        with LOG.open("a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")
    except OSError:
        pass


if __name__ == "__main__":
    main()
