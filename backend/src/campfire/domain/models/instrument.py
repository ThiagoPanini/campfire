"""Instrument value object."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class Instrument:
    """Normalized instrument name (e.g. 'acoustic guitar', 'vocals').

    Kept as a value object rather than an entity: the group is small, catalog
    governance is informal, and identity is the name itself. A controlled
    catalog can be introduced later by promoting this to an aggregate.
    """

    name: str

    def __post_init__(self) -> None:
        if not self.name or not self.name.strip():
            raise ValueError("instrument name must not be empty")
        object.__setattr__(self, "name", self.name.strip().lower())
