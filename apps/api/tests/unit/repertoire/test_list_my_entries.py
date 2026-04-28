from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID, uuid4

import pytest

from campfire_api.contexts.repertoire.application.use_cases.list_my_entries import ListMyEntries
from campfire_api.contexts.repertoire.domain.entities import RepertoireEntry

pytestmark = pytest.mark.unit


def _entry(user_id: UUID, created_at: datetime, **kwargs) -> RepertoireEntry:
    defaults = dict(
        id=uuid4(),
        user_id=user_id,
        song_external_id="123",
        song_title="Song",
        song_artist="Artist",
        song_album=None,
        song_release_year=None,
        song_cover_art_url=None,
        instrument="Acoustic Guitar",
        proficiency="practicing",
        created_at=created_at,
        updated_at=created_at,
    )
    defaults.update(kwargs)
    return RepertoireEntry(**defaults)


class FakeRepo:
    def __init__(self, entries: list[RepertoireEntry]) -> None:
        self._entries = entries

    async def list_by_user(self, user_id: UUID) -> list[RepertoireEntry]:
        return sorted(
            [e for e in self._entries if e.user_id == user_id],
            key=lambda e: e.created_at,
            reverse=True,
        )


class TestListMyEntries:
    @pytest.mark.asyncio
    async def test_empty_list_when_no_entries(self) -> None:
        uc = ListMyEntries(FakeRepo([]))
        results = await uc.execute(uuid4())
        assert results == []

    @pytest.mark.asyncio
    async def test_returns_entries_in_desc_order(self) -> None:
        user = uuid4()
        e1 = _entry(user, datetime(2026, 1, 1, tzinfo=timezone.utc))
        e2 = _entry(user, datetime(2026, 1, 3, tzinfo=timezone.utc))
        e3 = _entry(user, datetime(2026, 1, 2, tzinfo=timezone.utc))
        uc = ListMyEntries(FakeRepo([e1, e2, e3]))
        results = await uc.execute(user)
        assert [r.created_at for r in results] == [
            datetime(2026, 1, 3, tzinfo=timezone.utc),
            datetime(2026, 1, 2, tzinfo=timezone.utc),
            datetime(2026, 1, 1, tzinfo=timezone.utc),
        ]

    @pytest.mark.asyncio
    async def test_other_user_entries_not_returned(self) -> None:
        user_a = uuid4()
        user_b = uuid4()
        e_a = _entry(user_a, datetime(2026, 1, 1, tzinfo=timezone.utc))
        e_b = _entry(user_b, datetime(2026, 1, 1, tzinfo=timezone.utc))
        uc = ListMyEntries(FakeRepo([e_a, e_b]))
        results = await uc.execute(user_a)
        assert all(r.user_id == user_a for r in results)
        assert len(results) == 1
