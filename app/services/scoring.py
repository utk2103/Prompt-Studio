from __future__ import annotations

import re

from app.config import get_config
from app.services.fref import fref_score
from app.services.tokens import estimate_tokens

_ACTION_RE = re.compile(
    r"\b(create|write|generate|analyze|explain|summarize|list|compare|describe|"
    r"identify|implement|design|build|evaluate|review|translate|convert|extract|"
    r"provide|suggest|determine|calculate|predict)\b",
    re.I,
)
_CTX_RE = re.compile(
    r"\b(context|background|you are|acting as|role|assume|given|based on|purpose|"
    r"goal|objective|your task)\b",
    re.I,
)
_EXAMPLES_RE = re.compile(r"\b(example|e\.g\.|for instance|such as|input:|output:|sample)\b", re.I)
_FORMAT_RE = re.compile(
    r"\b(format|json|markdown|list|bullet|numbered|table|paragraph|output|response|structure)\b",
    re.I,
)
_CONSTRAINTS_RE = re.compile(
    r"\b(only|limit|max|minimum|do not|don't|avoid|must not|strictly|ensure|required|never|always)\b",
    re.I,
)

_MODE_HITS = {
    "CREATIVE": re.compile(r"\b(story|creative|imagine|narrative|character|scene|poem|fiction|voice|style|tone|vivid)\b", re.I),
    "TECHNICAL": re.compile(r"\b(code|function|algorithm|implement|debug|optimize|api|database|system|architecture|performance)\b", re.I),
    "SYSTEM": re.compile(r"\b(you are|act as|your role|persona|instructions|constraints|rules|always|never|must|assistant)\b", re.I),
}


def _grade(overall: int) -> tuple[str, str]:
    if overall >= 85:
        return "A", "EXCELLENT"
    if overall >= 70:
        return "B", "GOOD"
    if overall >= 55:
        return "C", "FAIR"
    if overall >= 40:
        return "D", "POOR"
    return "F", "CRITICAL"


def score_prompt(text: str, mode: str) -> dict:
    words = text.strip().split()
    wc = len(words)
    if wc == 0:
        return {}

    clarity = min(100, max(15, 100 - abs(wc - 60) * 0.7 - (50 if wc < 5 else 0)))

    actions = len(_ACTION_RE.findall(text))
    specificity = min(100, 20 + actions * 18 + (15 if wc > 15 else 0) + (10 if wc > 40 else 0))

    ctx_hits = len(_CTX_RE.findall(text))
    has_examples = bool(_EXAMPLES_RE.search(text))
    context_score = min(100, 15 + ctx_hits * 22 + (28 if has_examples else 0) + (15 if wc > 50 else 0))

    fmt_hits = len(_FORMAT_RE.findall(text))
    code_block = 20 if "```" in text or "###" in text else 0
    format_score = min(100, 15 + fmt_hits * 28 + code_block)

    mode = mode.upper()
    mode_re = _MODE_HITS.get(mode, _MODE_HITS["SYSTEM"])
    m_hits = len(mode_re.findall(text))
    mode_alignment = min(100, 30 + m_hits * 22)

    tokens = estimate_tokens(text)
    if tokens < 5:
        token_eff = 10
    elif tokens < 20:
        token_eff = 55
    elif tokens < 200:
        token_eff = 92
    elif tokens < 500:
        token_eff = 75
    elif tokens < 1000:
        token_eff = 58
    else:
        token_eff = 38

    con_hits = len(_CONSTRAINTS_RE.findall(text))
    constraints = min(100, 20 + con_hits * 22)

    dims = [clarity, specificity, context_score, format_score, mode_alignment, token_eff, constraints]
    overall = round(sum(dims) / len(dims))
    grade, label = _grade(overall)

    result = {
        "overall": overall,
        "clarity": round(clarity),
        "specificity": round(specificity),
        "context": round(context_score),
        "format": round(format_score),
        "mode_alignment": round(mode_alignment),
        "token_efficiency": round(token_eff),
        "constraints": round(constraints),
        "grade": grade,
        "label": label,
    }

    if get_config().fref_score_enabled:
        result["fref_score"] = fref_score(text)

    return result


_ISSUE_ACTION_RE = re.compile(
    r"\b(create|write|generate|analyze|explain|summarize|list|compare|describe|"
    r"identify|implement|build|evaluate|provide)\b",
    re.I,
)
_ISSUE_FORMAT_RE = re.compile(r"\b(format|output|json|markdown|list|bullet|table|paragraph|step)\b", re.I)
_ISSUE_PERSONA_RE = re.compile(r"\b(you are|act as|your role|persona)\b", re.I)
_ISSUE_EXAMPLES_RE = re.compile(r"\b(example|e\.g\.|for instance|input:|output:)\b", re.I)
_ISSUE_CONSTRAINTS_RE = re.compile(r"\b(only|limit|avoid|do not|must|ensure|strictly)\b", re.I)
_POLITENESS_RE = re.compile(
    r"\b(?:please|kindly|could you|can you|would you|sure|certainly|of course|thank you)\b",
    re.I,
)


def get_issues(text: str, mode: str) -> list[dict]:
    issues: list[dict] = []
    wc = len(text.strip().split())
    mode = mode.upper()

    if wc < 5:
        issues.append({"type": "ERROR", "code": "TOO_SHORT", "message": "Prompt too short — insufficient context for reliable model inference"})
    if wc > 800:
        issues.append({"type": "WARN", "code": "TOO_LONG", "message": "Prompt exceeds 800 words — consider splitting into sub-prompts"})
    if not _ISSUE_ACTION_RE.search(text):
        issues.append({"type": "WARN", "code": "NO_ACTION_VERB", "message": "No clear action verb — model lacks an explicit task directive"})
    if not _ISSUE_FORMAT_RE.search(text):
        issues.append({"type": "INFO", "code": "NO_FORMAT", "message": "No output format specified — ambiguous structure may reduce quality"})
    if mode == "SYSTEM" and not _ISSUE_PERSONA_RE.search(text):
        issues.append({"type": "WARN", "code": "NO_PERSONA", "message": "SYSTEM mode: missing persona definition — add 'You are a...'"})
    if not _ISSUE_EXAMPLES_RE.search(text):
        issues.append({"type": "INFO", "code": "NO_EXAMPLES", "message": "No examples detected — few-shot examples improve output fidelity 15-30%"})
    if not _ISSUE_CONSTRAINTS_RE.search(text):
        issues.append({"type": "INFO", "code": "NO_CONSTRAINTS", "message": "No constraints defined — open-ended prompts risk scope drift"})
    if _POLITENESS_RE.search(text):
        issues.append({"type": "INFO", "code": "POLITENESS", "message": "Politeness markers add tokens without improving model output quality"})
    if not issues:
        issues.append({"type": "OK", "code": "CLEAN", "message": "Format structure looks clean — no critical issues detected"})
    return issues


RECOMMENDATIONS: dict[str, str] = {
    "clarity": "Simplify sentence structure; aim for 40-80 word prompts with clear logic",
    "specificity": "Add a clear action verb: generate, analyze, explain, implement, evaluate",
    "context": "Add role/background context: 'You are a...', 'Given the following...'",
    "format": "Specify output format explicitly: JSON, markdown, bullet list, table",
    "token_efficiency": "Optimize length: remove politeness filler, add domain-specific context",
    "constraints": "Define constraints: word limits, topics to avoid, required inclusions",
    "fref_score": "Improve readability: use simpler sentences and shorter words for better comprehension",
}


def mode_alignment_recommendation(mode: str) -> str:
    mode = mode.upper()
    hint = "code/function" if mode == "TECHNICAL" else "narrative/scene" if mode == "CREATIVE" else "you are/must/always"
    return f"Use vocabulary aligned with {mode} mode (e.g., {hint})"
