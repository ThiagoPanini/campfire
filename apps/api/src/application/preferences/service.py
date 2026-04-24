from __future__ import annotations

from dataclasses import dataclass

from domain.preferences.models import UserPreferences
from domain.preferences.repository import UserPreferencesRepository
from domain.user.models import LocalUser, OnboardingStatus
from domain.user.repository import LocalUserRepository


@dataclass
class SaveUserPreferences:
    """Application use case for persisting onboarding preferences."""

    repository: UserPreferencesRepository

    def execute(self, preferences: UserPreferences) -> UserPreferences:
        return self.repository.put(preferences)


@dataclass
class GetUserPreferences:
    repository: UserPreferencesRepository

    def execute(self, user_id: str) -> UserPreferences | None:
        return self.repository.get(user_id)


@dataclass
class UpdateOnboardingState:
    repository: LocalUserRepository

    def complete(self, user_id: str) -> LocalUser:
        return self.repository.update_onboarding_state(user_id, OnboardingStatus.COMPLETED)

    def defer(self, user_id: str) -> LocalUser:
        return self.repository.update_onboarding_state(user_id, OnboardingStatus.DEFERRED)
