from __future__ import annotations

import asyncio
import time
from collections import OrderedDict
from typing import Any

from campfire_api.contexts.repertoire.domain.entities import SearchResult


class TtlSearchCache:
    def __init__(self, ttl_seconds: int = 60, max_entries: int = 1024) -> None:
        self._ttl = ttl_seconds
        self._max = max_entries
        self._store: OrderedDict[tuple, tuple[list[SearchResult], float]] = OrderedDict()
        self._lock = asyncio.Lock()

    def _normalize_key(self, key: tuple[Any, ...]) -> tuple[Any, ...]:
        # Normalize string components (query part) for case-insensitive lookup
        parts = []
        for part in key:
            parts.append(part.strip().lower() if isinstance(part, str) else part)
        return tuple(parts)

    async def get(self, key: tuple[Any, ...]) -> list[SearchResult] | None:
        norm = self._normalize_key(key)
        async with self._lock:
            if norm not in self._store:
                return None
            results, expires_at = self._store[norm]
            if time.monotonic() > expires_at:
                del self._store[norm]
                return None
            self._store.move_to_end(norm)
            return results

    async def set(self, key: tuple[Any, ...], value: list[SearchResult]) -> None:
        norm = self._normalize_key(key)
        async with self._lock:
            if norm in self._store:
                self._store.move_to_end(norm)
            self._store[norm] = (value, time.monotonic() + self._ttl)
            while len(self._store) > self._max:
                self._store.popitem(last=False)
