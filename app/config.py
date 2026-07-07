from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class AppConfig(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        frozen=True,
        extra="ignore",
    )

    app_name: str = "PromptForge API"
    app_version: str = "0.9.4-mvp"

    database_url: str = Field(
        default="postgresql://promptstudio:promptstudio@localhost:5432/promptstudio",
    )

    allow_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])
    allow_methods: list[str] = Field(default_factory=lambda: ["GET", "POST", "DELETE"])
    allow_headers: list[str] = Field(default_factory=lambda: ["*"])

    fref_score_enabled: bool = True

    history_max: int = 50


@lru_cache(maxsize=1)
def get_config() -> AppConfig:
    return AppConfig()
