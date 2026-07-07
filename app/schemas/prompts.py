from __future__ import annotations

import time
import uuid
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import PromptMode


class _Base(BaseModel):
    model_config = ConfigDict(protected_namespaces=())


class AnalyzeRequest(_Base):
    prompt: str = Field(..., min_length=1, max_length=50_000)
    mode: PromptMode = "TECHNICAL"
    model_id: str = "claude-3-5"


class ScoreRequest(_Base):
    prompt: str
    mode: PromptMode = "TECHNICAL"


class TokenRequest(_Base):
    prompt: str
    model_id: str = "claude-3-5"
    output_multiplier: float = 1.8


class OptimizeRequest(_Base):
    prompt: str
    mode: PromptMode = "TECHNICAL"


class WizardGenerateRequest(_Base):
    answers: dict
    mode: PromptMode = "TECHNICAL"


class CompareModelsRequest(_Base):
    prompt: str
    mode: PromptMode = "TECHNICAL"


class HistoryEntry(_Base):
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:8])
    ts: int = Field(default_factory=lambda: int(time.time() * 1000))
    prompt_preview: str
    mode: str = "TECHNICAL"
    model_id: str = "claude-3-5"
    score: Optional[int] = None
