from datetime import datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from campfire_api.contexts.identity.adapters.persistence.mappers import session_from_row
from campfire_api.contexts.identity.adapters.persistence.models import SessionRow
from campfire_api.contexts.identity.domain.entities import Session


def _uuid(value: object):
    return getattr(value, "value", value)


class SqlAlchemySessionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def add(self, session: Session) -> None:
        self.session.add(
            SessionRow(
                id=session.id.value,
                user_id=session.user_id.value,
                family_id=session.family_id.value,
                access_token_fingerprint=session.access_token_fingerprint,
                access_token_expires_at=session.access_token_expires_at,
                created_at=session.created_at,
                last_seen_at=session.last_seen_at,
                revoked_at=session.revoked_at,
                revoked_reason=session.revoked_reason,
            )
        )
        await self.session.flush()

    async def get_by_access_fingerprint(self, fingerprint: bytes) -> Session | None:
        row = await self.session.scalar(
            select(SessionRow).where(SessionRow.access_token_fingerprint == fingerprint)
        )
        return session_from_row(row) if row else None

    async def revoke(self, session_id: object, reason: str, now: datetime) -> None:
        await self.session.execute(
            update(SessionRow)
            .where(SessionRow.id == _uuid(session_id), SessionRow.revoked_at.is_(None))
            .values(revoked_at=now, revoked_reason=reason)
        )
        await self.session.flush()

    async def revoke_family(self, family_id: object, reason: str, now: datetime) -> None:
        await self.session.execute(
            update(SessionRow)
            .where(SessionRow.family_id == _uuid(family_id), SessionRow.revoked_at.is_(None))
            .values(revoked_at=now, revoked_reason=reason)
        )
        await self.session.flush()
