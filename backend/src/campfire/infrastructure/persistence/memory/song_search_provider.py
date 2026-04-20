"""In-memory song search provider.

Deterministic and network-free. A real external provider (e.g. MusicBrainz)
can be introduced as a sibling adapter satisfying ``SongSearchProvider`` and
wired in ``bootstrap.py`` without touching the rest of the code.
"""

from __future__ import annotations

from collections.abc import Iterable

from campfire.domain.repositories.song_search_provider import SongSearchResult

_DEFAULT_SEED: tuple[tuple[str, str], ...] = (
    ("Black", "Pearl Jam"),
    ("Alive", "Pearl Jam"),
    ("Wonderwall", "Oasis"),
    ("Don't Look Back in Anger", "Oasis"),
    ("Wish You Were Here", "Pink Floyd"),
    ("Comfortably Numb", "Pink Floyd"),
    ("Hotel California", "Eagles"),
    ("Creep", "Radiohead"),
    ("No Surprises", "Radiohead"),
    ("Imagine", "John Lennon"),
    ("Hey Jude", "The Beatles"),
    ("Let It Be", "The Beatles"),
    ("Blackbird", "The Beatles"),
    ("Yesterday", "The Beatles"),
    ("Losing My Religion", "R.E.M."),
    ("Everlong", "Foo Fighters"),
    ("Learn to Fly", "Foo Fighters"),
    ("Sweet Child O' Mine", "Guns N' Roses"),
    ("Smells Like Teen Spirit", "Nirvana"),
    ("Come As You Are", "Nirvana"),
)


class InMemorySongSearchProvider:
    def __init__(self, seed: Iterable[tuple[str, str]] | None = None) -> None:
        self._catalog: list[SongSearchResult] = [
            SongSearchResult(title=t, artist=a, source="local") for t, a in (seed or _DEFAULT_SEED)
        ]

    def search(self, query: str, limit: int = 20) -> list[SongSearchResult]:
        q = query.strip().lower()
        if not q:
            return []
        hits = [
            s
            for s in self._catalog
            if q in s.title.lower() or q in s.artist.lower()
        ]
        return hits[:limit]
