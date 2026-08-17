from __future__ import annotations

from fastapi import APIRouter, Header, Query

from app.schemas.prompts import HistoryEntry
from app.services import memory

router = APIRouter(prefix="/history", tags=["history"])


def _backend(header_value: str | None) -> str:
    return memory.resolve_backend(header_value)


@router.get("")
def get_history(x_memory_backend: str | None = Header(default=None)) -> list[dict]:
    return memory.list_history(_backend(x_memory_backend))


@router.post("")
def add_to_history(
    entry: HistoryEntry,
    x_memory_backend: str | None = Header(default=None),
) -> dict:
    return memory.add_history(_backend(x_memory_backend), entry.model_dump())


@router.delete("")
def clear_history(x_memory_backend: str | None = Header(default=None)) -> dict:
    return memory.clear_history(_backend(x_memory_backend))


@router.get("/search")
def search_history(
    q: str = Query(..., min_length=1),
    limit: int = Query(default=6, ge=1, le=20),
    x_memory_backend: str | None = Header(default=None),
) -> dict:
    backend = _backend(x_memory_backend)
    if backend != "supermemory":
        return {"backend": backend, "supported": False, "results": []}
    return {"backend": backend, "supported": True, "results": memory.search_history(q, limit=limit)}


@router.get("/backend")
def backend_status() -> dict:
    return memory.backend_status()
