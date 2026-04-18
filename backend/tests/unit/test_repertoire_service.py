from __future__ import annotations

from uuid import uuid4

from campfire.domain.models.instrument import Instrument
from campfire.domain.models.repertoire_entry import RepertoireEntry
from campfire.domain.services import PossibleRepertoireService


def test_only_present_users_contribute_to_possible_repertoire() -> None:
    alice, bob, carol = uuid4(), uuid4(), uuid4()
    black = uuid4()
    wonderwall = uuid4()

    entries = [
        RepertoireEntry(user_id=alice, song_id=black, instrument=Instrument("acoustic guitar")),
        RepertoireEntry(user_id=bob, song_id=black, instrument=Instrument("vocals")),
        RepertoireEntry(user_id=carol, song_id=wonderwall, instrument=Instrument("piano")),
    ]

    service = PossibleRepertoireService()
    result = service.compute(present_user_ids=[alice, bob], entries=entries)

    assert len(result) == 1
    assert result[0].song_id == black
    assert set(result[0].supporters) == {alice, bob}


def test_empty_present_set_returns_nothing() -> None:
    service = PossibleRepertoireService()
    assert service.compute([], []) == []
