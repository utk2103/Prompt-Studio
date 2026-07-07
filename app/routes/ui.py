from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import FileResponse

router = APIRouter(tags=["ui"])

_FRONTEND_INDEX = Path(__file__).resolve().parents[2] / "frontend" / "index.html"


@router.get("/ui")
def serve_ui():
    if _FRONTEND_INDEX.exists():
        return FileResponse(str(_FRONTEND_INDEX))
    return {"message": "Frontend not found. Create frontend/index.html or open it directly."}
