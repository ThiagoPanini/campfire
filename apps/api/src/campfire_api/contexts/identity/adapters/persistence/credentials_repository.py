from sqlalchemy.ext.asyncio import AsyncSession

from campfire_api.contexts.identity.adapters.persistence.mappers import credentials_from_row
from campfire_api.contexts.identity.adapters.persistence.models import CredentialsRow
from campfire_api.contexts.identity.domain.entities import Credentials
from campfire_api.contexts.identity.domain.value_objects import UserId


class SqlAlchemyCredentialsRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_user_id(self, user_id: UserId) -> Credentials | None:
        row = await self.session.get(CredentialsRow, user_id.value)
        return credentials_from_row(row) if row else None

    async def add(self, credentials: Credentials) -> None:
        self.session.add(
            CredentialsRow(
                user_id=credentials.user_id.value,
                password_hash=credentials.password_hash.value,
                created_at=credentials.created_at,
                updated_at=credentials.updated_at,
            )
        )
        await self.session.flush()
