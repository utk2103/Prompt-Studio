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
    # "*" already covers custom headers, but browsers still require them listed
    # for non-simple requests when credentials are involved. Explicit is safer.
    allow_headers: list[str] = Field(default_factory=lambda: ["*", "X-Memory-Backend"])

    fref_score_enabled: bool = True

    history_max: int = 50

    # Memory backend: "local" (in-process deque) or "supermemory" (v3 REST).
    # Frontend can override per-request via the X-Memory-Backend header.
    memory_backend: str = Field(default="local")
    supermemory_api_key: str = Field(default="")
    supermemory_container_tag: str = Field(default="prompt-studio")
    supermemory_base_url: str = Field(default="https://api.supermemory.ai/v3")
    supermemory_user_id: str = Field(default="default")


@lru_cache(maxsize=1)
def get_config() -> AppConfig:
    return AppConfig()
