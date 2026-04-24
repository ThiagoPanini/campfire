from __future__ import annotations

from dataclasses import dataclass

from domain.user.models import LocalUser


@dataclass(frozen=True)
class BootstrapIdentityDto:
    """Authenticated user context returned to the frontend shell."""

    user: LocalUser
    first_login: bool

    def to_response(self) -> dict[str, object]:
        """Serialize the DTO into the public contract shape."""

        return {
            "user": {
                "id": self.user.user_id,
                "email": self.user.email,
                "displayName": self.user.display_name,
                "status": self.user.status.value,
                "lastLoginAt": self.user.last_login_at.isoformat(),
            },
            "auth": {
                "email": self.user.email,
                "emailVerified": self.user.email_verified,
                "methods": [],
            },
            "onboarding": {
                "status": self.user.onboarding_status.value,
                "completedAt": (
                    self.user.onboarding_completed_at.isoformat()
                    if self.user.onboarding_completed_at
                    else None
                ),
                "deferredAt": (
                    self.user.onboarding_deferred_at.isoformat()
                    if self.user.onboarding_deferred_at
                    else None
                ),
            },
            "methods": [],
            "bootstrap": {
                "firstLogin": self.first_login,
            },
            "firstLogin": self.first_login,
        }
