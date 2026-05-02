from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from campfire_api.contexts.identity.adapters.persistence.email_confirmation_repository import (
    SqlAlchemyEmailConfirmationRepository,
)
from campfire_api.contexts.identity.domain.entities import EmailConfirmation
from campfire_api.contexts.identity.domain.value_objects import Email, UserId

pytestmark = pytest.mark.unit


async def test_update_does_not_commit_inline() -> None:
    session = SimpleNamespace(get=AsyncMock(), flush=AsyncMock(), commit=AsyncMock())
    row = SimpleNamespace(
        attempt_count=0,
        resend_count=0,
        last_resent_at=None,
        status="pending",
        invalidated_reason=None,
    )
    session.get.return_value = row
    confirmation = EmailConfirmation(
        id=UserId.new(),
        user_id=UserId.new(),
        email=Email("ada@campfire.test"),
        code_hash=b"hash",
        created_at=datetime(2026, 1, 1, tzinfo=UTC),
        expires_at=datetime(2026, 1, 1, 0, 15, tzinfo=UTC),
    )
    confirmation.increment_attempts(max_attempts=5)

    await SqlAlchemyEmailConfirmationRepository(session).update(confirmation)

    session.flush.assert_awaited_once()
    session.commit.assert_not_called()


async def test_invalidate_pending_for_does_not_commit_inline() -> None:
    session = SimpleNamespace(execute=AsyncMock(), flush=AsyncMock(), commit=AsyncMock())

    await SqlAlchemyEmailConfirmationRepository(session).invalidate_pending_for(
        UserId.new(), reason="resent", now=datetime(2026, 1, 1, tzinfo=UTC)
    )

    session.flush.assert_awaited_once()
    session.commit.assert_not_called()
