from collections.abc import Sequence
from functools import lru_cache
from ipaddress import IPv4Network, IPv6Network, ip_network
from typing import Protocol

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def normalize_database_url(database_url: str) -> str:
    if database_url.startswith("postgresql://"):
        return database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if database_url.startswith("postgres://"):
        return database_url.replace("postgres://", "postgresql+asyncpg://", 1)
    return database_url


class SettingsProvider(Protocol):
    async def database_url(self) -> str: ...
    async def access_token_ttl_seconds(self) -> int: ...
    async def refresh_token_ttl_seconds(self) -> int: ...
    async def cors_origins(self) -> Sequence[str]: ...
    def cors_origins_sync(self) -> Sequence[str]: ...
    async def trusted_proxies(self) -> Sequence[IPv4Network | IPv6Network]: ...
    def trusted_proxies_sync(self) -> Sequence[IPv4Network | IPv6Network]: ...
    async def google_stub_enabled(self) -> bool: ...
    async def google_oauth_enabled(self) -> bool: ...
    async def google_oauth_client_id(self) -> str | None: ...
    async def google_oauth_client_secret(self) -> str | None: ...
    async def google_oauth_redirect_uri(self) -> str | None: ...
    async def google_enabled(self) -> bool: ...
    async def web_base_url(self) -> str: ...
    async def oauth_flow_hmac_key(self) -> str | None: ...
    async def oauth_flow_ttl_seconds(self) -> int: ...
    async def email_confirmation_required(self) -> bool: ...
    async def email_confirmation_hmac_key(self) -> str | None: ...
    async def email_confirmation_ttl_seconds(self) -> int: ...
    async def email_confirmation_max_attempts(self) -> int: ...
    async def email_confirmation_resend_cooldown_seconds(self) -> int: ...
    async def email_confirmation_resend_hourly_cap(self) -> int: ...
    async def mail_backend(self) -> str: ...
    async def mail_from(self) -> str | None: ...
    async def mail_outbox_dir(self) -> str: ...
    async def mail_http_url(self) -> str | None: ...
    async def mail_http_api_key(self) -> str | None: ...
    async def rate_limit_per_window(self) -> int: ...
    async def rate_limit_window_seconds(self) -> int: ...
    async def log_level(self) -> str: ...
    async def env(self) -> str: ...
    async def refresh_cookie_name(self) -> str: ...
    async def refresh_cookie_domain(self) -> str | None: ...
    async def refresh_cookie_secure(self) -> bool: ...
    async def refresh_cookie_samesite(self) -> str: ...
    async def deezer_base_url(self) -> str: ...
    async def search_cache_ttl_seconds(self) -> int: ...
    async def search_cache_max_entries(self) -> int: ...
    async def search_rate_limit_per_window(self) -> int: ...
    async def search_rate_limit_window_seconds(self) -> int: ...


class EnvSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore", populate_by_name=True
    )

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
        default="http://localhost:5173,http://localhost:5174", validation_alias="CORS_ORIGINS"
    )
    trusted_proxies_value: str = Field(default="", validation_alias="TRUSTED_PROXIES")
    google_stub_enabled_value: bool = Field(default=False, validation_alias="GOOGLE_STUB_ENABLED")
    google_oauth_enabled_value: bool = Field(default=False, validation_alias="GOOGLE_OAUTH_ENABLED")
    google_oauth_client_id_value: str | None = Field(
        default=None, validation_alias="GOOGLE_OAUTH_CLIENT_ID"
    )
    google_oauth_client_secret_value: str | None = Field(
        default=None, validation_alias="GOOGLE_OAUTH_CLIENT_SECRET"
    )
    google_oauth_redirect_uri_value: str | None = Field(
        default=None, validation_alias="GOOGLE_OAUTH_REDIRECT_URI"
    )
    web_base_url_value: str = Field(
        default="http://localhost:5173", validation_alias="WEB_BASE_URL"
    )
    oauth_flow_hmac_key_value: str | None = Field(
        default=None, validation_alias="OAUTH_FLOW_HMAC_KEY"
    )
    oauth_flow_ttl_seconds_value: int = Field(
        default=600, validation_alias="OAUTH_FLOW_TTL_SECONDS"
    )
    email_confirmation_required_value: bool = Field(
        default=True,
        validation_alias="EMAIL_CONFIRMATION_REQUIRED",
        description=(
            "Incident-only rollback escape hatch. false violates steady-state email "
            "confirmation requirements and must be time-bounded."
        ),
    )
    email_confirmation_hmac_key_value: str | None = Field(
        default=None, validation_alias="EMAIL_CONFIRMATION_HMAC_KEY"
    )
    email_confirmation_ttl_seconds_value: int = Field(
        default=900, validation_alias="EMAIL_CONFIRMATION_TTL_SECONDS"
    )
    email_confirmation_max_attempts_value: int = Field(
        default=5, validation_alias="EMAIL_CONFIRMATION_MAX_ATTEMPTS"
    )
    email_confirmation_resend_cooldown_seconds_value: int = Field(
        default=60, validation_alias="EMAIL_CONFIRMATION_RESEND_COOLDOWN_SECONDS"
    )
    email_confirmation_resend_hourly_cap_value: int = Field(
        default=3, validation_alias="EMAIL_CONFIRMATION_RESEND_HOURLY_CAP"
    )
    mail_backend_value: str = Field(default="console", validation_alias="MAIL_BACKEND")
    mail_from_value: str | None = Field(default=None, validation_alias="MAIL_FROM")
    mail_outbox_dir_value: str = Field(default="tmp/mail", validation_alias="MAIL_OUTBOX_DIR")
    mail_http_url_value: str | None = Field(default=None, validation_alias="MAIL_HTTP_URL")
    mail_http_api_key_value: str | None = Field(default=None, validation_alias="MAIL_HTTP_API_KEY")
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
    refresh_cookie_secure_value: bool | None = Field(
        default=None, validation_alias="REFRESH_COOKIE_SECURE"
    )
    refresh_cookie_samesite_value: str = Field(
        default="lax", validation_alias="REFRESH_COOKIE_SAMESITE"
    )
    deezer_base_url_value: str = Field(
        default="https://api.deezer.com", validation_alias="DEEZER_BASE_URL"
    )
    search_cache_ttl_seconds_value: int = Field(
        default=60, validation_alias="SEARCH_CACHE_TTL_SECONDS"
    )
    search_cache_max_entries_value: int = Field(
        default=1024, validation_alias="SEARCH_CACHE_MAX_ENTRIES"
    )
    search_rate_limit_per_window_value: int = Field(
        default=30, validation_alias="SEARCH_RATE_LIMIT_PER_WINDOW"
    )
    search_rate_limit_window_seconds_value: int = Field(
        default=60, validation_alias="SEARCH_RATE_LIMIT_WINDOW_SECONDS"
    )

    @field_validator("refresh_cookie_domain_value", mode="before")
    @classmethod
    def empty_domain_is_none(cls, value: object) -> object:
        return None if value == "" else value

    @field_validator(
        "google_oauth_client_id_value",
        "google_oauth_client_secret_value",
        "google_oauth_redirect_uri_value",
        "oauth_flow_hmac_key_value",
        "email_confirmation_hmac_key_value",
        "mail_from_value",
        "mail_http_url_value",
        "mail_http_api_key_value",
        mode="before",
    )
    @classmethod
    def empty_string_is_none(cls, value: object) -> object:
        return None if value == "" else value

    @field_validator("refresh_cookie_samesite_value", mode="before")
    @classmethod
    def normalize_cookie_samesite(cls, value: object) -> object:
        if not isinstance(value, str):
            return value
        normalized = value.strip().lower()
        if normalized not in {"lax", "strict", "none"}:
            raise ValueError("REFRESH_COOKIE_SAMESITE must be lax, strict, or none")
        return normalized

    def parsed_cors_origins(self) -> list[str]:
        origins = [
            origin.strip() for origin in self.cors_origins_value.split(",") if origin.strip()
        ]
        if "*" in origins:
            raise ValueError("CORS_ORIGINS cannot include * while credentials are enabled")
        if self.env_value == "prod" and not origins:
            return []
        return origins

    @field_validator("trusted_proxies_value", mode="before")
    @classmethod
    def parse_trusted_proxies(cls, value: object) -> str:
        if value in (None, ""):
            return ""
        if isinstance(value, str):
            raw_entries = [entry.strip() for entry in value.split(",") if entry.strip()]
        elif isinstance(value, Sequence):
            raw_entries = list(value)
        else:
            raise ValueError("TRUSTED_PROXIES must be comma-separated CIDR blocks or IPs")
        try:
            networks = tuple(ip_network(str(entry), strict=False) for entry in raw_entries)
        except ValueError as exc:
            raise ValueError("TRUSTED_PROXIES must contain valid CIDR blocks or IPs") from exc
        return ",".join(str(network) for network in networks)

    def parsed_trusted_proxies(self) -> tuple[IPv4Network | IPv6Network, ...]:
        if not self.trusted_proxies_value:
            return ()
        return tuple(
            ip_network(entry, strict=False) for entry in self.trusted_proxies_value.split(",")
        )

    def resolved_refresh_cookie_secure(self) -> bool:
        if self.refresh_cookie_secure_value is not None:
            return self.refresh_cookie_secure_value
        return self.env_value == "prod"


class EnvSettingsProvider:
    def __init__(self, settings: EnvSettings | None = None) -> None:
        self._settings = settings or EnvSettings()

    async def database_url(self) -> str:
        return normalize_database_url(self._settings.database_url_value)

    async def access_token_ttl_seconds(self) -> int:
        return self._settings.access_token_ttl_seconds_value

    async def refresh_token_ttl_seconds(self) -> int:
        return self._settings.refresh_token_ttl_seconds_value

    async def cors_origins(self) -> Sequence[str]:
        return self.cors_origins_sync()

    def cors_origins_sync(self) -> Sequence[str]:
        return self._settings.parsed_cors_origins()

    async def trusted_proxies(self) -> Sequence[IPv4Network | IPv6Network]:
        return self.trusted_proxies_sync()

    def trusted_proxies_sync(self) -> Sequence[IPv4Network | IPv6Network]:
        return self._settings.parsed_trusted_proxies()

    async def google_stub_enabled(self) -> bool:
        return self._settings.google_stub_enabled_value

    async def google_oauth_enabled(self) -> bool:
        return self._settings.google_oauth_enabled_value

    async def google_oauth_client_id(self) -> str | None:
        return self._settings.google_oauth_client_id_value

    async def google_oauth_client_secret(self) -> str | None:
        return self._settings.google_oauth_client_secret_value

    async def google_oauth_redirect_uri(self) -> str | None:
        return self._settings.google_oauth_redirect_uri_value

    async def google_enabled(self) -> bool:
        return bool(
            self._settings.google_oauth_enabled_value
            and self._settings.google_oauth_client_id_value
            and self._settings.google_oauth_client_secret_value
            and self._settings.google_oauth_redirect_uri_value
            and self._settings.oauth_flow_hmac_key_value
        )

    async def web_base_url(self) -> str:
        return self._settings.web_base_url_value.rstrip("/")

    async def oauth_flow_hmac_key(self) -> str | None:
        return self._settings.oauth_flow_hmac_key_value

    async def oauth_flow_ttl_seconds(self) -> int:
        return self._settings.oauth_flow_ttl_seconds_value

    async def email_confirmation_required(self) -> bool:
        return self._settings.email_confirmation_required_value

    async def email_confirmation_hmac_key(self) -> str | None:
        return self._settings.email_confirmation_hmac_key_value

    async def email_confirmation_ttl_seconds(self) -> int:
        return self._settings.email_confirmation_ttl_seconds_value

    async def email_confirmation_max_attempts(self) -> int:
        return self._settings.email_confirmation_max_attempts_value

    async def email_confirmation_resend_cooldown_seconds(self) -> int:
        return self._settings.email_confirmation_resend_cooldown_seconds_value

    async def email_confirmation_resend_hourly_cap(self) -> int:
        return self._settings.email_confirmation_resend_hourly_cap_value

    async def mail_backend(self) -> str:
        return self._settings.mail_backend_value

    async def mail_from(self) -> str | None:
        return self._settings.mail_from_value

    async def mail_outbox_dir(self) -> str:
        return self._settings.mail_outbox_dir_value

    async def mail_http_url(self) -> str | None:
        return self._settings.mail_http_url_value

    async def mail_http_api_key(self) -> str | None:
        return self._settings.mail_http_api_key_value

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

    async def refresh_cookie_secure(self) -> bool:
        return self._settings.resolved_refresh_cookie_secure()

    async def refresh_cookie_samesite(self) -> str:
        return self._settings.refresh_cookie_samesite_value

    async def deezer_base_url(self) -> str:
        return self._settings.deezer_base_url_value

    async def search_cache_ttl_seconds(self) -> int:
        return self._settings.search_cache_ttl_seconds_value

    async def search_cache_max_entries(self) -> int:
        return self._settings.search_cache_max_entries_value

    async def search_rate_limit_per_window(self) -> int:
        return self._settings.search_rate_limit_per_window_value

    async def search_rate_limit_window_seconds(self) -> int:
        return self._settings.search_rate_limit_window_seconds_value


@lru_cache(maxsize=1)
def get_settings_provider() -> EnvSettingsProvider:
    return EnvSettingsProvider()
