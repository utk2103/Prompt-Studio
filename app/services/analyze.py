from __future__ import annotations

from app.services.formats import format_for_model
from app.services.models_registry import get_model_or_default
from app.services.scoring import get_issues, score_prompt
from app.services.tokens import estimate_tokens


def analyze_prompt(prompt: str, mode: str, model_id: str) -> dict:
    tokens = estimate_tokens(prompt)
    mdl = get_model_or_default(model_id)
    ctx_pct = round(tokens / mdl["context"] * 100, 2)
    return {
        "prompt_hash": hash(prompt) & 0xFFFFFFFF,
        "mode": mode,
        "model": mdl["name"],
        "scores": score_prompt(prompt, mode),
        "issues": get_issues(prompt, mode),
        "tokens": {
            "input": tokens,
            "context_limit": mdl["context"],
            "context_pct": ctx_pct,
            "fits": tokens <= mdl["context"],
        },
        "format_preview": format_for_model(prompt, model_id, mode),
        "format_type": mdl["format"],
    }


def compare_across_models(prompt: str, mode: str) -> dict:
    from app.services.models_registry import MODELS

    inp = estimate_tokens(prompt)
    s = score_prompt(prompt, mode)
    base_score = s.get("overall", 0) if s else 0

    results: list[dict] = []
    for mid, mdl in MODELS.items():
        fits = inp <= mdl["context"]
        fmt_bonus = 7 if mdl["format"] == "XML Tags" and mode == "SYSTEM" else 0
        compat = round((base_score * 0.6 + (85 + fmt_bonus) * 0.4) * (1 if fits else 0.25))
        cost_per_call = round(
            inp / 1_000_000 * mdl["cost_in"] + (inp * 1.8) / 1_000_000 * mdl["cost_out"],
            8,
        )
        results.append({
            "model_id": mid,
            "name": mdl["name"],
            "provider": mdl["provider"],
            "format": mdl["format"],
            "context_limit": mdl["context"],
            "context_pct": round(inp / mdl["context"] * 100, 2),
            "fits": fits,
            "compat_score": compat,
            "cost_per_call": cost_per_call,
            "needs_adaptation": mdl["format"] not in ["ChatML"],
        })
    results.sort(key=lambda x: x["compat_score"], reverse=True)
    return {
        "input_tokens": inp,
        "mode": mode,
        "results": results,
        "recommended": results[0]["model_id"] if results else None,
    }
