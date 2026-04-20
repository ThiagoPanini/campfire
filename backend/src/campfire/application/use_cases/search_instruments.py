"""Use case: list/search common instruments for a selection UI."""

from __future__ import annotations

from dataclasses import dataclass

from campfire.domain.repositories import InstrumentCatalog


@dataclass(frozen=True, slots=True)
class SearchInstruments:
    catalog: InstrumentCatalog

    def execute(self, query: str | None = None, limit: int = 50) -> list[str]:
        return self.catalog.search(query=query, limit=limit)
