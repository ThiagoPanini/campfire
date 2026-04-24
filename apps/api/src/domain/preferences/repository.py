from __future__ import annotations

from typing import Protocol

from domain.preferences.models import UserPreferences


class UserPreferencesRepository(Protocol):
    """Persistence port for user onboarding preferences."""

    def get(self, user_id: str) -> UserPreferences | None:
        """Return stored preferences for a user, if any."""

    def put(self, preferences: UserPreferences) -> UserPreferences:
        """Persist (create or overwrite) preferences for a user."""
