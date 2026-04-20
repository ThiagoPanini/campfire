"""In-memory instrument suggestion catalog.

Names are normalized lowercase, mirroring the ``Instrument`` value object.
Custom instruments do not need to be added here — ``RegisterRepertoireEntry``
accepts any non-empty name and normalizes it via ``Instrument``.
"""

from __future__ import annotations

from collections.abc import Iterable

_DEFAULT_SUGGESTIONS: tuple[str, ...] = (
    "acoustic guitar",
    "electric guitar",
    "bass guitar",
    "vocals",
    "backing vocals",
    "piano",
    "keyboard",
    "drums",
    "cajon",
    "violin",
    "cello",
    "flute",
    "saxophone",
    "trumpet",
    "ukulele",
    "harmonica",
    "mandolin",
    "banjo",
)


class InMemoryInstrumentCatalog:
    def __init__(self, suggestions: Iterable[str] | None = None) -> None:
        seed = suggestions if suggestions is not None else _DEFAULT_SUGGESTIONS
        self._suggestions: list[str] = sorted({s.strip().lower() for s in seed if s.strip()})

    def search(self, query: str | None = None, limit: int = 50) -> list[str]:
        if not query or not query.strip():
            return list(self._suggestions[:limit])
        q = query.strip().lower()
        return [s for s in self._suggestions if q in s][:limit]
