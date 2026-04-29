from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from campfire_api.contexts.identity.adapters.persistence.mappers import user_from_row
from campfire_api.contexts.identity.adapters.persistence.models import UserRow
from campfire_api.contexts.identity.domain.entities import User
from campfire_api.contexts.identity.domain.value_objects import Email, UserId


class SqlAlchemyUserRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_email(self, email: Email) -> User | None:
        row = await self.session.scalar(select(UserRow).where(UserRow.email == email.value))
        return user_from_row(row) if row else None

    async def get_by_id(self, user_id: UserId) -> User | None:
        row = await self.session.get(UserRow, user_id.value)
        return user_from_row(row) if row else None

    async def add(self, user: User) -> None:
        self.session.add(
            UserRow(
                id=user.id.value,
                email=user.email.value,
                display_name=user.display_name.value,
                created_at=user.created_at,
                updated_at=user.updated_at,
            )
        )
        await self.session.flush()

    async def update(self, user: User) -> None:
        row = await self.session.get(UserRow, user.id.value)
        if row is None:
            return
        row.email = user.email.value
        row.display_name = user.display_name.value
        row.updated_at = user.updated_at
        await self.session.flush()
