from __future__ import annotations

from dataclasses import dataclass
from os import getenv


@dataclass(frozen=True)
class Settings:
    """Runtime configuration for the Campfire auth bootstrap Lambda."""

    app_name: str
    app_env: str
    aws_region: str
    dynamodb_endpoint_url: str | None
    local_users_table: str
    api_base_url: str
    web_base_url: str
    user_pool_id: str
    user_pool_client_id: str
    user_pool_domain: str


def load_settings() -> Settings:
    """Load Lambda settings from the environment."""

    return Settings(
        app_name=getenv("APP_NAME", "campfire-api"),
        app_env=getenv("APP_ENV", "dev"),
        aws_region=getenv("AWS_REGION", "us-east-1"),
        dynamodb_endpoint_url=getenv("DYNAMODB_ENDPOINT_URL") or None,
        local_users_table=getenv("LOCAL_USERS_TABLE", "campfire-dev-local-users"),
        api_base_url=getenv("API_BASE_URL", "https://api.example.com"),
        web_base_url=getenv("WEB_BASE_URL", "https://app.example.com"),
        user_pool_id=getenv("USER_POOL_ID", "us-east-1_example"),
        user_pool_client_id=getenv("USER_POOL_CLIENT_ID", "campfire-web"),
        user_pool_domain=getenv("USER_POOL_DOMAIN", "auth.example.com"),
    )
