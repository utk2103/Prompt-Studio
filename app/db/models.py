from __future__ import annotations

import time
import uuid

from pgvector.sqlalchemy import Vector
from sqlalchemy import JSON, BigInteger, Column, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base

EMBEDDING_DIM = 1536


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
