"""Use case: given the users present at a gathering, list what they can play."""

from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from uuid import UUID

from campfire.application.dto import PossibleSongView
from campfire.domain.exceptions import SongNotFoundError
from campfire.domain.repositories import RepertoireRepository, SongRepository
from campfire.domain.services import PossibleRepertoireService


@dataclass(frozen=True, slots=True)
class ListPossibleRepertoire:
    songs: SongRepository
    repertoire: RepertoireRepository
    service: PossibleRepertoireService

    def execute(self, present_user_ids: Iterable[UUID]) -> list[PossibleSongView]:
        present = list(present_user_ids)
        entries = self.repertoire.list_for_users(present)
        possible = self.service.compute(present, entries)

        views: list[PossibleSongView] = []
        for item in possible:
            song = self.songs.get(item.song_id)
            if song is None:
                raise SongNotFoundError(str(item.song_id))
            views.append(
                PossibleSongView(
                    song_id=song.id,
                    song_title=song.title,
                    song_artist=song.artist,
                    supporters=item.supporters,
                )
            )
        return views
