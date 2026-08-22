"""History / memory layer with pluggable backends.

Two backends behind one interface:
  - `local`       — in-process deque (default; matches prior behavior).
  - `supermemory` — Supermemory v3 REST API. Adds semantic recall via /search.

Backend selection order per request:
  1. `X-Memory-Backend` header (frontend toggle)
  2. `MEMORY_BACKEND` env / config
  3. `local` fallback

Supermemory is silently unavailable when SUPERMEMORY_API_KEY is unset; callers
that ask for it fall back to local so the app never breaks on a missing key.

Ported from the JS reference at
../supermemory-hackathon/src/lib/supermemory/{client,memory}.ts.
"""
from __future__ import annotations

import time
import uuid
from collections import deque
from functools import lru_cache
from typing import Any

from supermemory import Supermemory, SupermemoryError

from app.config import get_config

_LOCAL: deque = deque(maxlen=get_config().history_max)


@lru_cache(maxsize=1)
def _sm_client() -> Supermemory | None:
    key = get_config().supermemory_api_key
    if not key:
        return None
    return Supermemory(api_key=key)


# ────────────────────────── selection ──────────────────────────


def resolve_backend(header_value: str | None) -> str:
    """Pick backend for this call. Falls back to local if supermemory chosen
    without a key."""
    cfg = get_config()
    chosen = (header_value or cfg.memory_backend or "local").strip().lower()
    if chosen == "supermemory" and not cfg.supermemory_api_key:
        return "local"
    return chosen if chosen in {"local", "supermemory"} else "local"


def backend_status() -> dict:
    cfg = get_config()
    return {
        "default": cfg.memory_backend,
        "supermemory_available": bool(cfg.supermemory_api_key),
        "container_tag": cfg.supermemory_container_tag,
    }


# ────────────────────────── local backend ──────────────────────────


def _local_list() -> list[dict]:
    return list(_LOCAL)


def _local_add(item: dict) -> dict:
    item.setdefault("id", uuid.uuid4().hex[:8])
    item.setdefault("ts", int(time.time() * 1000))
    _LOCAL.appendleft(item)
    return item


def _local_clear() -> int:
    n = len(_LOCAL)
    _LOCAL.clear()
    return n


# ────────────────────────── supermemory backend ──────────────────────────


def _entry_to_content(item: dict) -> str:
    """Flatten a history entry into a single string Supermemory can index."""
    parts = [
        f"Prompt: {item.get('prompt') or item.get('prompt_preview') or ''}",
        f"Mode: {item.get('mode', '')}",
        f"Model: {item.get('model_id') or item.get('model', '')}",
    ]
    if item.get("score") is not None:
        parts.append(f"Score: {item['score']}")
    return "\n".join(p for p in parts if p.strip().rstrip(":"))


def _sm_add(item: dict) -> dict:
    cfg = get_config()
    item.setdefault("id", uuid.uuid4().hex[:8])
    item.setdefault("ts", int(time.time() * 1000))
    metadata: dict[str, Any] = {
        "userId": cfg.supermemory_user_id,
        "kind": "prompt_history",
        "mode": item.get("mode", ""),
        "model_id": item.get("model_id") or item.get("model", ""),
    }
    if item.get("score") is not None:
        metadata["score"] = item["score"]
    client = _sm_client()
    if client is not None:
        try:
            r = client.documents.add(
                content=_entry_to_content(item),
                container_tags=[cfg.supermemory_container_tag],
                custom_id=f"prompt:{item['id']}",
                metadata=metadata,
            )
            remote_id = getattr(r, "id", None) or getattr(r, "document_id", None)
            if remote_id:
                item["remote_id"] = remote_id
        except SupermemoryError:
            # Best-effort — never surface memory errors to callers.
            pass
    # Also mirror to local so /history GET stays fast without a fetch.
    _LOCAL.appendleft(item)
    return item


def _sm_list() -> list[dict]:
    """Supermemory has no chronological list endpoint we rely on; return the
    local mirror. Semantic queries go through _sm_search()."""
    return list(_LOCAL)


def _sm_search(query: str, limit: int = 6) -> list[dict]:
    cfg = get_config()
    client = _sm_client()
    if not query.strip() or client is None:
        return []
    try:
        # lean: single-tenant, container_tag scopes fine.
        # Multi-tenant → add `filters={"AND":[{"key":"userId","value":cfg.supermemory_user_id,"filterType":"metadata"}]}`.
        resp = client.search.documents(
            q=query,
            container_tags=[cfg.supermemory_container_tag],
            limit=limit,
        )
    except SupermemoryError:
        return []
    out: list[dict] = []
    for row in getattr(resp, "results", []) or []:
        chunks = getattr(row, "chunks", None) or []
        content = "\n".join(
            (getattr(c, "content", "") or "") for c in chunks
        ).strip()
        if not content:
            content = getattr(row, "title", "") or ""
        rid = getattr(row, "document_id", None) or getattr(row, "id", None)
        if content:
            out.append({
                "id": rid,
                "content": content,
                "score": getattr(row, "score", None),
                "metadata": getattr(row, "metadata", None) or {},
            })
    return out


def _sm_clear() -> int:
    # No bulk-delete against container yet in our scope; clear local mirror.
    # Supermemory retains persisted docs — deliberately, so cross-session
    # insights survive a UI "clear".
    n = len(_LOCAL)
    _LOCAL.clear()
    return n


# ────────────────────────── public API ──────────────────────────


def list_history(backend: str) -> list[dict]:
    return _sm_list() if backend == "supermemory" else _local_list()


def add_history(backend: str, item: dict) -> dict:
    return _sm_add(item) if backend == "supermemory" else _local_add(item)


def clear_history(backend: str) -> dict:
    n = _sm_clear() if backend == "supermemory" else _local_clear()
    return {"cleared": True, "count": n, "backend": backend}


def search_history(query: str, limit: int = 6) -> list[dict]:
    """Semantic recall. Only supermemory backend supports this; returns [] for
    local (no vector index)."""
    return _sm_search(query, limit=limit)
