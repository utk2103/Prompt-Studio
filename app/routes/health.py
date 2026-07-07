from __future__ import annotations

import time

from fastapi import APIRouter

from app.services.models_registry import MODELS

router = APIRouter(tags=["meta"])


@router.get("/")
def root() -> dict:
    from app.config import get_config
    cfg = get_config()
    return {"service": cfg.app_name, "version": cfg.app_version, "status": "online"}


@router.get("/health")
def health() -> dict:
    return {"status": "healthy", "ts": int(time.time()), "models_loaded": len(MODELS)}
