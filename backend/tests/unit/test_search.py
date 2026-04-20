from __future__ import annotations

from campfire.application.use_cases import SearchInstruments, SearchSongs
from campfire.infrastructure.persistence.memory import (
    InMemoryInstrumentCatalog,
    InMemorySongSearchProvider,
)


def test_song_search_matches_title_substring() -> None:
    uc = SearchSongs(provider=InMemorySongSearchProvider())
    hits = uc.execute("black")
    titles = [h.title for h in hits]
    assert "Black" in titles
    assert "Blackbird" in titles


def test_song_search_matches_artist_substring() -> None:
    uc = SearchSongs(provider=InMemorySongSearchProvider())
    hits = uc.execute("beatles")
    assert all(h.artist == "The Beatles" for h in hits)
    assert len(hits) >= 3


def test_song_search_empty_query_returns_empty() -> None:
    uc = SearchSongs(provider=InMemorySongSearchProvider())
    assert uc.execute("   ") == []


def test_instrument_catalog_returns_sorted_list() -> None:
    uc = SearchInstruments(catalog=InMemoryInstrumentCatalog())
    items = uc.execute()
    assert items == sorted(items)
    assert "acoustic guitar" in items


def test_instrument_catalog_filters_by_query() -> None:
    uc = SearchInstruments(catalog=InMemoryInstrumentCatalog())
    items = uc.execute("guitar")
    assert all("guitar" in i for i in items)
    assert len(items) >= 2
