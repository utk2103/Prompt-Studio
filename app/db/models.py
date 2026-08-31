from __future__ import annotations

import time
import uuid

from pgvector.sqlalchemy import Vector
from sqlalchemy import JSON, BigInteger, Column, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base

EMBEDDING_DIM = 1536


class ModelCatalog(Base):
    """Live model metadata (pricing / context window) refreshed from the
    LiteLLM price map. Seeded from ``models_registry.MODELS``; the seed dict
    stays the fallback so the app never hard-depends on a successful refresh."""

    __tablename__ = "model_catalog"

    id = Column(String(50), primary_key=True)  # our stable public slug
    name = Column(String(120), nullable=False)
    provider = Column(String(60), nullable=False)
    context = Column(Integer, nullable=False)
    cost_in = Column(Float, nullable=False)  # USD per 1M input tokens
    cost_out = Column(Float, nullable=False)  # USD per 1M output tokens
    format = Column(String(60), nullable=False)
    litellm_key = Column(String(120), nullable=True)  # key used to look this up in the source
    updated_at = Column(BigInteger, nullable=False, default=lambda: int(time.time() * 1000))


class PromptRecord(Base):
    __tablename__ = "prompts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    text = Column(Text, nullable=False)
    mode = Column(String(20), nullable=False, default="TECHNICAL")
    model_id = Column(String(50), nullable=False, default="claude-3-5")

    score_overall = Column(Integer, nullable=True)
    score_clarity = Column(Integer, nullable=True)
    score_specificity = Column(Integer, nullable=True)
    score_context = Column(Integer, nullable=True)
    score_format = Column(Integer, nullable=True)
    score_mode_alignment = Column(Integer, nullable=True)
    score_token_efficiency = Column(Integer, nullable=True)
    score_constraints = Column(Integer, nullable=True)
    grade = Column(String(2), nullable=True)

    issues = Column(JSON, nullable=True)
    recommendations = Column(JSON, nullable=True)

    embedding = Column(Vector(EMBEDDING_DIM), nullable=True)

    created_at = Column(BigInteger, nullable=False, default=lambda: int(time.time() * 1000))


class HistoryRecord(Base):
    __tablename__ = "history"

    id = Column(String(8), primary_key=True, default=lambda: uuid.uuid4().hex[:8])
    ts = Column(BigInteger, nullable=False, default=lambda: int(time.time() * 1000))
    prompt_preview = Column(String(200), nullable=False)
    mode = Column(String(20), nullable=False, default="TECHNICAL")
    model_id = Column(String(50), nullable=False, default="claude-3-5")
    score = Column(Integer, nullable=True)

    prompt_id = Column(UUID(as_uuid=True), ForeignKey("prompts.id", ondelete="SET NULL"), nullable=True)
