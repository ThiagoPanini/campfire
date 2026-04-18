"""Composition root — wires concrete adapters into the application layer.

Kept deliberately small. Swap an implementation here (e.g. SQL repositories)
without touching the domain or the interface layer.
"""

from __future__ import annotations

from dataclasses import dataclass

from campfire.application.use_cases import (
    ListPossibleRepertoire,
    ListUserRepertoire,
    ListUsers,
    RegisterRepertoireEntry,
)
from campfire.domain.models.user import User
from campfire.domain.services import PossibleRepertoireService
from campfire.infrastructure.auth import PlaceholderAuthenticator
from campfire.infrastructure.persistence.memory import (
    InMemoryRepertoireRepository,
    InMemorySongRepository,
    InMemoryUserRepository,
)


@dataclass(slots=True)
class Container:
    users: InMemoryUserRepository
    songs: InMemorySongRepository
    repertoire: InMemoryRepertoireRepository
    authenticator: PlaceholderAuthenticator
    register_repertoire_entry: RegisterRepertoireEntry
    list_user_repertoire: ListUserRepertoire
    list_possible_repertoire: ListPossibleRepertoire
    list_users: ListUsers


def build_container() -> Container:
    users = InMemoryUserRepository()
    songs = InMemorySongRepository()
    repertoire = InMemoryRepertoireRepository()

    # Seed a couple of authorized users so the scaffold is demoable.
    # Remove once real auth + an admin onboarding flow land.
    users.add(User(email="alice@example.com", display_name="Alice"))
    users.add(User(email="bob@example.com", display_name="Bob"))

    return Container(
        users=users,
        songs=songs,
        repertoire=repertoire,
        authenticator=PlaceholderAuthenticator(users=users),
        register_repertoire_entry=RegisterRepertoireEntry(
            users=users, songs=songs, repertoire=repertoire
        ),
        list_user_repertoire=ListUserRepertoire(
            users=users, songs=songs, repertoire=repertoire
        ),
        list_possible_repertoire=ListPossibleRepertoire(
            songs=songs,
            repertoire=repertoire,
            service=PossibleRepertoireService(),
        ),
        list_users=ListUsers(users=users),
    )
