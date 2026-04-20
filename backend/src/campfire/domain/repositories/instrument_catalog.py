"""Contract for suggesting/searching common instruments for a selection UI.

Instruments remain value objects (names). The catalog only supplies common
suggestions and optional filtering — custom names provided by users are
accepted at registration time without requiring an entry here.
"""

from __future__ import annotations

from typing import Protocol


class InstrumentCatalog(Protocol):
    def search(self, query: str | None = None, limit: int = 50) -> list[str]: ...
