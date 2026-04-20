from __future__ import annotations

from uuid import UUID

from campfire.domain.models.user import User


class InMemoryUserRepository:
    def __init__(self) -> None:
        self._by_id: dict[UUID, User] = {}

    def get(self, user_id: UUID) -> User | None:
        return self._by_id.get(user_id)

    def get_by_email(self, email: str) -> User | None:
        needle = email.lower()
        return next((u for u in self._by_id.values() if u.email.lower() == needle), None)

    def list_all(self) -> list[User]:
        return list(self._by_id.values())

    def add(self, user: User) -> None:
        self._by_id[user.id] = user
