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
            "bootstrap": {
                "firstLogin": self.first_login,
            },
        }
