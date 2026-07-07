from __future__ import annotations

from fastapi import APIRouter

from app.schemas.prompts import WizardGenerateRequest
from app.services.scoring import get_issues, score_prompt
from app.services.tokens import estimate_tokens
from app.services.wizard import WIZARD_QUESTIONS, build_from_wizard

router = APIRouter(prefix="/wizard", tags=["wizard"])


@router.get("/questions")
def get_wizard_questions() -> dict:
    return {"questions": WIZARD_QUESTIONS, "total": len(WIZARD_QUESTIONS)}


@router.post("/generate")
def wizard_generate(req: WizardGenerateRequest) -> dict:
    prompt = build_from_wizard(req.answers, req.mode)
    return {
        "generated_prompt": prompt,
        "token_estimate": estimate_tokens(prompt),
        "scores": score_prompt(prompt, req.mode),
        "issues": get_issues(prompt, req.mode),
        "mode": req.mode,
        "answers_used": req.answers,
    }
