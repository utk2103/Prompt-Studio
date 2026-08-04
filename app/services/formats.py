from __future__ import annotations

from app.services.models_registry import get_model_or_default
from app.services.skills import DEFAULT_MODE, get_lean_instructions


def _preview_body(text: str) -> str:
    return text[:500] + ("..." if len(text) > 500 else "")


def _openai(text: str, mode: str) -> str:
    role = "system" if mode.upper() == "SYSTEM" else "user"
    escaped = _preview_body(text).replace('"', '\\"').replace("\n", "\\n")
    return f'{{"role": "{role}", "content": "{escaped}"}}'


def _anthropic(text: str, mode: str) -> str:
    return (
        f"<prompt>\n  <mode>{mode.lower()}</mode>\n  <content>\n    "
        f"{_preview_body(text)}\n  </content>\n</prompt>"
    )


def _llama(text: str, mode: str) -> str:
    return f"[INST] <<SYS>>\nMode: {mode}\n<</SYS>>\n\n{_preview_body(text)}\n[/INST]"


# Per-provider adapters keyed by SKILL.md-style model "format" tag.
# All share one persona builder (skills.get_lean_instructions).
PROVIDERS: dict[str, callable] = {
    "ChatML": _openai,
    "XML Tags": _anthropic,
    "Gemini Native": _openai,
    "Llama Template": _llama,
    "Mistral Native": _openai,
}


def format_for_model(text: str, model_id: str, mode: str) -> str:
    mdl = get_model_or_default(model_id)
    return PROVIDERS.get(mdl["format"], _openai)(text, mode)


def build_messages(
    text: str,
    model_id: str,
    mode: str = "USER",
    intensity: str = DEFAULT_MODE,
    persona: bool = True,
) -> list[dict]:
    """Provider-agnostic message list with lean persona in the system slot.

    System slot is cache-friendly (Anthropic prompt cache, OpenAI reuse) — keeps
    the persona text stable across turns so it charges once per cache TTL.
    """
    messages: list[dict] = []
    if persona:
        messages.append({
            "role": "system",
            "content": get_lean_instructions(intensity),
            "cache_control": {"type": "ephemeral"},
        })
    messages.append({"role": "user", "content": text})
    return messages
