from __future__ import annotations

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.logger import logger
from app.services import model_catalog
from app.services.models_registry import MODELS

router = APIRouter(tags=["models"])


@router.get("/models")
def list_models(db: Session = Depends(get_db)) -> list[dict]:
    try:
        return model_catalog.list_catalog(db)
    except Exception:
        logger.warning("model_catalog unavailable; serving seed models", exc_info=True)
        return [{"id": k, **v} for k, v in MODELS.items()]


@router.post("/models/refresh")
def refresh_models(db: Session = Depends(get_db)) -> dict:
    try:
        return model_catalog.refresh(db)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Could not fetch model prices: {exc}") from exc
