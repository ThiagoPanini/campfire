from __future__ import annotations

from dataclasses import dataclass
from typing import Literal
from uuid import UUID, uuid4

from campfire_api.contexts.repertoire.domain.errors import InstrumentUnknown, ProficiencyUnknown
from campfire_api.shared.catalogs import INSTRUMENTS

try:
    from uuid_utils import uuid7
except ImportError:  # pragma: no cover
    uuid7 = None

PROFICIENCY_LEVELS: frozenset[str] = frozenset({"learning", "practicing", "ready"})


def new_uuid() -> UUID:
    raw = uuid7() if uuid7 else uuid4()
    # uuid_utils.uuid7() returns uuid_utils.UUID, not uuid.UUID — normalize to stdlib UUID
    return UUID(str(raw)) if not isinstance(raw, UUID) else raw


@dataclass(frozen=True)
class RepertoireEntryId:
    value: UUID

    @classmethod
    def new(cls) -> RepertoireEntryId:
        return cls(new_uuid())


@dataclass(frozen=True)
class SongExternalId:
    value: str

    def __post_init__(self) -> None:
        normalized = self.value.strip()
        if not 1 <= len(normalized) <= 128:
            raise ValueError(f"song_external_id must be 1–128 chars, got {len(normalized)}")
        object.__setattr__(self, "value", normalized)


@dataclass(frozen=True)
class Instrument:
    value: str

    def __post_init__(self) -> None:
        if self.value not in INSTRUMENTS:
            raise InstrumentUnknown(self.value)


@dataclass(frozen=True)
class ProficiencyLevel:
    value: Literal["learning", "practicing", "ready"]

    def __post_init__(self) -> None:
        if self.value not in PROFICIENCY_LEVELS:
            raise ProficiencyUnknown(self.value)
