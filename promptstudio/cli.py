from __future__ import annotations

import argparse
import json
import sys

from app.services.analyze import analyze_prompt
from app.services.compress import compress_report
from app.services.formats import format_for_model
from app.services.models_registry import DEFAULT_MODEL_ID, MODELS
from app.services.optimize import optimize_prompt
from app.services.scoring import score_prompt
from app.services.tokens import token_report


def _read(text: str | None) -> str:
    if text is None or text == "-":
        return sys.stdin.read()
    return text


def _out(obj) -> None:
    print(obj if isinstance(obj, str) else json.dumps(obj, indent=2))


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="promptstudio", description="Prompt-Studio lean prompt utilities.")
    sub = p.add_subparsers(dest="cmd", required=True)

    def add_common(sp, *, model=False, mode=False):
        sp.add_argument("text", nargs="?", help="Prompt text, or omit / '-' to read stdin.")
        if model:
            sp.add_argument("--model", default=DEFAULT_MODEL_ID, choices=sorted(MODELS), help="Model id.")
        if mode:
            sp.add_argument("--mode", default="full", help="Lean mode: lite | full | ultra.")

    c = sub.add_parser("cost", help="Token + cost report for a prompt.")
    add_common(c, model=True)
    c.add_argument("--output-multiplier", type=float, default=1.8, help="Est. output/input token ratio.")

    add_common(sub.add_parser("compress", help="Compress prompt, report token savings."))
    add_common(sub.add_parser("score", help="Score prompt quality."), mode=True)
    add_common(sub.add_parser("optimize", help="Rewrite prompt for a lean mode."), mode=True)
    add_common(sub.add_parser("analyze", help="Full analysis: tokens, score, format."), model=True, mode=True)
    add_common(sub.add_parser("format", help="Format prompt for a target model."), model=True, mode=True)

    a = p.parse_args(argv)
    text = _read(getattr(a, "text", None))

    if a.cmd == "cost":
        _out(token_report(text, a.model, a.output_multiplier))
    elif a.cmd == "compress":
        _out(compress_report(text))
    elif a.cmd == "score":
        _out(score_prompt(text, a.mode))
    elif a.cmd == "optimize":
        _out(optimize_prompt(text, a.mode))
    elif a.cmd == "analyze":
        _out(analyze_prompt(text, a.mode, a.model))
    elif a.cmd == "format":
        _out(format_for_model(text, a.model, a.mode))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
