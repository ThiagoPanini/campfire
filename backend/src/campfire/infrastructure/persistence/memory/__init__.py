"""In-memory repository and provider implementations.

These exist so the scaffold is runnable and testable end-to-end without
committing to a database or an external music provider yet. Future
SQL-backed or network-backed adapters can be introduced alongside these
without changing any domain or application code, because both sides of
each Protocol are kept framework-free.
"""

from campfire.infrastructure.persistence.memory.instrument_catalog import (
    InMemoryInstrumentCatalog,
)
from campfire.infrastructure.persistence.memory.repertoire_repository import (
    InMemoryRepertoireRepository,
)
from campfire.infrastructure.persistence.memory.song_repository import InMemorySongRepository
from campfire.infrastructure.persistence.memory.song_search_provider import (
    InMemorySongSearchProvider,
)
from campfire.infrastructure.persistence.memory.user_repository import InMemoryUserRepository

__all__ = [
    "InMemoryInstrumentCatalog",
    "InMemoryRepertoireRepository",
    "InMemorySongRepository",
    "InMemorySongSearchProvider",
    "InMemoryUserRepository",
]
