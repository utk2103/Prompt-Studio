"""Public library surface for Prompt-Studio's lean prompt utilities.

Installable via `pip install promptstudio-ai`. Heavy server deps live under
the `[server]` extra; everything re-exported here is pure-Python.
"""

from __future__ import annotations

from app.services.analyze import analyze_prompt, compare_across_models
from app.services.compress import caveman_compress, compress_report
from app.services.formats import format_for_model
from app.services.models_registry import (
    DEFAULT_MODEL_ID,
    MODELS,
    get_model_or_default,
)
from app.services.optimize import optimize_prompt
from app.services.scoring import get_issues, score_prompt
from app.services.tokens import estimate_tokens, token_report

__all__ = [
    "estimate_tokens",
    "token_report",
    "caveman_compress",
    "compress_report",
    "analyze_prompt",
    "compare_across_models",
    "score_prompt",
    "get_issues",
    "optimize_prompt",
    "format_for_model",
    "MODELS",
    "DEFAULT_MODEL_ID",
    "get_model_or_default",
]
