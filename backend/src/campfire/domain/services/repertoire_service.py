"""Domain service: compute the repertoire playable by a set of present users."""

from __future__ import annotations

from collections import defaultdict
from collections.abc import Iterable
from dataclasses import dataclass
from uuid import UUID

from campfire.domain.models.repertoire_entry import RepertoireEntry


@dataclass(frozen=True, slots=True)
class PossibleSong:
    """A song that can be played by the currently-present users.

    ``supporters`` maps each present user_id to the instruments they declared
    for the song, so the interface can explain *why* the song is viable.
    """

    song_id: UUID
    supporters: dict[UUID, tuple[str, ...]]


class PossibleRepertoireService:
    """Pure computation — no I/O. Kept in the domain layer because the rule
    ('a song is viable iff at least one present user declared it') is a
    business definition, not an application concern."""

    def compute(
        self,
        present_user_ids: Iterable[UUID],
        entries: Iterable[RepertoireEntry],
    ) -> list[PossibleSong]:
        present = set(present_user_ids)
        if not present:
            return []

        by_song: dict[UUID, dict[UUID, list[str]]] = defaultdict(lambda: defaultdict(list))
        for entry in entries:
            if entry.user_id not in present:
                continue
            by_song[entry.song_id][entry.user_id].append(entry.instrument.name)

        return [
            PossibleSong(
                song_id=song_id,
                supporters={uid: tuple(instruments) for uid, instruments in supporters.items()},
            )
            for song_id, supporters in by_song.items()
        ]
