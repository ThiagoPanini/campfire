"""User aggregate — member of the authorized campfire group."""

from __future__ import annotations

from dataclasses import dataclass, field
from uuid import UUID, uuid4


@dataclass(frozen=True, slots=True)
class User:
    """An authorized member of the group.

    'Musician' vs 'audience' are treated as behavioral profiles, not fixed roles —
    any user may declare repertoire or only consult it. A dedicated role model can
    be introduced later if the group requires explicit distinctions.
    """

    id: UUID = field(default_factory=uuid4)
    email: str = ""
    display_name: str = ""

    def __post_init__(self) -> None:
        if not self.email:
            raise ValueError("user email must not be empty")
        if not self.display_name:
            raise ValueError("user display_name must not be empty")
