"""Use case: a user declares they know how to play a song on an instrument."""

from __future__ import annotations

from dataclasses import dataclass

from campfire.application.dto import RegisterRepertoireEntryCommand, RepertoireEntryView
from campfire.domain.exceptions import DuplicateRepertoireEntryError, UserNotFoundError
from campfire.domain.models.instrument import Instrument
from campfire.domain.models.repertoire_entry import RepertoireEntry
from campfire.domain.models.song import Song
from campfire.domain.repositories import RepertoireRepository, SongRepository, UserRepository


@dataclass(frozen=True, slots=True)
class RegisterRepertoireEntry:
    users: UserRepository
    songs: SongRepository
    repertoire: RepertoireRepository

    def execute(self, command: RegisterRepertoireEntryCommand) -> RepertoireEntryView:
        user = self.users.get(command.user_id)
        if user is None:
            raise UserNotFoundError(str(command.user_id))

        song = self.songs.find_by_title_and_artist(command.song_title, command.song_artist)
        if song is None:
            song = Song(title=command.song_title, artist=command.song_artist)
            self.songs.add(song)

        instrument = Instrument(name=command.instrument_name)

        if self.repertoire.exists(user.id, song.id, instrument.name):
            raise DuplicateRepertoireEntryError(
                f"{user.id} already declared {song.title} on {instrument.name}"
            )

        entry = RepertoireEntry(user_id=user.id, song_id=song.id, instrument=instrument)
        self.repertoire.add(entry)

        return RepertoireEntryView(
            entry_id=entry.id,
            user_id=user.id,
            song_id=song.id,
            song_title=song.title,
            song_artist=song.artist,
            instrument=instrument.name,
        )
