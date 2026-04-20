"""Application-layer DTOs. Intentionally decoupled from HTTP schemas."""

from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from campfire.domain.models.proficiency import ProficiencyLabel


@dataclass(frozen=True, slots=True)
class RegisterRepertoireEntryCommand:
    user_id: UUID
    song_title: str
    song_artist: str
    instrument_name: str
    proficiency_score: int


@dataclass(frozen=True, slots=True)
class RepertoireEntryView:
    entry_id: UUID
    user_id: UUID
    song_id: UUID
    song_title: str
    song_artist: str
    instrument: str
    proficiency_score: int
    proficiency_label: ProficiencyLabel


@dataclass(frozen=True, slots=True)
class SongSearchItemView:
    title: str
    artist: str
    source: str
    external_id: str | None
