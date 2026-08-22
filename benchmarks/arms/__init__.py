"""Benchmark arms. Each arm exposes `build(task: str) -> list[dict]`.

Zero-drift by construction: the `lean_*` arms call `get_lean_instructions`
from `app.services.skills`, the same builder the FastAPI provider adapters
(`app/services/formats.py::build_messages`) use in production.
"""
from __future__ import annotations

import sys
from pathlib import Path

_REPO = Path(__file__).resolve().parent.parent.parent
if str(_REPO) not in sys.path:
    sys.path.insert(0, str(_REPO))

from app.services.skills import filter_skill_body_for_mode, get_lean_instructions, normalize_mode  # noqa: E402

_CAVEMAN_SKILL = (Path(__file__).parent / "caveman-SKILL.md").read_text(encoding="utf-8")

# ponytail: sibling skill loaded from its installed plugin cache. Any drift
# between lean and ponytail shows up as a real arm difference.
_PONYTAIL_ROOT = Path.home() / ".claude/plugins/cache/ponytail/ponytail"
_versions = sorted(p for p in _PONYTAIL_ROOT.iterdir() if p.is_dir()) if _PONYTAIL_ROOT.is_dir() else []
_PONYTAIL_SKILL = (_versions[-1] / "skills/ponytail/SKILL.md").read_text(encoding="utf-8") if _versions else ""


def _ponytail_instructions(mode: str) -> str:
    m = normalize_mode(mode)
    return f"PONYTAIL MODE ACTIVE — level: {m}\n\n" + filter_skill_body_for_mode(_PONYTAIL_SKILL, m)


def _msgs(system: str | None, task: str) -> list[dict]:
    out = []
    if system:
        out.append({"role": "system", "content": system})
    out.append({"role": "user", "content": task})
    return out


# Terse control: plain "be concise", no skill. The honest skill delta is
# skill-vs-terse, not skill-vs-baseline — it isolates the skill from generic
# terseness. lean: single fixed prefix, no per-model tuning.
TERSE_PREFIX = "Answer concisely."


def baseline(task: str) -> list[dict]:
    return _msgs(None, task)


def terse(task: str) -> list[dict]:
    return _msgs(TERSE_PREFIX, task)


def caveman(task: str) -> list[dict]:
    return _msgs(_CAVEMAN_SKILL, task)


def lean_lite(task: str) -> list[dict]:
    return _msgs(get_lean_instructions("lite"), task)


def lean_full(task: str) -> list[dict]:
    return _msgs(get_lean_instructions("full"), task)


def lean_ultra(task: str) -> list[dict]:
    return _msgs(get_lean_instructions("ultra"), task)


def ponytail_lite(task: str)  -> list[dict]: return _msgs(_ponytail_instructions("lite"),  task)
def ponytail_full(task: str)  -> list[dict]: return _msgs(_ponytail_instructions("full"),  task)
def ponytail_ultra(task: str) -> list[dict]: return _msgs(_ponytail_instructions("ultra"), task)


ARMS = {
    "baseline":      baseline,
    "terse":         terse,
    "caveman":       caveman,
    "lean-lite":     lean_lite,
    "lean-full":     lean_full,
    "lean-ultra":    lean_ultra,
    "ponytail-lite": ponytail_lite,
    "ponytail-full": ponytail_full,
    "ponytail-ultra":ponytail_ultra,
}
