from collections.abc import Sequence
from functools import lru_cache
from typing import Protocol

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class SettingsProvider(Protocol):
    async def database_url(self) -> str: ...
    async def access_token_ttl_seconds(self) -> int: ...
    async def refresh_token_ttl_seconds(self) -> int: ...
    async def cors_origins(self) -> Sequence[str]: ...
    async def google_stub_enabled(self) -> bool: ...
    async def rate_limit_per_window(self) -> int: ...
    async def rate_limit_window_seconds(self) -> int: ...
    async def log_level(self) -> str: ...
    async def env(self) -> str: ...
    async def refresh_cookie_name(self) -> str: ...
    async def refresh_cookie_domain(self) -> str | None: ...


class EnvSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url_value: str = Field(
        default="postgresql+asyncpg://campfire:campfire@localhost:5432/campfire",
        validation_alias="DATABASE_URL",
    )
    access_token_ttl_seconds_value: int = Field(
        default=900, validation_alias="ACCESS_TOKEN_TTL_SECONDS"
    )
    refresh_token_ttl_seconds_value: int = Field(
        default=1_209_600, validation_alias="REFRESH_TOKEN_TTL_SECONDS"
    )
    cors_origins_value: str = Field(
        default="http://localhost:5173", validation_alias="CORS_ORIGINS"
    )
    google_stub_enabled_value: bool = Field(default=True, validation_alias="GOOGLE_STUB_ENABLED")
    rate_limit_per_window_value: int = Field(default=10, validation_alias="RATE_LIMIT_PER_WINDOW")
    rate_limit_window_seconds_value: int = Field(
        default=300, validation_alias="RATE_LIMIT_WINDOW_SECONDS"
    )
    log_level_value: str = Field(default="INFO", validation_alias="LOG_LEVEL")
    env_value: str = Field(default="dev", validation_alias="ENV")
    refresh_cookie_name_value: str = Field(
        default="campfire_refresh", validation_alias="REFRESH_COOKIE_NAME"
    )
    refresh_cookie_domain_value: str | None = Field(
        default=None, validation_alias="REFRESH_COOKIE_DOMAIN"
    )

    @field_validator("refresh_cookie_domain_value", mode="before")
    @classmethod
    def empty_domain_is_none(cls, value: object) -> object:
        return None if value == "" else value

    def parsed_cors_origins(self) -> list[str]:
        origins = [
            origin.strip() for origin in self.cors_origins_value.split(",") if origin.strip()
        ]
        if "*" in origins:
            raise ValueError("CORS_ORIGINS cannot include * while credentials are enabled")
        if self.env_value == "prod" and not origins:
            return []
        return origins


class EnvSettingsProvider:
    def __init__(self, settings: EnvSettings | None = None) -> None:
        self._settings = settings or EnvSettings()

    async def database_url(self) -> str:
        return self._settings.database_url_value

    async def access_token_ttl_seconds(self) -> int:
        return self._settings.access_token_ttl_seconds_value

    async def refresh_token_ttl_seconds(self) -> int:
        return self._settings.refresh_token_ttl_seconds_value

    async def cors_origins(self) -> Sequence[str]:
        return self._settings.parsed_cors_origins()

    async def google_stub_enabled(self) -> bool:
        return self._settings.google_stub_enabled_value

    async def rate_limit_per_window(self) -> int:
        return self._settings.rate_limit_per_window_value

    async def rate_limit_window_seconds(self) -> int:
        return self._settings.rate_limit_window_seconds_value

    async def log_level(self) -> str:
        return self._settings.log_level_value

    async def env(self) -> str:
        return self._settings.env_value

    async def refresh_cookie_name(self) -> str:
        return self._settings.refresh_cookie_name_value

    async def refresh_cookie_domain(self) -> str | None:
        return self._settings.refresh_cookie_domain_value


@lru_cache(maxsize=1)
def get_settings_provider() -> EnvSettingsProvider:
    return EnvSettingsProvider()
