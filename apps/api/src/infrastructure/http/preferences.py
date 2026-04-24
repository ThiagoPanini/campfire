from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from application.preferences.service import GetUserPreferences, SaveUserPreferences
from domain.preferences.models import InvalidPreferencesError, UserPreferences


def _serialize(preferences: UserPreferences) -> dict[str, Any]:
    return {
        "userId": preferences.user_id,
        "instruments": list(preferences.instruments),
        "genres": list(preferences.genres),
        "playContext": preferences.play_context.value if preferences.play_context else None,
        "goals": list(preferences.goals),
        "experienceLevel": (
            preferences.experience_level.value if preferences.experience_level else None
        ),
        "updatedAt": preferences.updated_at.isoformat(),
    }


def _coerce_string_list(field_name: str, value: object) -> list[str]:
    if value is None:
        return []
    if not isinstance(value, list):
        raise InvalidPreferencesError(f"{field_name} must be an array of strings.")
    result: list[str] = []
    for entry in value:
        if not isinstance(entry, str):
            raise InvalidPreferencesError(f"{field_name} must be an array of strings.")
        result.append(entry)
    return result


def _coerce_optional_string(field_name: str, value: object) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        raise InvalidPreferencesError(f"{field_name} must be a string.")
    return value


def save_preferences_response(
    user_id: str,
    body: Mapping[str, object],
    use_case: SaveUserPreferences,
) -> dict[str, Any]:
    preferences = UserPreferences.from_submission(
        user_id=user_id,
        instruments=_coerce_string_list("instruments", body.get("instruments")),
        genres=_coerce_string_list("genres", body.get("genres")),
        play_context=_coerce_optional_string("playContext", body.get("playContext")),
        goals=_coerce_string_list("goals", body.get("goals")),
        experience_level=_coerce_optional_string("experienceLevel", body.get("experienceLevel")),
    )
    stored = use_case.execute(preferences)
    return _serialize(stored)


def get_preferences_response(
    user_id: str,
    use_case: GetUserPreferences,
) -> dict[str, Any] | None:
    stored = use_case.execute(user_id)
    return _serialize(stored) if stored else None
