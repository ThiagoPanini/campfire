from __future__ import annotations

from datetime import datetime
from typing import Any

from domain.preferences.models import ExperienceLevel, PlayContext, UserPreferences
from domain.preferences.repository import UserPreferencesRepository

PREFERENCES_SK = "PREFERENCES"


def _serialize(preferences: UserPreferences) -> dict[str, Any]:
    return {
        "pk": f"USER#{preferences.user_id}",
        "sk": PREFERENCES_SK,
        "user_id": preferences.user_id,
        "instruments": list(preferences.instruments),
        "genres": list(preferences.genres),
        "play_context": preferences.play_context.value if preferences.play_context else None,
        "goals": list(preferences.goals),
        "experience_level": (
            preferences.experience_level.value if preferences.experience_level else None
        ),
        "updated_at": preferences.updated_at.isoformat(),
    }


def _deserialize(item: dict[str, Any]) -> UserPreferences:
    raw_context = item.get("play_context")
    raw_xp = item.get("experience_level")
    return UserPreferences(
        user_id=str(item["user_id"]),
        instruments=tuple(str(v) for v in item.get("instruments", [])),
        genres=tuple(str(v) for v in item.get("genres", [])),
        play_context=PlayContext(raw_context) if raw_context else None,
        goals=tuple(str(v) for v in item.get("goals", [])),
        experience_level=ExperienceLevel(raw_xp) if raw_xp else None,
        updated_at=datetime.fromisoformat(str(item["updated_at"])),
    )


class DynamoDbUserPreferencesRepository(UserPreferencesRepository):
    """DynamoDB adapter storing preferences under the user's single-table item."""

    def __init__(self, table: Any) -> None:
        self._table = table

    def get(self, user_id: str) -> UserPreferences | None:
        response = self._table.get_item(Key={"pk": f"USER#{user_id}", "sk": PREFERENCES_SK})
        item = response.get("Item")
        if not item:
            return None
        return _deserialize(item)

    def put(self, preferences: UserPreferences) -> UserPreferences:
        self._table.put_item(Item=_serialize(preferences))
        return preferences
