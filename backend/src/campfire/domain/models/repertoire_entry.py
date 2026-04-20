"""RepertoireEntry — a user's declared musical knowledge with proficiency."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from uuid import UUID, uuid4

from campfire.domain.models.instrument import Instrument
from campfire.domain.models.proficiency import Proficiency


@dataclass(frozen=True, slots=True)
class RepertoireEntry:
    """Declares that ``user_id`` can play ``song_id`` on ``instrument``
    at the given ``proficiency``.

    Uniqueness is enforced on (user_id, song_id, instrument) — same song on
    a different instrument is allowed. Re-registering the same triple raises
    ``DuplicateRepertoireEntryError``.
    """

    user_id: UUID
    song_id: UUID
    instrument: Instrument
    proficiency: Proficiency
    id: UUID = field(default_factory=uuid4)
    declared_at: datetime = field(default_factory=lambda: datetime.now(UTC))
