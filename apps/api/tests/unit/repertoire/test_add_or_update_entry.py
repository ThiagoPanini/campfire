from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID, uuid4

import pytest

from campfire_api.contexts.repertoire.application.use_cases.add_or_update_entry import (
    AddOrUpdateEntry,
)
from campfire_api.contexts.repertoire.domain.entities import RepertoireEntry
from campfire_api.contexts.repertoire.domain.errors import InstrumentUnknown, ProficiencyUnknown

pytestmark = pytest.mark.unit


class FakeClock:
    def __init__(self, ts: datetime | None = None) -> None:
        self._now = ts or datetime(2026, 1, 1, tzinfo=timezone.utc)

    def now(self) -> datetime:
        return self._now


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


def _base_payload(**overrides) -> dict:
    defaults = dict(
        user_id=uuid4(),
        song_external_id="1109731",
        song_title="Wonderwall",
        song_artist="Oasis",
        song_album="(What's the Story) Morning Glory?",
        song_release_year=1995,
        song_cover_art_url="https://cdn.deezer.com/cover.jpg",
        instrument="Guitar",
        proficiency="practicing",
    )
    defaults.update(overrides)
    return defaults


class TestAddOrUpdateEntry:
    @pytest.mark.asyncio
    async def test_happy_create(self) -> None:
        repo = FakeRepo()
        uc = AddOrUpdateEntry(repo, FakeClock())
        entry, action = await uc.execute(**_base_payload())
        assert action == "created"
        assert entry.proficiency == "practicing"
        assert len(repo._entries) == 1

    @pytest.mark.asyncio
    async def test_duplicate_becomes_update(self) -> None:
        repo = FakeRepo()
        uc = AddOrUpdateEntry(repo, FakeClock())
        user_id = uuid4()
        payload = _base_payload(user_id=user_id)
        entry1, _ = await uc.execute(**payload)
        original_created_at = entry1.created_at

        payload2 = {**payload, "proficiency": "ready"}
        entry2, action = await uc.execute(**payload2)
        assert action == "updated"
        assert entry2.proficiency == "ready"
        assert entry2.created_at == original_created_at
        assert len(repo._entries) == 1

    @pytest.mark.asyncio
    async def test_unknown_instrument_raises(self) -> None:
        uc = AddOrUpdateEntry(FakeRepo(), FakeClock())
        with pytest.raises(InstrumentUnknown):
            await uc.execute(**_base_payload(instrument="Theremin"))

    @pytest.mark.asyncio
    async def test_unknown_proficiency_raises(self) -> None:
        uc = AddOrUpdateEntry(FakeRepo(), FakeClock())
        with pytest.raises(ProficiencyUnknown):
            await uc.execute(**_base_payload(proficiency="expert"))

    @pytest.mark.asyncio
    async def test_two_instruments_same_song_coexist(self) -> None:
        repo = FakeRepo()
        uc = AddOrUpdateEntry(repo, FakeClock())
        user_id = uuid4()
        await uc.execute(**_base_payload(user_id=user_id, instrument="Guitar"))
        await uc.execute(**_base_payload(user_id=user_id, instrument="Piano / Keys"))
        assert len(repo._entries) == 2
