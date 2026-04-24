from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime

from application.user_context.dto import BootstrapIdentityDto
from domain.user.models import AuthenticationIdentityLink, LocalUser, VerifiedIdentityClaims
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

        now = datetime.now(UTC)
        existing_user = self.repository.get_by_provider_identity(claims.provider_name, claims.provider_subject)

        if existing_user:
            updated_user = existing_user.register_login(now=now)
            return BootstrapIdentityDto(user=self.repository.update(updated_user), first_login=False)

        existing_email_user = self.repository.get_by_email(claims.email_normalized)
        if existing_email_user:
            self.repository.create_identity_link(
                AuthenticationIdentityLink(
                    user_id=existing_email_user.user_id,
                    provider_name=claims.provider_name,
                    provider_subject=claims.provider_subject,
                    email_normalized=claims.email_normalized,
                    linked_at=now,
                    last_used_at=now,
                )
            )
            updated_user = existing_email_user.register_login(now=now)
            return BootstrapIdentityDto(user=self.repository.update(updated_user), first_login=False)

        new_user = LocalUser.bootstrap(claims, now=now)
        created_user = self.repository.create(new_user)
        self.repository.create_identity_link(
            AuthenticationIdentityLink(
                user_id=created_user.user_id,
                provider_name=claims.provider_name,
                provider_subject=claims.provider_subject,
                email_normalized=claims.email_normalized,
                linked_at=now,
                last_used_at=now,
            )
        )
        return BootstrapIdentityDto(user=created_user, first_login=True)
