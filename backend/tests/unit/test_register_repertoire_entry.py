from __future__ import annotations

import pytest

from campfire.application.dto import RegisterRepertoireEntryCommand
from campfire.application.use_cases import RegisterRepertoireEntry
from campfire.domain.exceptions import DuplicateRepertoireEntryError, UserNotFoundError
from campfire.domain.models.user import User
from campfire.infrastructure.persistence.memory import (
    InMemoryRepertoireRepository,
    InMemorySongRepository,
    InMemoryUserRepository,
)


def _build() -> tuple[RegisterRepertoireEntry, User]:
    users = InMemoryUserRepository()
    songs = InMemorySongRepository()
    repertoire = InMemoryRepertoireRepository()
    alice = User(email="alice@example.com", display_name="Alice")
    users.add(alice)
    return RegisterRepertoireEntry(users=users, songs=songs, repertoire=repertoire), alice


def test_register_returns_view_with_label() -> None:
    uc, alice = _build()
    view = uc.execute(
        RegisterRepertoireEntryCommand(
            user_id=alice.id,
            song_title="Black",
            song_artist="Pearl Jam",
            instrument_name="Guitar",
            proficiency_score=8,
        )
    )
    assert view.instrument == "guitar"
    assert view.proficiency_score == 8
    assert view.proficiency_label == "advanced"


def test_same_song_different_instrument_allowed() -> None:
    uc, alice = _build()
    uc.execute(
        RegisterRepertoireEntryCommand(
            user_id=alice.id,
            song_title="Black",
            song_artist="Pearl Jam",
            instrument_name="guitar",
            proficiency_score=6,
        )
    )
    uc.execute(
        RegisterRepertoireEntryCommand(
            user_id=alice.id,
            song_title="Black",
            song_artist="Pearl Jam",
            instrument_name="vocals",
            proficiency_score=5,
        )
    )


def test_duplicate_triple_rejected() -> None:
    uc, alice = _build()
    cmd = RegisterRepertoireEntryCommand(
        user_id=alice.id,
        song_title="Black",
        song_artist="Pearl Jam",
        instrument_name="guitar",
        proficiency_score=7,
    )
    uc.execute(cmd)
    with pytest.raises(DuplicateRepertoireEntryError):
        uc.execute(cmd)


def test_unknown_user_rejected() -> None:
    uc, _ = _build()
    from uuid import uuid4

    with pytest.raises(UserNotFoundError):
        uc.execute(
            RegisterRepertoireEntryCommand(
                user_id=uuid4(),
                song_title="Black",
                song_artist="Pearl Jam",
                instrument_name="guitar",
                proficiency_score=5,
            )
        )


def test_invalid_proficiency_rejected() -> None:
    uc, alice = _build()
    with pytest.raises(ValueError):
        uc.execute(
            RegisterRepertoireEntryCommand(
                user_id=alice.id,
                song_title="Black",
                song_artist="Pearl Jam",
                instrument_name="guitar",
                proficiency_score=42,
            )
        )
