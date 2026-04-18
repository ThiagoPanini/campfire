"""Use case: list one user's declared repertoire."""

from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from campfire.application.dto import RepertoireEntryView
from campfire.domain.exceptions import SongNotFoundError, UserNotFoundError
from campfire.domain.repositories import RepertoireRepository, SongRepository, UserRepository


@dataclass(frozen=True, slots=True)
class ListUserRepertoire:
    users: UserRepository
    songs: SongRepository
    repertoire: RepertoireRepository

    def execute(self, user_id: UUID) -> list[RepertoireEntryView]:
        if self.users.get(user_id) is None:
            raise UserNotFoundError(str(user_id))

        views: list[RepertoireEntryView] = []
        for entry in self.repertoire.list_for_user(user_id):
            song = self.songs.get(entry.song_id)
            if song is None:
                raise SongNotFoundError(str(entry.song_id))
            views.append(
                RepertoireEntryView(
                    entry_id=entry.id,
                    user_id=entry.user_id,
                    song_id=song.id,
                    song_title=song.title,
                    song_artist=song.artist,
                    instrument=entry.instrument.name,
                )
            )
        return views
