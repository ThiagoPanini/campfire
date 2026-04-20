"""Application settings. Loaded once and injected via DI."""

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="CAMPFIRE_",
        case_sensitive=False,
        extra="ignore",
    )

    env: Literal["local", "test", "prod"] = "local"
    api_prefix: str = "/api"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])
    auth_mode: Literal["placeholder", "oauth"] = "placeholder"


@lru_cache
def get_settings() -> Settings:
    return Settings()
