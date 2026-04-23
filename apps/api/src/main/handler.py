from __future__ import annotations

import json
from collections.abc import Mapping
from typing import Any

import boto3

from application.user_context.service import GetOrBootstrapLocalUser
from infrastructure.http.health import health_response
from infrastructure.http.me import me_response
from infrastructure.persistence.local_user_repository import DynamoDbLocalUserRepository
from main.logging import configure_logging
from main.observability import Observability
from main.settings import Settings, load_settings

LOGGER = configure_logging()
OBSERVABILITY = Observability(LOGGER)


def _settings() -> Settings:
    return load_settings()


def _repository(settings: Settings) -> DynamoDbLocalUserRepository:
    dynamodb_kwargs: dict[str, str] = {"region_name": settings.aws_region}

    if settings.dynamodb_endpoint_url:
        dynamodb_kwargs["endpoint_url"] = settings.dynamodb_endpoint_url

    table = boto3.resource("dynamodb", **dynamodb_kwargs).Table(settings.local_users_table)
    return DynamoDbLocalUserRepository(table)


def _json_response(status_code: int, body: dict[str, object]) -> dict[str, object]:
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
        },
        "body": json.dumps(body),
    }


def _claims_from_event(event: Mapping[str, Any]) -> Mapping[str, object]:
    return (
        event.get("requestContext", {})
        .get("authorizer", {})
        .get("jwt", {})
        .get("claims", {})
    )


def lambda_handler(event: Mapping[str, Any], _context: Any) -> dict[str, object]:
    """AWS Lambda entry point for Campfire auth-bootstrap endpoints."""

    settings = _settings()
    path = event.get("rawPath", "/")
    method = event.get("requestContext", {}).get("http", {}).get("method", "GET")
    OBSERVABILITY.record_event("request_received", path=path, method=method)

    if path == "/health" and method == "GET":
        OBSERVABILITY.record_event("health_success")
        return _json_response(200, health_response(settings.app_name))

    if path == "/me" and method == "GET":
        claims = _claims_from_event(event)

        if not claims:
            OBSERVABILITY.record_event("me_unauthorized")
            return _json_response(
                401,
                {
                    "error": "unauthorized",
                    "message": "Valid authentication is required.",
                },
            )

        try:
            payload = me_response(claims, GetOrBootstrapLocalUser(repository=_repository(settings)))
        except PermissionError as error:
            OBSERVABILITY.record_event("me_rejected", reason=str(error))
            return _json_response(
                401,
                {
                    "error": "unauthorized",
                    "message": str(error),
                },
            )

        OBSERVABILITY.record_event("me_success", first_login=payload["bootstrap"]["firstLogin"])
        return _json_response(200, payload)

    OBSERVABILITY.record_event("route_not_found", path=path)
    return _json_response(
        404,
        {
            "error": "not_found",
            "message": "Route not found.",
        },
    )
