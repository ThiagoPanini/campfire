from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import StrEnum


class ExperienceLevel(StrEnum):
    BEGINNER = "beginner"
    LEARNING = "learning"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class PlayContext(StrEnum):
    FRIENDS = "friends"
    AMATEUR = "amateur"
    PRO = "pro"
    SOLO = "solo"
    CHURCH = "church"
    SESSIONS = "sessions"


ALLOWED_INSTRUMENTS: frozenset[str] = frozenset({
    "Guitar", "Bass", "Drums", "Piano / Keys", "Vocals",
    "Violin", "Cavaquinho", "Ukulele", "Cajón", "Mandolin", "Flute", "Other",
})

ALLOWED_GENRES: frozenset[str] = frozenset({
    "Rock", "MPB", "Samba", "Jazz", "Forró", "Bossa Nova",
    "Pop", "Blues", "Country", "Metal", "Reggae", "Funk", "Other",
})

ALLOWED_GOALS: frozenset[str] = frozenset({
    "Learn new songs faster",
    "Track my full repertoire",
    "Share my set with the group",
    "Prepare for jam sessions",
    "Practice more consistently",
    "Know what I can already play",
})


class InvalidPreferencesError(ValueError):
    """Raised when submitted onboarding preferences violate the contract."""


@dataclass(frozen=True)
class UserPreferences:
    """Captured during onboarding; drives downstream repertoire surfacing."""

    user_id: str
    instruments: tuple[str, ...]
    genres: tuple[str, ...]
    play_context: PlayContext | None
    goals: tuple[str, ...]
    experience_level: ExperienceLevel | None
    updated_at: datetime = field(default_factory=lambda: datetime.now(UTC))

    @classmethod
    def from_submission(
        cls,
        *,
        user_id: str,
        instruments: list[str],
        genres: list[str],
        play_context: str | None,
        goals: list[str],
        experience_level: str | None,
        now: datetime | None = None,
    ) -> UserPreferences:
        _validate_subset("instruments", instruments, ALLOWED_INSTRUMENTS)
        _validate_subset("genres", genres, ALLOWED_GENRES)
        _validate_subset("goals", goals, ALLOWED_GOALS)

        resolved_context = _coerce_enum("playContext", play_context, PlayContext)
        resolved_xp = _coerce_enum("experienceLevel", experience_level, ExperienceLevel)

        return cls(
            user_id=user_id,
            instruments=tuple(dict.fromkeys(instruments)),
            genres=tuple(dict.fromkeys(genres)),
            play_context=resolved_context,
            goals=tuple(dict.fromkeys(goals)),
            experience_level=resolved_xp,
            updated_at=now or datetime.now(UTC),
        )


def _validate_subset(field_name: str, values: list[str], allowed: frozenset[str]) -> None:
    unknown = [value for value in values if value not in allowed]
    if unknown:
        raise InvalidPreferencesError(
            f"{field_name} contains unsupported values: {sorted(unknown)}"
        )


def _coerce_enum(field_name: str, value: str | None, enum_cls: type[StrEnum]) -> StrEnum | None:
    if value is None or value == "":
        return None
    try:
        return enum_cls(value)
    except ValueError as error:
        raise InvalidPreferencesError(f"{field_name} is not a supported value.") from error
