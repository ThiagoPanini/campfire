from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import uuid4

import pytest

from campfire_api.contexts.repertoire.adapters.rate_limiting.in_memory_search_limiter import (
    InMemorySearchLimiter,
)
from campfire_api.contexts.repertoire.domain.errors import SearchRateLimited

pytestmark = pytest.mark.unit


class FakeClock:
    def __init__(self) -> None:
        self._now = datetime(2026, 1, 1, tzinfo=timezone.utc)

    def now(self) -> datetime:
        return self._now

    def advance(self, seconds: float) -> None:
        self._now += timedelta(seconds=seconds)


class TestInMemorySearchLimiter:
    def test_allows_up_to_limit(self) -> None:
        clock = FakeClock()
        limiter = InMemorySearchLimiter(clock, limit=3, window_seconds=60)
        user_id = uuid4()
        import asyncio

        for _ in range(3):
            asyncio.get_event_loop().run_until_complete(limiter.check(user_id))

    def test_raises_on_limit_exceeded(self) -> None:
        clock = FakeClock()
        limiter = InMemorySearchLimiter(clock, limit=2, window_seconds=60)
        user_id = uuid4()
        import asyncio

        loop = asyncio.get_event_loop()
        loop.run_until_complete(limiter.check(user_id))
        loop.run_until_complete(limiter.check(user_id))
        with pytest.raises(SearchRateLimited):
            loop.run_until_complete(limiter.check(user_id))

    def test_recovers_after_window(self) -> None:
        clock = FakeClock()
        limiter = InMemorySearchLimiter(clock, limit=1, window_seconds=60)
        user_id = uuid4()
        import asyncio

        loop = asyncio.get_event_loop()
        loop.run_until_complete(limiter.check(user_id))
        with pytest.raises(SearchRateLimited):
            loop.run_until_complete(limiter.check(user_id))
        clock.advance(61)
        # Should not raise after window slides
        loop.run_until_complete(limiter.check(user_id))

    def test_per_user_isolation(self) -> None:
        clock = FakeClock()
        limiter = InMemorySearchLimiter(clock, limit=1, window_seconds=60)
        user_a = uuid4()
        user_b = uuid4()
        import asyncio

        loop = asyncio.get_event_loop()
        loop.run_until_complete(limiter.check(user_a))
        # user_b should still be allowed
        loop.run_until_complete(limiter.check(user_b))
