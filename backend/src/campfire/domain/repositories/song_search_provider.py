"""Contract for searching songs suitable for a typeahead UI.

Kept as a separate seam from ``SongRepository`` so a future external music
provider (MusicBrainz, Spotify, …) can be plugged in without affecting the
local storage of user-linked songs. The default adapter is in-memory.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True, slots=True)
class SongSearchResult:
    """A matching song candidate from a search provider.

    ``external_id`` and ``source`` are optional metadata that let the UI
    disambiguate provider-originated hits from locally-known songs later.
    """

    title: str
    artist: str
    source: str = "local"
    external_id: str | None = None


class SongSearchProvider(Protocol):
    def search(self, query: str, limit: int = 20) -> list[SongSearchResult]: ...
