from __future__ import annotations

import json
from collections.abc import Mapping
from typing import Any

import boto3

from application.preferences.service import GetUserPreferences, SaveUserPreferences, UpdateOnboardingState
from application.user_context.service import GetOrBootstrapLocalUser
from domain.preferences.models import InvalidPreferencesError
from infrastructure.auth.claims import ClaimsMappingError, map_verified_claims
from infrastructure.http.health import health_response
from infrastructure.http.me import me_response
from infrastructure.http.onboarding import defer_onboarding_response
from infrastructure.http.preferences import get_preferences_response, save_preferences_response
from infrastructure.persistence.local_preferences_repository import (
    DynamoDbUserPreferencesRepository,
)
from infrastructure.persistence.local_user_repository import DynamoDbLocalUserRepository
from main.logging import configure_logging
from main.observability import Observability
from main.settings import Settings, load_settings

LOGGER = configure_logging()
OBSERVABILITY = Observability(LOGGER)


def _settings() -> Settings:
    return load_settings()


def _table(settings: Settings) -> Any:
    dynamodb_kwargs: dict[str, str] = {"region_name": settings.aws_region}
    if settings.dynamodb_endpoint_url:
        dynamodb_kwargs["endpoint_url"] = settings.dynamodb_endpoint_url
    return boto3.resource("dynamodb", **dynamodb_kwargs).Table(settings.local_users_table)


def _user_repository(settings: Settings) -> DynamoDbLocalUserRepository:
    return DynamoDbLocalUserRepository(_table(settings))


def _repository(settings: Settings) -> DynamoDbLocalUserRepository:
    return _user_repository(settings)


def _preferences_repository(settings: Settings) -> DynamoDbUserPreferencesRepository:
    return DynamoDbUserPreferencesRepository(_table(settings))


def _json_response(status_code: int, body: dict[str, object] | None) -> dict[str, object]:
    response: dict[str, object] = {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
        },
    }
    if body is not None:
        response["body"] = json.dumps(body)
    return response


def _claims_from_event(event: Mapping[str, Any]) -> Mapping[str, object]:
    return (
        event.get("requestContext", {})
        .get("authorizer", {})
        .get("jwt", {})
        .get("claims", {})
    )


def _resolve_user_id(claims_payload: Mapping[str, object], settings: Settings) -> str:
    claims = map_verified_claims(claims_payload)
    bootstrap = GetOrBootstrapLocalUser(repository=_user_repository(settings)).execute(claims)
    return bootstrap.user.user_id


def _parse_body(event: Mapping[str, Any]) -> Mapping[str, object]:
    raw = event.get("body")
    if not raw:
        return {}
    if isinstance(raw, dict):
        return raw
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as error:
        raise ValueError("Request body is not valid JSON.") from error
    if not isinstance(parsed, dict):
        raise ValueError("Request body must be a JSON object.")
    return parsed


def lambda_handler(event: Mapping[str, Any], _context: Any) -> dict[str, object]:
    """AWS Lambda entry point for Campfire auth-bootstrap endpoints."""

    settings = _settings()
    path = event.get("rawPath", "/")
    method = event.get("requestContext", {}).get("http", {}).get("method", "GET")
    OBSERVABILITY.record_event("request_received", path=path, method=method)

    if path == "/health" and method == "GET":
        OBSERVABILITY.record_event("health_success")
        return _json_response(200, health_response(settings.app_name))

    claims_payload = _claims_from_event(event)

    if path == "/me" and method == "GET":
        if not claims_payload:
            OBSERVABILITY.record_event("me_unauthorized")
            return _json_response(401, {"error": "unauthorized", "message": "Valid authentication is required."})
        try:
            payload = me_response(claims_payload, GetOrBootstrapLocalUser(repository=_repository(settings)))
        except PermissionError as error:
            OBSERVABILITY.record_event("me_rejected", reason=str(error))
            return _json_response(401, {"error": "unauthorized", "message": str(error)})
        OBSERVABILITY.record_event("me_success", first_login=payload["bootstrap"]["firstLogin"])
        return _json_response(200, payload)

    if path == "/me/preferences" and method in ("GET", "PUT"):
        if not claims_payload:
            OBSERVABILITY.record_event("preferences_unauthorized")
            return _json_response(401, {"error": "unauthorized", "message": "Valid authentication is required."})
        try:
            user_id = _resolve_user_id(claims_payload, settings)
        except (ClaimsMappingError, PermissionError) as error:
            OBSERVABILITY.record_event("preferences_rejected", reason=str(error))
            return _json_response(401, {"error": "unauthorized", "message": str(error)})

        if method == "GET":
            stored = get_preferences_response(
                user_id, GetUserPreferences(repository=_preferences_repository(settings))
            )
            if stored is None:
                OBSERVABILITY.record_event("preferences_not_found", user_id=user_id)
                return _json_response(404, {"error": "not_found", "message": "No preferences saved yet."})
            OBSERVABILITY.record_event("preferences_fetched", user_id=user_id)
            return _json_response(200, stored)

        try:
            body = _parse_body(event)
        except ValueError as error:
            OBSERVABILITY.record_event("preferences_bad_body", reason=str(error))
            return _json_response(400, {"error": "bad_request", "message": str(error)})

        try:
            stored = save_preferences_response(
                user_id,
                body,
                SaveUserPreferences(repository=_preferences_repository(settings)),
            )
            UpdateOnboardingState(repository=_user_repository(settings)).complete(user_id)
        except InvalidPreferencesError as error:
            OBSERVABILITY.record_event("preferences_invalid", reason=str(error))
            return _json_response(400, {"error": "invalid_preferences", "message": str(error)})

        OBSERVABILITY.record_event("preferences_saved", user_id=user_id)
        return _json_response(200, stored)

    if path == "/me/onboarding" and method == "PATCH":
        if not claims_payload:
            OBSERVABILITY.record_event("onboarding_unauthorized")
            return _json_response(401, {"error": "unauthorized", "message": "Valid authentication is required."})
        try:
            user_id = _resolve_user_id(claims_payload, settings)
            body = _parse_body(event)
            payload = defer_onboarding_response(user_id, body, _user_repository(settings))
        except (ClaimsMappingError, PermissionError) as error:
            OBSERVABILITY.record_event("onboarding_rejected", reason=str(error))
            return _json_response(401, {"error": "unauthorized", "message": str(error)})
        except (LookupError, ValueError) as error:
            OBSERVABILITY.record_event("onboarding_invalid", reason=str(error))
            return _json_response(400, {"error": "invalid_onboarding", "message": str(error)})
        OBSERVABILITY.record_event("onboarding_deferred", user_id=user_id)
        return _json_response(200, payload)

    OBSERVABILITY.record_event("route_not_found", path=path)
    return _json_response(404, {"error": "not_found", "message": "Route not found."})
