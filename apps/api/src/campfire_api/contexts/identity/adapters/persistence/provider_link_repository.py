from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from campfire_api.contexts.identity.adapters.persistence.mappers import provider_link_from_row
from campfire_api.contexts.identity.adapters.persistence.models import ProviderLinkRow
from campfire_api.contexts.identity.domain.entities import ProviderLink
from campfire_api.contexts.identity.domain.value_objects import ProviderSubject, UserId


class SqlAlchemyProviderLinkRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get(self, provider: str, subject: ProviderSubject) -> ProviderLink | None:
        row = await self.session.scalar(
            select(ProviderLinkRow).where(
                ProviderLinkRow.provider == provider,
                ProviderLinkRow.subject == subject.value,
            )
        )
        return provider_link_from_row(row) if row else None

    async def get_for_user(self, user_id: UserId, provider: str) -> ProviderLink | None:
        row = await self.session.scalar(
            select(ProviderLinkRow).where(
                ProviderLinkRow.user_id == user_id.value,
                ProviderLinkRow.provider == provider,
            )
        )
        return provider_link_from_row(row) if row else None

    async def add(self, link: ProviderLink) -> None:
        self.session.add(
            ProviderLinkRow(
                id=link.id.value,
                user_id=link.user_id.value,
                provider=link.provider,
                subject=link.subject.value,
                email_at_link=link.email_at_link.value,
                created_at=link.created_at,
                updated_at=link.updated_at,
            )
        )
        await self.session.flush()
