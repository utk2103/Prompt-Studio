"""Live model catalog: refresh pricing / context windows from the LiteLLM
price map and persist them in Postgres.

The seed dict in ``models_registry.MODELS`` is the source of truth for the
library and the permanent fallback. This module (server-only, needs httpx +
SQLAlchemy) keeps the DB catalog and the in-process registry overlay in sync so
API cost math reflects live pricing, while never letting a failed refresh or a
missing DB break the app.
"""
from __future__ import annotations

import time

import httpx
from sqlalchemy.orm import Session

from app.config import get_config
from app.db.models import ModelCatalog
from app.services import models_registry as registry


def fetch_litellm() -> dict:
    """GET the LiteLLM price map. Raises httpx.HTTPError on network/HTTP failure."""
    cfg = get_config()
    resp = httpx.get(cfg.litellm_price_url, timeout=cfg.litellm_fetch_timeout)
    resp.raise_for_status()
    return resp.json()


def _convert(slug: str, seed: dict, source: dict) -> dict | None:
    """Map one LiteLLM entry onto our row shape. Returns None if the source
    entry lacks usable pricing (so we keep the seed rather than write nulls)."""
    key = registry.LITELLM_KEYS.get(slug)
    entry = source.get(key) if key else None
    if not entry:
        return None
    cin = entry.get("input_cost_per_token")
    cout = entry.get("output_cost_per_token")
    ctx = entry.get("max_input_tokens") or entry.get("max_tokens")
    if cin is None or cout is None or not ctx:
        return None
    return {
        "id": slug,
        "name": seed["name"],
        "provider": entry.get("litellm_provider") or seed["provider"],
        "context": int(ctx),
        "cost_in": round(float(cin) * 1_000_000, 6),
        "cost_out": round(float(cout) * 1_000_000, 6),
        "format": seed["format"],
        "litellm_key": key,
    }


def _upsert(db: Session, row: dict) -> None:
    obj = db.get(ModelCatalog, row["id"])
    if obj is None:
        obj = ModelCatalog(**row, updated_at=int(time.time() * 1000))
        db.add(obj)
        return
    for k, v in row.items():
        setattr(obj, k, v)
    obj.updated_at = int(time.time() * 1000)


def refresh(db: Session) -> dict:
    """Fetch the source and upsert our known slugs. Returns a diff summary.
    On fetch failure raises; the caller maps that to a 502 and the DB/seed are
    left untouched."""
    source = fetch_litellm()
    updated: list[str] = []
    price_changes: dict[str, dict] = {}
    missing: list[str] = []

    for slug, seed in registry.MODELS.items():
        row = _convert(slug, seed, source)
        if row is None:
            missing.append(slug)
            continue
        before = db.get(ModelCatalog, slug)
        if before is not None and (before.cost_in != row["cost_in"] or before.cost_out != row["cost_out"]):
            price_changes[slug] = {
                "cost_in": [before.cost_in, row["cost_in"]],
                "cost_out": [before.cost_out, row["cost_out"]],
            }
        _upsert(db, row)
        updated.append(slug)

    db.commit()
    load_overlay(db)
    return {
        "updated": updated,
        "missing_from_source": missing,
        "price_changes": price_changes,
        "source": get_config().litellm_price_url,
    }


def _row_to_model(obj: ModelCatalog) -> dict:
    return {
        "name": obj.name,
        "provider": obj.provider,
        "context": obj.context,
        "cost_in": obj.cost_in,
        "cost_out": obj.cost_out,
        "format": obj.format,
    }


def seed_if_empty(db: Session) -> None:
    """Populate the catalog from the seed dict on first boot so the table is
    never empty (idempotent)."""
    if db.query(ModelCatalog).count() > 0:
        return
    now = int(time.time() * 1000)
    for slug, seed in registry.MODELS.items():
        db.add(
            ModelCatalog(
                id=slug,
                litellm_key=registry.LITELLM_KEYS.get(slug),
                updated_at=now,
                **{k: seed[k] for k in ("name", "provider", "context", "cost_in", "cost_out", "format")},
            )
        )
    db.commit()


def load_overlay(db: Session) -> None:
    """Load the DB catalog into the registry overlay for this worker."""
    rows = {obj.id: _row_to_model(obj) for obj in db.query(ModelCatalog).all()}
    registry.apply_overlay(rows)


def list_catalog(db: Session) -> list[dict]:
    """All models as ``[{id, ...}]``, DB first, seed as fallback when empty."""
    rows = db.query(ModelCatalog).all()
    if not rows:
        return [{"id": k, **v} for k, v in registry.MODELS.items()]
    return [{"id": obj.id, **_row_to_model(obj)} for obj in rows]
