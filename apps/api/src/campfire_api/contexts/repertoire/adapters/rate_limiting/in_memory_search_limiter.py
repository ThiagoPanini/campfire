from __future__ import annotations

from collections import defaultdict, deque
from datetime import timedelta
from uuid import UUID

from campfire_api.contexts.repertoire.domain.errors import SearchRateLimited
from campfire_api.contexts.repertoire.domain.ports import Clock


class InMemorySearchLimiter:
    def __init__(self, clock: Clock, limit: int = 30, window_seconds: int = 60) -> None:
        self._clock = clock
        self._limit = limit
        self._window = timedelta(seconds=window_seconds)
        self._attempts: dict[UUID, deque] = defaultdict(deque)

    async def check(self, user_id: UUID) -> None:
        now = self._clock.now()
        attempts = self._attempts[user_id]
        while attempts and now - attempts[0] > self._window:
            attempts.popleft()
        if len(attempts) >= self._limit:
            retry_at = attempts[0] + self._window
            raise SearchRateLimited(max(1, int((retry_at - now).total_seconds())))
        attempts.append(now)
