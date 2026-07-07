from __future__ import annotations

from fastapi import APIRouter

from app.schemas.prompts import OptimizeRequest
from app.services.optimize import optimize_prompt

router = APIRouter(tags=["optimize"])


@router.post("/optimize")
def optimize(req: OptimizeRequest) -> dict:
    return optimize_prompt(req.prompt, req.mode)
