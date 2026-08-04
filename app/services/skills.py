from __future__ import annotations

import re
from functools import lru_cache
from pathlib import Path

MODES = ("lite", "full", "ultra")
DEFAULT_MODE = "full"
SKILL_PATH = Path(__file__).resolve().parent.parent / "skills" / "lean" / "SKILL.md"

_TABLE_LABEL = re.compile(r"^\|\s*\*\*(.+?)\*\*\s*\|")
_EXAMPLE_LABEL = re.compile(r'^-\s*([^:]+):\s*"')
_FRONTMATTER = re.compile(r"^---[\s\S]*?---\s*")


def normalize_mode(mode: str | None) -> str:
    m = (mode or "").strip().lower()
    return m if m in MODES else DEFAULT_MODE


def filter_skill_body_for_mode(body: str, mode: str) -> str:
    effective = normalize_mode(mode)
    body = _FRONTMATTER.sub("", body or "", count=1)
    out = []
    for line in body.splitlines():
        for pat in (_TABLE_LABEL, _EXAMPLE_LABEL):
            m = pat.match(line)
            if m:
                label = m.group(1).strip().lower()
                if label in MODES and label != effective:
                    break
        else:
            out.append(line)
    return "\n".join(out)


def _fallback(mode: str) -> str:
    return (
        f"LEAN MODE ACTIVE — level: {mode}\n\n"
        "You are a lazy senior developer. The best code is the code never written.\n"
        "Ladder: 1) YAGNI 2) reuse 3) stdlib 4) native 5) existing dep 6) one line 7) minimum code.\n"
        "Never simplify away: input validation at trust boundaries, error handling that prevents data loss, "
        "security, accessibility, anything explicitly requested. Non-trivial logic leaves one runnable check.\n"
        "Output: code first, then at most three short lines of what was skipped and when to add it."
    )


@lru_cache(maxsize=8)
def get_lean_instructions(mode: str = DEFAULT_MODE) -> str:
    effective = normalize_mode(mode)
    try:
        body = SKILL_PATH.read_text(encoding="utf-8")
    except OSError:
        return _fallback(effective)
    return f"LEAN MODE ACTIVE — level: {effective}\n\n" + filter_skill_body_for_mode(body, effective)
