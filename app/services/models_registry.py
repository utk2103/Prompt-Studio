from __future__ import annotations

from app.exceptions import UnknownModelError

MODELS: dict[str, dict] = {
    "gpt-4o":     {"name": "GPT-4o",            "provider": "OpenAI",     "context": 128_000,   "cost_in": 5.00, "cost_out": 15.00, "format": "ChatML"},
    "claude-3-5": {"name": "Claude 3.5 Sonnet", "provider": "Anthropic",  "context": 200_000,   "cost_in": 3.00, "cost_out": 15.00, "format": "XML Tags"},
    "gemini-15":  {"name": "Gemini 1.5 Pro",    "provider": "Google",     "context": 1_000_000, "cost_in": 1.25, "cost_out": 5.00,  "format": "Gemini Native"},
    "gpt-35":     {"name": "GPT-3.5 Turbo",     "provider": "OpenAI",     "context": 16_385,    "cost_in": 0.50, "cost_out": 1.50,  "format": "ChatML"},
    "llama3":     {"name": "Llama 3.1 70B",     "provider": "Meta",       "context": 128_000,   "cost_in": 0.90, "cost_out": 0.90,  "format": "Llama Template"},
    "mistral":    {"name": "Mistral Large",     "provider": "Mistral AI", "context": 32_000,    "cost_in": 4.00, "cost_out": 12.00, "format": "Mistral Native"},
    "deepseek":   {"name": "DeepSeek-V3",       "provider": "DeepSeek",   "context": 64_000,    "cost_in": 0.27, "cost_out": 1.10,  "format": "ChatML"},
}

DEFAULT_MODEL_ID = "claude-3-5"

# Maps each stable public slug to its key in the LiteLLM price map
# (BerriAI/litellm model_prices_and_context_window.json). Used by the server's
# refresh job; slugs whose key is missing from the source keep their seed values.
# claude-3-5 / gemini-15 are retired upstream, so refresh reports them under
# `missing_from_source` and keeps the (now-frozen) seed pricing — intended.
LITELLM_KEYS: dict[str, str] = {
    "gpt-4o": "gpt-4o",
    "claude-3-5": "claude-3-5-sonnet-20241022",
    "gemini-15": "gemini-1.5-pro",
    "gpt-35": "gpt-3.5-turbo",
    "llama3": "meta.llama3-1-70b-instruct-v1:0",
    "mistral": "mistral/mistral-large-latest",
    "deepseek": "deepseek/deepseek-chat",
}

# Optional in-process overlay of refreshed values, keyed by slug. The library
# (pip `promptstudio`) never populates this and stays on MODELS; the FastAPI
# server loads it from the DB at startup and after each refresh so cost math
# reflects live pricing without the registry importing SQLAlchemy.
_OVERLAY: dict[str, dict] = {}


def apply_overlay(rows: dict[str, dict]) -> None:
    _OVERLAY.clear()
    _OVERLAY.update(rows)


def clear_overlay() -> None:
    _OVERLAY.clear()


def get_model(model_id: str) -> dict:
    mdl = _OVERLAY.get(model_id) or MODELS.get(model_id)
    if mdl is None:
        raise UnknownModelError(f"Unknown model_id: {model_id!r}")
    return mdl


def get_model_or_default(model_id: str) -> dict:
    return _OVERLAY.get(model_id) or MODELS.get(model_id) or _OVERLAY.get(DEFAULT_MODEL_ID) or MODELS[DEFAULT_MODEL_ID]
