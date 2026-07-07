from __future__ import annotations

import re

from app.services.scoring import score_prompt


def optimize_prompt(text: str, mode: str) -> dict:
    out = text.strip()
    changes: list[str] = []
    mode = mode.upper()

    if mode == "SYSTEM" and not re.search(r"\b(you are|act as)\b", out, re.I):
        out = "You are an expert AI assistant.\n\n" + out
        changes.append("Added persona definition for SYSTEM mode")
    if not re.search(r"\b(format|output)\b", out, re.I):
        out += "\n\nFormat your response clearly with proper structure and headings where appropriate."
        changes.append("Added output format specification")
    if not re.search(r"\b(example|e\.g\.)\b", out, re.I):
        out += "\nInclude a concrete example to illustrate your answer."
        changes.append("Added example directive for few-shot clarity")
    if not re.search(r"\b(only|avoid|do not|must|ensure)\b", out, re.I):
        out += "\nEnsure accuracy and avoid speculation beyond the provided information."
        changes.append("Added accuracy constraint")
    if not changes:
        changes.append("No critical improvements needed — prompt is well-structured")

    original_score = score_prompt(text, mode).get("overall", 0)
    optimized_score = score_prompt(out, mode).get("overall", 0)
    return {
        "original_prompt": text,
        "optimized_prompt": out,
        "changes_applied": changes,
        "score_delta": optimized_score - original_score,
        "original_score": original_score,
        "optimized_score": optimized_score,
    }
