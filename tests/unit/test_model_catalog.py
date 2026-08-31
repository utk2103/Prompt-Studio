from __future__ import annotations

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.models import ModelCatalog
from app.services import model_catalog
from app.services import models_registry as registry

# Fabricated LiteLLM price map (costs are per-token, as in the real source).
SOURCE = {
    "gpt-4o": {
        "input_cost_per_token": 2.5e-6,
        "output_cost_per_token": 1.0e-5,
        "max_input_tokens": 128_000,
        "litellm_provider": "openai",
    },
    "claude-3-5-sonnet-20241022": {
        "input_cost_per_token": 3.0e-6,
        "output_cost_per_token": 1.5e-5,
        "max_input_tokens": 200_000,
        "litellm_provider": "anthropic",
    },
    # A malformed entry: present but no usable pricing -> must be treated as missing.
    "gpt-3.5-turbo": {"litellm_provider": "openai"},
}


@pytest.fixture
def db():
    engine = create_engine("sqlite://")
    ModelCatalog.__table__.create(engine)
    session = sessionmaker(bind=engine)()
    try:
        yield session
    finally:
        session.close()
        registry.clear_overlay()  # don't leak overlay into other tests


def test_convert_units_and_shape():
    row = model_catalog._convert("gpt-4o", registry.MODELS["gpt-4o"], SOURCE)
    assert row["cost_in"] == 2.5  # 2.5e-6 * 1e6
    assert row["cost_out"] == 10.0
    assert row["context"] == 128_000
    assert row["litellm_key"] == "gpt-4o"
    assert row["name"] == registry.MODELS["gpt-4o"]["name"]  # name kept from seed


def test_convert_missing_key_returns_none():
    # deepseek's litellm_key is absent from SOURCE
    assert model_catalog._convert("deepseek", registry.MODELS["deepseek"], SOURCE) is None


def test_convert_entry_without_pricing_returns_none():
    # gpt-35 maps to gpt-3.5-turbo which is present but has no cost fields
    assert model_catalog._convert("gpt-35", registry.MODELS["gpt-35"], SOURCE) is None


def test_refresh_diff_and_persistence(db, monkeypatch):
    monkeypatch.setattr(model_catalog, "fetch_litellm", lambda: SOURCE)
    model_catalog.seed_if_empty(db)  # so before-values exist for price_changes

    result = model_catalog.refresh(db)

    assert set(result["updated"]) == {"gpt-4o", "claude-3-5"}
    # slugs whose litellm_key is absent (or unpriced) in SOURCE are reported, not nulled
    assert "deepseek" in result["missing_from_source"]
    assert "gpt-35" in result["missing_from_source"]
    # gpt-4o seed cost_in was 5.0, source says 2.5 -> recorded as a change
    assert result["price_changes"]["gpt-4o"]["cost_in"] == [5.0, 2.5]

    row = db.get(ModelCatalog, "gpt-4o")
    assert row.cost_in == 2.5 and row.cost_out == 10.0


def test_refresh_loads_overlay_for_cost_math(db, monkeypatch):
    monkeypatch.setattr(model_catalog, "fetch_litellm", lambda: SOURCE)
    model_catalog.seed_if_empty(db)
    model_catalog.refresh(db)

    # registry (used by tokens/cost math) now reflects the refreshed price
    assert registry.get_model_or_default("gpt-4o")["cost_in"] == 2.5
    # untouched slug still serves its seed value
    assert registry.get_model_or_default("deepseek")["cost_in"] == registry.MODELS["deepseek"]["cost_in"]


def test_list_catalog_empty_falls_back_to_seed(db):
    out = model_catalog.list_catalog(db)
    assert any(m["id"] == "claude-3-5" for m in out)
    assert len(out) == len(registry.MODELS)
