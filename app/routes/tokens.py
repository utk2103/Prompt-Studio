from __future__ import annotations

from fastapi import APIRouter

from app.schemas.prompts import TokenRequest
from app.services.tokens import token_report

router = APIRouter(tags=["tokens"])


@router.post("/tokens/count")
def count_tokens(req: TokenRequest) -> dict:
    return token_report(req.prompt, req.model_id, req.output_multiplier)
