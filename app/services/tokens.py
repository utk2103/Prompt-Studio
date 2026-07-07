from __future__ import annotations

from app.services.models_registry import get_model_or_default


def estimate_tokens(text: str) -> int:
    return max(1, len(text) // 4)


def token_report(prompt: str, model_id: str, output_multiplier: float = 1.8) -> dict:
    mdl = get_model_or_default(model_id)
    inp = estimate_tokens(prompt)
    out_est = round(inp * output_multiplier)
    ctx_pct = round(inp / mdl["context"] * 100, 2)
    cost_in = inp / 1_000_000 * mdl["cost_in"]
    cost_out = out_est / 1_000_000 * mdl["cost_out"]
    return {
        "input_tokens": inp,
        "output_est_tokens": out_est,
        "total_est": inp + out_est,
        "context_limit": mdl["context"],
        "context_pct": ctx_pct,
        "fits": inp <= mdl["context"],
        "cost_usd": {
            "input": round(cost_in, 8),
            "output": round(cost_out, 8),
            "total": round(cost_in + cost_out, 8),
        },
        "model": mdl["name"],
        "rates": {"per_1m_input": mdl["cost_in"], "per_1m_output": mdl["cost_out"]},
    }
