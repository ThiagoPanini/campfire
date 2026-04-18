"""Application-layer DTOs. Intentionally decoupled from HTTP schemas."""

from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID


@dataclass(frozen=True, slots=True)
class RegisterRepertoireEntryCommand:
    user_id: UUID
    song_title: str
    song_artist: str
    instrument_name: str


@dataclass(frozen=True, slots=True)
class RepertoireEntryView:
    entry_id: UUID
    user_id: UUID
    song_id: UUID
    song_title: str
    song_artist: str
    instrument: str


@dataclass(frozen=True, slots=True)
class PossibleSongView:
    song_id: UUID
    song_title: str
    song_artist: str
    supporters: dict[UUID, tuple[str, ...]]
