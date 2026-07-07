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


def get_model(model_id: str) -> dict:
    mdl = MODELS.get(model_id)
    if mdl is None:
        raise UnknownModelError(f"Unknown model_id: {model_id!r}")
    return mdl


def get_model_or_default(model_id: str) -> dict:
    return MODELS.get(model_id, MODELS[DEFAULT_MODEL_ID])
