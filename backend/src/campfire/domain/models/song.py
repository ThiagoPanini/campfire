"""Song entity."""

from __future__ import annotations

from dataclasses import dataclass, field
from uuid import UUID, uuid4


@dataclass(frozen=True, slots=True)
class Song:
    """A song known to the group.

    Identified by (title, artist) for now — the business context leaves
    standardization open. A catalog-backed identifier can replace this
    without touching the domain's public contract.
    """

    id: UUID = field(default_factory=uuid4)
    title: str = ""
    artist: str = ""

    def __post_init__(self) -> None:
        if not self.title.strip():
            raise ValueError("song title must not be empty")
        if not self.artist.strip():
            raise ValueError("song artist must not be empty")
