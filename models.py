from __future__ import annotations

import uuid
import time
from typing import Optional

from sqlalchemy import BigInteger, Column, Float, Integer, String, Text, JSON, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector

from database import Base

# Embedding dimension — 1536 matches OpenAI text-embedding-ada-002 / text-embedding-3-small.
# Change to 384 for sentence-transformers/all-MiniLM-L6-v2 (lighter, local).
EMBEDDING_DIM = 1536


class PromptRecord(Base):
    """Stores every analyzed prompt together with its vector embedding."""

    __tablename__ = "prompts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    text = Column(Text, nullable=False)
    mode = Column(String(20), nullable=False, default="TECHNICAL")
    model_id = Column(String(50), nullable=False, default="claude-3-5")

    # 7-dimension score snapshot
    score_overall = Column(Integer, nullable=True)
    score_clarity = Column(Integer, nullable=True)
    score_specificity = Column(Integer, nullable=True)
    score_context = Column(Integer, nullable=True)
    score_format = Column(Integer, nullable=True)
    score_mode_alignment = Column(Integer, nullable=True)
    score_token_efficiency = Column(Integer, nullable=True)
    score_constraints = Column(Integer, nullable=True)
    grade = Column(String(2), nullable=True)

    # Full issues + recommendations as JSON blobs
    issues = Column(JSON, nullable=True)
    recommendations = Column(JSON, nullable=True)

    # pgvector column — NULL until embedding is generated
    embedding = Column(Vector(EMBEDDING_DIM), nullable=True)

    created_at = Column(BigInteger, nullable=False, default=lambda: int(time.time() * 1000))


class HistoryRecord(Base):
    """Lightweight session history entry — mirrors the in-memory HistoryEntry schema."""

    __tablename__ = "history"

    id = Column(String(8), primary_key=True, default=lambda: uuid.uuid4().hex[:8])
    ts = Column(BigInteger, nullable=False, default=lambda: int(time.time() * 1000))
    prompt_preview = Column(String(200), nullable=False)
    mode = Column(String(20), nullable=False, default="TECHNICAL")
    model_id = Column(String(50), nullable=False, default="claude-3-5")
    score = Column(Integer, nullable=True)

    # Optional FK to the full prompt record
    prompt_id = Column(UUID(as_uuid=True), ForeignKey("prompts.id", ondelete="SET NULL"), nullable=True)
