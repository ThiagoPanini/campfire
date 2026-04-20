"""Composition root — wires concrete adapters into the application layer.

Kept deliberately small. Swap an implementation here (SQL repositories, an
external song-search provider, real auth) without touching the domain or
the interface layer.
"""

from __future__ import annotations

from dataclasses import dataclass

from campfire.application.use_cases import (
    ListUserRepertoire,
    ListUsers,
    RegisterRepertoireEntry,
    SearchInstruments,
    SearchSongs,
)
from campfire.domain.models.user import User
from campfire.infrastructure.auth import PlaceholderAuthenticator
from campfire.infrastructure.persistence.memory import (
    InMemoryInstrumentCatalog,
    InMemoryRepertoireRepository,
    InMemorySongRepository,
    InMemorySongSearchProvider,
    InMemoryUserRepository,
)


@dataclass(slots=True)
class Container:
    users: InMemoryUserRepository
    songs: InMemorySongRepository
    repertoire: InMemoryRepertoireRepository
    song_search: InMemorySongSearchProvider
    instruments: InMemoryInstrumentCatalog
    authenticator: PlaceholderAuthenticator
    register_repertoire_entry: RegisterRepertoireEntry
    list_user_repertoire: ListUserRepertoire
    list_users: ListUsers
    search_songs: SearchSongs
    search_instruments: SearchInstruments


def build_container() -> Container:
    users = InMemoryUserRepository()
    songs = InMemorySongRepository()
    repertoire = InMemoryRepertoireRepository()
    song_search = InMemorySongSearchProvider()
    instruments = InMemoryInstrumentCatalog()

    # Seed a couple of authorized users so the scaffold is demoable.
    # Remove once real auth + an admin onboarding flow land.
    users.add(User(email="alice@example.com", display_name="Alice"))
    users.add(User(email="bob@example.com", display_name="Bob"))

    return Container(
        users=users,
        songs=songs,
        repertoire=repertoire,
        song_search=song_search,
        instruments=instruments,
        authenticator=PlaceholderAuthenticator(users=users),
        register_repertoire_entry=RegisterRepertoireEntry(
            users=users, songs=songs, repertoire=repertoire
        ),
        list_user_repertoire=ListUserRepertoire(
            users=users, songs=songs, repertoire=repertoire
        ),
        list_users=ListUsers(users=users),
        search_songs=SearchSongs(provider=song_search),
        search_instruments=SearchInstruments(catalog=instruments),
    )
