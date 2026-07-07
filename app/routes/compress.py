from __future__ import annotations

from fastapi import APIRouter

from app.schemas.prompts import ScoreRequest
from app.services.compress import compress_report

router = APIRouter(tags=["compress"])


@router.post("/prompt/compress")
def compress_prompt(req: ScoreRequest) -> dict:
    return compress_report(req.prompt)
