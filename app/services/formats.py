from __future__ import annotations

from app.services.models_registry import get_model_or_default


def format_for_model(text: str, model_id: str, mode: str) -> str:
    mdl = get_model_or_default(model_id)
    fmt = mdl["format"]
    role = "system" if mode.upper() == "SYSTEM" else "user"
    body = text[:500] + ("..." if len(text) > 500 else "")

    if fmt == "XML Tags":
        return f"<prompt>\n  <mode>{mode.lower()}</mode>\n  <content>\n    {body}\n  </content>\n</prompt>"
    if fmt == "Llama Template":
        return f"[INST] <<SYS>>\nMode: {mode}\n<</SYS>>\n\n{body}\n[/INST]"
    escaped = body.replace('"', '\\"').replace("\n", "\\n")
    return f'{{"role": "{role}", "content": "{escaped}"}}'
