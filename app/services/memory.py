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
from typing import Any

import httpx

from app.config import get_config

_LOCAL: deque = deque(maxlen=get_config().history_max)
_TIMEOUT = httpx.Timeout(10.0)


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


def _sm_headers() -> dict[str, str]:
    return {
        "authorization": f"Bearer {get_config().supermemory_api_key}",
        "content-type": "application/json",
    }


def _sm_url(path: str) -> str:
    base = get_config().supermemory_base_url.rstrip("/")
    return f"{base}{path}"


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
    body: dict[str, Any] = {
        "content": _entry_to_content(item),
        "containerTag": cfg.supermemory_container_tag,
        "customId": f"prompt:{item['id']}",
        "metadata": metadata,
    }
    try:
        r = httpx.post(_sm_url("/documents"), json=body, headers=_sm_headers(), timeout=_TIMEOUT)
        r.raise_for_status()
        data = r.json()
        if isinstance(data, dict) and data.get("id"):
            item["remote_id"] = data["id"]
    except (httpx.HTTPError, ValueError):
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
    if not query.strip() or not cfg.supermemory_api_key:
        return []
    body: dict[str, Any] = {
        "q": query,
        "containerTag": cfg.supermemory_container_tag,
        "limit": limit,
        "filters": {"AND": [{"key": "userId", "value": cfg.supermemory_user_id, "negate": False}]},
    }
    try:
        r = httpx.post(_sm_url("/search"), json=body, headers=_sm_headers(), timeout=_TIMEOUT)
        r.raise_for_status()
        raw = r.json().get("results", [])
    except (httpx.HTTPError, ValueError):
        return []
    out: list[dict] = []
    for row in raw:
        chunks = row.get("chunks") or []
        content = "\n".join(c.get("content", "") for c in chunks if c.get("content")).strip()
        if not content:
            content = row.get("title", "") or ""
        out.append({
            "id": row.get("documentId") or row.get("id"),
            "content": content.strip(),
            "score": row.get("score"),
            "metadata": row.get("metadata") or {},
        })
    return [r for r in out if r["content"]]


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
