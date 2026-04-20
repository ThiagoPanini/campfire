"""Placeholder authentication adapter.

Real auth (OAuth / invite codes / magic links) is out of scope for the initial
scaffold — the business context only confirms *that* access is restricted to a
preselected list. This adapter resolves a caller-supplied header (``X-User-Id``)
to an authorized ``User`` and is the single point where a real provider will
plug in later.
"""

from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from campfire.domain.exceptions import NotAuthorizedUserError
from campfire.domain.models.user import User
from campfire.domain.repositories import UserRepository


@dataclass(frozen=True, slots=True)
class PlaceholderAuthenticator:
    users: UserRepository

    def authenticate(self, user_id: UUID | None) -> User:
        if user_id is None:
            raise NotAuthorizedUserError("missing user identity")
        user = self.users.get(user_id)
        if user is None:
            raise NotAuthorizedUserError(str(user_id))
        return user
