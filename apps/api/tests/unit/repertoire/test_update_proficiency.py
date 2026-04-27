from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

import pytest

from campfire_api.contexts.repertoire.application.use_cases.update_proficiency import (
    UpdateProficiency,
)
from campfire_api.contexts.repertoire.domain.entities import RepertoireEntry
from campfire_api.contexts.repertoire.domain.errors import EntryNotFound, ProficiencyUnknown

pytestmark = pytest.mark.unit

_BASE_TS = datetime(2026, 1, 1, tzinfo=timezone.utc)
_UPDATED_TS = _BASE_TS + timedelta(hours=1)


class FakeClock:
    def __init__(self, ts: datetime) -> None:
        self._ts = ts

    def now(self) -> datetime:
        return self._ts


class FakeRepo:
    def __init__(self) -> None:
        self._entries: dict[UUID, RepertoireEntry] = {}

    async def get_by_id(self, entry_id: UUID) -> RepertoireEntry | None:
        return self._entries.get(entry_id)

    async def update(self, entry: RepertoireEntry) -> None:
        self._entries[entry.id] = entry

    async def get_by_user_song_instrument(self, *args):
        return None

    async def list_by_user(self, user_id):
        return []

    async def add(self, entry: RepertoireEntry) -> None:
        self._entries[entry.id] = entry

    async def delete(self, entry: RepertoireEntry) -> None:
        self._entries.pop(entry.id, None)


def _stored_entry(repo: FakeRepo, user_id: UUID) -> RepertoireEntry:
    eid = uuid4()
    entry = RepertoireEntry(
        id=eid,
        user_id=user_id,
        song_external_id="123",
        song_title="Song",
        song_artist="Artist",
        song_album=None,
        song_release_year=None,
        song_cover_art_url=None,
        instrument="Guitar",
        proficiency="learning",
        created_at=_BASE_TS,
        updated_at=_BASE_TS,
    )
    repo._entries[eid] = entry
    return entry


class TestUpdateProficiency:
    @pytest.mark.asyncio
    async def test_happy_update_bumps_updated_at_only(self) -> None:
        repo = FakeRepo()
        user_id = uuid4()
        entry = _stored_entry(repo, user_id)
        uc = UpdateProficiency(repo, FakeClock(_UPDATED_TS))
        result = await uc.execute(user_id, entry.id, "practicing")
        assert result.proficiency == "practicing"
        assert result.updated_at == _UPDATED_TS
        assert result.created_at == _BASE_TS

    @pytest.mark.asyncio
    async def test_unknown_proficiency_raises(self) -> None:
        repo = FakeRepo()
        user_id = uuid4()
        entry = _stored_entry(repo, user_id)
        uc = UpdateProficiency(repo, FakeClock(_UPDATED_TS))
        with pytest.raises(ProficiencyUnknown):
            await uc.execute(user_id, entry.id, "expert")

    @pytest.mark.asyncio
    async def test_non_owner_raises_not_found(self) -> None:
        repo = FakeRepo()
        user_a = uuid4()
        user_b = uuid4()
        entry = _stored_entry(repo, user_a)
        uc = UpdateProficiency(repo, FakeClock(_UPDATED_TS))
        with pytest.raises(EntryNotFound):
            await uc.execute(user_b, entry.id, "practicing")

    @pytest.mark.asyncio
    async def test_missing_entry_raises_not_found(self) -> None:
        uc = UpdateProficiency(FakeRepo(), FakeClock(_UPDATED_TS))
        with pytest.raises(EntryNotFound):
            await uc.execute(uuid4(), uuid4(), "practicing")
