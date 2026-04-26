from collections import defaultdict, deque
from datetime import timedelta

from campfire_api.contexts.identity.application.errors import RateLimited
from campfire_api.contexts.identity.domain.ports import Clock


class InMemoryRateLimiter:
    def __init__(self, clock: Clock, limit: int, window_seconds: int) -> None:
        self.clock = clock
        self.limit = limit
        self.window = timedelta(seconds=window_seconds)
        self._attempts: dict[tuple[str, str], deque] = defaultdict(deque)

    async def check(self, client_ip: str, target_email: str) -> None:
        key = (client_ip, target_email.strip().lower())
        now = self.clock.now()
        attempts = self._attempts[key]
        while attempts and now - attempts[0] > self.window:
            attempts.popleft()
        if len(attempts) >= self.limit:
            retry_at = attempts[0] + self.window
            raise RateLimited(max(1, int((retry_at - now).total_seconds())))
        attempts.append(now)
