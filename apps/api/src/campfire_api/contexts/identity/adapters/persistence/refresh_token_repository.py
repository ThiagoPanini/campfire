from datetime import datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from campfire_api.contexts.identity.adapters.persistence.mappers import refresh_token_from_row
from campfire_api.contexts.identity.adapters.persistence.models import RefreshTokenRow
from campfire_api.contexts.identity.domain.entities import RefreshToken


def _uuid(value: object):
    return getattr(value, "value", value)


class SqlAlchemyRefreshTokenRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def add(self, token: RefreshToken) -> None:
        self.session.add(
            RefreshTokenRow(
                id=token.id.value,
                session_id=token.session_id.value,
                family_id=token.family_id.value,
                user_id=token.user_id.value,
                token_fingerprint=token.token_fingerprint,
                issued_at=token.issued_at,
                expires_at=token.expires_at,
                consumed_at=token.consumed_at,
                revoked_at=token.revoked_at,
                revoked_reason=token.revoked_reason,
            )
        )
        await self.session.flush()

    async def get_by_fingerprint(self, fingerprint: bytes) -> RefreshToken | None:
        row = await self.session.scalar(
            select(RefreshTokenRow).where(RefreshTokenRow.token_fingerprint == fingerprint)
        )
        return refresh_token_from_row(row) if row else None

    async def consume_atomic(self, token_id: object, now: datetime) -> RefreshToken | None:
        result = await self.session.execute(
            update(RefreshTokenRow)
            .where(RefreshTokenRow.id == _uuid(token_id), RefreshTokenRow.consumed_at.is_(None))
            .values(consumed_at=now)
            .returning(RefreshTokenRow)
        )
        row = result.scalar_one_or_none()
        await self.session.flush()
        return refresh_token_from_row(row) if row else None

    async def revoke_family(self, family_id: object, reason: str, now: datetime) -> None:
        await self.session.execute(
            update(RefreshTokenRow)
            .where(
                RefreshTokenRow.family_id == _uuid(family_id), RefreshTokenRow.revoked_at.is_(None)
            )
            .values(revoked_at=now, revoked_reason=reason)
        )
        await self.session.flush()
