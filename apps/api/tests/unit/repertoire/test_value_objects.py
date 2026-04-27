from __future__ import annotations

import pytest

from campfire_api.contexts.repertoire.domain.errors import InstrumentUnknown, ProficiencyUnknown
from campfire_api.contexts.repertoire.domain.value_objects import (
    Instrument,
    ProficiencyLevel,
    SongExternalId,
)

pytestmark = pytest.mark.unit


class TestSongExternalId:
    def test_strips_whitespace(self) -> None:
        obj = SongExternalId("  123456  ")
        assert obj.value == "123456"

    def test_rejects_empty_string(self) -> None:
        with pytest.raises(ValueError):
            SongExternalId("")

    def test_rejects_whitespace_only(self) -> None:
        with pytest.raises(ValueError):
            SongExternalId("   ")

    def test_rejects_too_long(self) -> None:
        with pytest.raises(ValueError):
            SongExternalId("x" * 129)

    def test_accepts_max_length(self) -> None:
        obj = SongExternalId("x" * 128)
        assert len(obj.value) == 128


class TestInstrument:
    def test_accepts_valid_instrument(self) -> None:
        obj = Instrument("Guitar")
        assert obj.value == "Guitar"

    def test_rejects_unknown_instrument(self) -> None:
        with pytest.raises(InstrumentUnknown):
            Instrument("Theremin")

    def test_rejects_empty(self) -> None:
        with pytest.raises(InstrumentUnknown):
            Instrument("")


class TestProficiencyLevel:
    @pytest.mark.parametrize("value", ["learning", "practicing", "ready"])
    def test_accepts_valid(self, value: str) -> None:
        obj = ProficiencyLevel(value)  # type: ignore[arg-type]
        assert obj.value == value

    def test_rejects_free_text(self) -> None:
        with pytest.raises(ProficiencyUnknown):
            ProficiencyLevel("expert")  # type: ignore[arg-type]

    def test_rejects_empty(self) -> None:
        with pytest.raises(ProficiencyUnknown):
            ProficiencyLevel("")  # type: ignore[arg-type]
