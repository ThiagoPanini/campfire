from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

import pytest

from campfire_api.contexts.repertoire.domain.entities import RepertoireEntry

pytestmark = pytest.mark.unit


def _entry(**kwargs) -> RepertoireEntry:
    defaults = dict(
        id=uuid4(),
        user_id=uuid4(),
        song_external_id="123",
        song_title="Wonderwall",
        song_artist="Oasis",
        song_album="(What's the Story) Morning Glory?",
        song_release_year=1995,
        song_cover_art_url="https://cdn.deezer.com/cover.jpg",
        instrument="Guitar",
        proficiency="practicing",
        created_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
        updated_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
    )
    defaults.update(kwargs)
    return RepertoireEntry(**defaults)


class TestRepertoireEntry:
    def test_strips_title_and_artist(self) -> None:
        entry = _entry(song_title="  Wonderwall  ", song_artist="  Oasis  ")
        assert entry.song_title == "Wonderwall"
        assert entry.song_artist == "Oasis"

    def test_rejects_empty_title(self) -> None:
        with pytest.raises(ValueError):
            _entry(song_title="")

    def test_rejects_empty_artist(self) -> None:
        with pytest.raises(ValueError):
            _entry(song_artist="")

    def test_rejects_title_too_long(self) -> None:
        with pytest.raises(ValueError):
            _entry(song_title="x" * 257)

    def test_rejects_artist_too_long(self) -> None:
        with pytest.raises(ValueError):
            _entry(song_artist="x" * 257)

    def test_accepts_none_release_year(self) -> None:
        entry = _entry(song_release_year=None)
        assert entry.song_release_year is None

    def test_rejects_year_below_range(self) -> None:
        with pytest.raises(ValueError):
            _entry(song_release_year=1899)

    def test_rejects_year_above_range(self) -> None:
        with pytest.raises(ValueError):
            _entry(song_release_year=2101)
