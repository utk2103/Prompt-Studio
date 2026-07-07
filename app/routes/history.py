from __future__ import annotations

from collections import deque

from fastapi import APIRouter

from app.config import get_config
from app.schemas.prompts import HistoryEntry

router = APIRouter(prefix="/history", tags=["history"])

_history: deque = deque(maxlen=get_config().history_max)


@router.get("")
def get_history() -> list[dict]:
    return list(_history)


@router.post("")
def add_to_history(entry: HistoryEntry) -> dict:
    item = entry.model_dump()
    _history.appendleft(item)
    return item


@router.delete("")
def clear_history() -> dict:
    _history.clear()
    return {"cleared": True}
