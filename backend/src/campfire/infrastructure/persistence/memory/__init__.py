"""In-memory repository implementations.

These exist so the scaffold is runnable and testable end-to-end without
committing to a database technology yet. A SQL-backed implementation can
be introduced later alongside these without changing any domain or
application code, because both satisfy the same Protocol contracts.
"""

from campfire.infrastructure.persistence.memory.repertoire_repository import (
    InMemoryRepertoireRepository,
)
from campfire.infrastructure.persistence.memory.song_repository import InMemorySongRepository
from campfire.infrastructure.persistence.memory.user_repository import InMemoryUserRepository

__all__ = [
    "InMemoryRepertoireRepository",
    "InMemorySongRepository",
    "InMemoryUserRepository",
]
