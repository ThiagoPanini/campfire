from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class RepertoireEntry:
    id: UUID
    user_id: UUID
    song_external_id: str
    song_title: str
    song_artist: str
    song_album: str | None
    song_release_year: int | None
    song_cover_art_url: str | None
    instrument: str
    proficiency: str
    created_at: datetime
    updated_at: datetime

    def __post_init__(self) -> None:
        title = self.song_title.strip()
        artist = self.song_artist.strip()
        if not 1 <= len(title) <= 256:
            raise ValueError(f"song_title must be 1–256 chars after strip, got {len(title)}")
        if not 1 <= len(artist) <= 256:
            raise ValueError(f"song_artist must be 1–256 chars after strip, got {len(artist)}")
        if self.song_release_year is not None and not (1900 <= self.song_release_year <= 2100):
            raise ValueError(f"song_release_year must be 1900–2100, got {self.song_release_year}")
        self.song_title = title
        self.song_artist = artist


@dataclass(frozen=True)
class SearchResult:
    external_id: str
    title: str
    artist: str
    album: str | None
    release_year: int | None
    cover_art_url: str | None
