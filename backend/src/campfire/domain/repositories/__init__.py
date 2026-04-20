"""Repository contracts. Implementations live in infrastructure."""

from campfire.domain.repositories.instrument_catalog import InstrumentCatalog
from campfire.domain.repositories.repertoire_repository import RepertoireRepository
from campfire.domain.repositories.song_repository import SongRepository
from campfire.domain.repositories.song_search_provider import (
    SongSearchProvider,
    SongSearchResult,
)
from campfire.domain.repositories.user_repository import UserRepository

__all__ = [
    "InstrumentCatalog",
    "RepertoireRepository",
    "SongRepository",
    "SongSearchProvider",
    "SongSearchResult",
    "UserRepository",
]
