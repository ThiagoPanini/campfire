"""RepertoireEntry — a user's declared musical knowledge."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from uuid import UUID, uuid4

from campfire.domain.models.instrument import Instrument


@dataclass(frozen=True, slots=True)
class RepertoireEntry:
    """Declares that ``user_id`` can play ``song_id`` on ``instrument``.

    This is the central domain concept ('declared musical knowledge' in the
    business document). Uniqueness is enforced on (user_id, song_id, instrument)
    so the same user can declare the same song on multiple instruments.
    """

    user_id: UUID
    song_id: UUID
    instrument: Instrument
    id: UUID = field(default_factory=uuid4)
    declared_at: datetime = field(default_factory=lambda: datetime.now(UTC))
