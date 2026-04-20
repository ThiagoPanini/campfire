"""Use case: list all authorized users."""

from __future__ import annotations

from dataclasses import dataclass

from campfire.domain.models.user import User
from campfire.domain.repositories import UserRepository


@dataclass(frozen=True, slots=True)
class ListUsers:
    users: UserRepository

    def execute(self) -> list[User]:
        return list(self.users.list_all())
