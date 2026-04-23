from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime

from application.user_context.dto import BootstrapIdentityDto
from domain.user.models import LocalUser, VerifiedIdentityClaims
from domain.user.repository import LocalUserRepository


class InvalidIdentityClaimsError(ValueError):
    """Raised when the authenticated identity is missing required attributes."""


@dataclass
class GetOrBootstrapLocalUser:
    """Application use case for resolving the Campfire local user context."""

    repository: LocalUserRepository

    def execute(self, claims: VerifiedIdentityClaims) -> BootstrapIdentityDto:
        """Return the existing user or create the first local user record."""

        if not claims.provider_subject:
            raise InvalidIdentityClaimsError("Provider subject is required.")

        if not claims.email_verified:
            raise InvalidIdentityClaimsError("Verified email is required for initial access.")

        existing_user = self.repository.get_by_provider_identity(claims.provider_name, claims.provider_subject)
        now = datetime.now(UTC)

        if existing_user:
            updated_user = existing_user.register_login(now=now)
            return BootstrapIdentityDto(user=self.repository.update(updated_user), first_login=False)

        new_user = LocalUser.bootstrap(claims, now=now)
        return BootstrapIdentityDto(user=self.repository.create(new_user), first_login=True)
