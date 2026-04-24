from __future__ import annotations

from typing import Protocol

from domain.user.models import AuthenticationIdentityLink, LocalUser, OnboardingStatus


class LocalUserRepository(Protocol):
    """Persistence port for Campfire local users."""

    def get_by_provider_identity(self, provider_name: str, provider_subject: str) -> LocalUser | None:
        """Return an existing local user for the provider identity."""

    def get_by_email(self, email_normalized: str) -> LocalUser | None:
        """Return an existing local user for a normalized email."""

    def create(self, user: LocalUser) -> LocalUser:
        """Persist a newly bootstrapped user."""

    def create_identity_link(self, link: AuthenticationIdentityLink) -> None:
        """Persist a provider identity link for an existing user."""

    def update(self, user: LocalUser) -> LocalUser:
        """Persist mutable fields for a returning user."""

    def update_onboarding_state(self, user_id: str, status: OnboardingStatus) -> LocalUser:
        """Persist an onboarding status transition for a user."""
