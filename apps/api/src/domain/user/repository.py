from __future__ import annotations

from typing import Protocol

from domain.user.models import LocalUser


class LocalUserRepository(Protocol):
    """Persistence port for Campfire local users."""

    def get_by_provider_identity(self, provider_name: str, provider_subject: str) -> LocalUser | None:
        """Return an existing local user for the provider identity."""

    def create(self, user: LocalUser) -> LocalUser:
        """Persist a newly bootstrapped user."""

    def update(self, user: LocalUser) -> LocalUser:
        """Persist mutable fields for a returning user."""
