from datetime import datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from campfire_api.contexts.identity.adapters.persistence.mappers import oauth_flow_state_from_row
from campfire_api.contexts.identity.adapters.persistence.models import OAuthFlowStateRow
from campfire_api.contexts.identity.domain.entities import OAuthFlowState


class SqlAlchemyOAuthFlowStateRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def add(self, flow: OAuthFlowState) -> None:
        self.session.add(
            OAuthFlowStateRow(
                id=flow.id.value,
                state_token_hash=flow.state_token_hash,
                pkce_verifier=flow.pkce_verifier,
                nonce_hash=flow.nonce_hash,
                intent=flow.intent,
                return_to=flow.return_to,
                created_at=flow.created_at,
                expires_at=flow.expires_at,
                consumed_at=flow.consumed_at,
                consumed_reason=flow.consumed_reason,
            )
        )
        await self.session.flush()

    async def consume_atomic(
        self, flow_id: object, *, reason: str, now: datetime
    ) -> OAuthFlowState | None:
        raw_id = getattr(flow_id, "value", flow_id)
        statement = (
            update(OAuthFlowStateRow)
            .where(
                OAuthFlowStateRow.id == raw_id,
                OAuthFlowStateRow.consumed_at.is_(None),
                OAuthFlowStateRow.expires_at > now,
            )
            .values(consumed_at=now, consumed_reason=reason)
            .returning(OAuthFlowStateRow.id)
        )
        result = await self.session.execute(statement)
        updated_id = result.scalar_one_or_none()
        if updated_id is None:
            return None
        row = await self.session.scalar(
            select(OAuthFlowStateRow).where(OAuthFlowStateRow.id == raw_id)
        )
        return oauth_flow_state_from_row(row) if row else None
