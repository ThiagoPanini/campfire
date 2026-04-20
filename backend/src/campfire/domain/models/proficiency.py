"""Proficiency value object — how well a user plays a song on an instrument."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

ProficiencyLabel = Literal["beginner", "intermediate", "advanced", "expert"]


@dataclass(frozen=True, slots=True)
class Proficiency:
    """Integer score 0..10 with a derived category label.

    Bands: 0-3 beginner, 4-7 intermediate, 8-9 advanced, 10 expert.
    Validation and categorization live here so callers (use cases, routers)
    never branch on raw ints.
    """

    score: int

    def __post_init__(self) -> None:
        if not isinstance(self.score, int) or isinstance(self.score, bool):
            raise ValueError("proficiency score must be an int")
        if self.score < 0 or self.score > 10:
            raise ValueError("proficiency score must be between 0 and 10")

    @property
    def label(self) -> ProficiencyLabel:
        if self.score <= 3:
            return "beginner"
        if self.score <= 7:
            return "intermediate"
        if self.score <= 9:
            return "advanced"
        return "expert"
