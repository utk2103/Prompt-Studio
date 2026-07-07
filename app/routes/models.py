from __future__ import annotations

from fastapi import APIRouter

from app.services.models_registry import MODELS

router = APIRouter(tags=["models"])


@router.get("/models")
def list_models() -> list[dict]:
    return [{"id": k, **v} for k, v in MODELS.items()]
