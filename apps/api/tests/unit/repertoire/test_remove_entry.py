from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID, uuid4

import pytest

from campfire_api.contexts.repertoire.application.use_cases.add_or_update_entry import (
    AddOrUpdateEntry,
)
from campfire_api.contexts.repertoire.application.use_cases.remove_entry import RemoveEntry
from campfire_api.contexts.repertoire.domain.entities import RepertoireEntry
from campfire_api.contexts.repertoire.domain.errors import EntryNotFound

pytestmark = pytest.mark.unit


class FakeClock:
    def now(self) -> datetime:
        return datetime(2026, 1, 1, tzinfo=timezone.utc)


class FakeRepo:
    def __init__(self) -> None:
        self._entries: dict[UUID, RepertoireEntry] = {}

    async def get_by_id(self, entry_id: UUID) -> RepertoireEntry | None:
        return self._entries.get(entry_id)

    async def get_by_user_song_instrument(
        self, user_id: UUID, song_external_id: str, instrument: str
    ) -> RepertoireEntry | None:
        for e in self._entries.values():
            if (
                e.user_id == user_id
                and e.song_external_id == song_external_id
                and e.instrument == instrument
            ):
                return e
        return None

    async def list_by_user(self, user_id: UUID) -> list[RepertoireEntry]:
        return [e for e in self._entries.values() if e.user_id == user_id]

    async def add(self, entry: RepertoireEntry) -> None:
        self._entries[entry.id] = entry

    async def update(self, entry: RepertoireEntry) -> None:
        self._entries[entry.id] = entry

    async def delete(self, entry: RepertoireEntry) -> None:
        self._entries.pop(entry.id, None)


class TestRemoveEntry:
    @pytest.mark.asyncio
    async def test_owner_deletes_successfully(self) -> None:
        repo = FakeRepo()
        clock = FakeClock()
        add_uc = AddOrUpdateEntry(repo, clock)
        user_id = uuid4()
        entry, _ = await add_uc.execute(
            user_id=user_id,
            song_external_id="1",
            song_title="Song",
            song_artist="Artist",
            song_album=None,
            song_release_year=None,
            song_cover_art_url=None,
            instrument="Guitar",
            proficiency="practicing",
        )
        uc = RemoveEntry(repo)
        await uc.execute(user_id, entry.id)
        assert len(repo._entries) == 0

    @pytest.mark.asyncio
    async def test_non_owner_raises_not_found(self) -> None:
        repo = FakeRepo()
        clock = FakeClock()
        add_uc = AddOrUpdateEntry(repo, clock)
        user_a = uuid4()
        user_b = uuid4()
        entry, _ = await add_uc.execute(
            user_id=user_a,
            song_external_id="1",
            song_title="Song",
            song_artist="Artist",
            song_album=None,
            song_release_year=None,
            song_cover_art_url=None,
            instrument="Guitar",
            proficiency="practicing",
        )
        uc = RemoveEntry(repo)
        with pytest.raises(EntryNotFound):
            await uc.execute(user_b, entry.id)

    @pytest.mark.asyncio
    async def test_missing_id_raises_not_found(self) -> None:
        uc = RemoveEntry(FakeRepo())
        with pytest.raises(EntryNotFound):
            await uc.execute(uuid4(), uuid4())

    @pytest.mark.asyncio
    async def test_readd_after_delete_creates_fresh_row(self) -> None:
        repo = FakeRepo()
        clock = FakeClock()
        add_uc = AddOrUpdateEntry(repo, clock)
        remove_uc = RemoveEntry(repo)
        user_id = uuid4()
        payload = dict(
            user_id=user_id,
            song_external_id="1",
            song_title="Song",
            song_artist="Artist",
            song_album=None,
            song_release_year=None,
            song_cover_art_url=None,
            instrument="Guitar",
            proficiency="practicing",
        )
        entry1, _ = await add_uc.execute(**payload)
        await remove_uc.execute(user_id, entry1.id)
        entry2, action = await add_uc.execute(**payload)
        assert action == "created"
        assert entry2.id != entry1.id
