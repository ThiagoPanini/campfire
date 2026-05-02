from datetime import datetime

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from campfire_api.contexts.identity.adapters.persistence.mappers import (
    email_confirmation_from_row,
)
from campfire_api.contexts.identity.adapters.persistence.models import EmailConfirmationRow
from campfire_api.contexts.identity.domain.entities import EmailConfirmation
from campfire_api.contexts.identity.domain.value_objects import UserId


class SqlAlchemyEmailConfirmationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_pending_for_user(self, user_id: UserId) -> EmailConfirmation | None:
        row = await self.session.scalar(
            select(EmailConfirmationRow).where(
                EmailConfirmationRow.user_id == user_id.value,
                EmailConfirmationRow.status == "pending",
            )
        )
        return email_confirmation_from_row(row) if row else None

    async def add(self, confirmation: EmailConfirmation) -> None:
        self.session.add(
            EmailConfirmationRow(
                id=confirmation.id.value,
                user_id=confirmation.user_id.value,
                email=confirmation.email.value,
                code_hash=confirmation.code_hash,
                created_at=confirmation.created_at,
                expires_at=confirmation.expires_at,
                attempt_count=confirmation.attempt_count,
                resend_count=confirmation.resend_count,
                last_resent_at=confirmation.last_resent_at,
                status=confirmation.status,
                invalidated_reason=confirmation.invalidated_reason,
            )
        )
        await self.session.flush()

    async def update(self, confirmation: EmailConfirmation) -> None:
        row = await self.session.get(EmailConfirmationRow, confirmation.id.value)
        if row is None:
            return
        row.attempt_count = confirmation.attempt_count
        row.resend_count = confirmation.resend_count
        row.last_resent_at = confirmation.last_resent_at
        row.status = confirmation.status
        row.invalidated_reason = confirmation.invalidated_reason
        await self.session.flush()

    async def invalidate_pending_for(self, user_id: UserId, *, reason: str, now: datetime) -> None:
        await self.session.execute(
            update(EmailConfirmationRow)
            .where(
                EmailConfirmationRow.user_id == user_id.value,
                EmailConfirmationRow.status == "pending",
            )
            .values(status="invalidated", invalidated_reason=reason, last_resent_at=now)
        )
        await self.session.flush()

    async def count_resends_in_window(self, user_id: UserId, window_start: datetime) -> int:
        value = await self.session.scalar(
            select(func.count())
            .select_from(EmailConfirmationRow)
            .where(
                EmailConfirmationRow.user_id == user_id.value,
                EmailConfirmationRow.created_at >= window_start,
            )
        )
        return int(value or 0)
