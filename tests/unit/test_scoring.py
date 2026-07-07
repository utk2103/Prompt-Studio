from __future__ import annotations

from app.services.scoring import get_issues, score_prompt


def test_score_empty_prompt_returns_empty_dict() -> None:
    assert score_prompt("", "TECHNICAL") == {}


def test_score_produces_all_dimensions() -> None:
    s = score_prompt(
        "You are an expert. Analyze the following JSON and produce a markdown table with results.",
        "TECHNICAL",
    )
    for key in ("overall", "clarity", "specificity", "context", "format", "mode_alignment", "token_efficiency", "constraints", "grade"):
        assert key in s


def test_issues_flag_too_short() -> None:
    issues = get_issues("hi", "TECHNICAL")
    codes = {i["code"] for i in issues}
    assert "TOO_SHORT" in codes
