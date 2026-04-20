"""Contract for persisting and retrieving authorized users."""

from __future__ import annotations

from typing import Protocol
from uuid import UUID

from campfire.domain.models.user import User


class UserRepository(Protocol):
    def get(self, user_id: UUID) -> User | None: ...

    def get_by_email(self, email: str) -> User | None: ...

    def list_all(self) -> list[User]: ...

    def add(self, user: User) -> None: ...
