from __future__ import annotations

import pytest

from domain.preferences.models import (
    ExperienceLevel,
    InvalidPreferencesError,
    PlayContext,
    UserPreferences,
)


def test_from_submission_coerces_enums_and_dedupes_lists() -> None:
    prefs = UserPreferences.from_submission(
        user_id="user_1",
        instruments=["Guitar", "Guitar", "Vocals"],
        genres=["Rock", "MPB"],
        play_context="friends",
        goals=["Track my full repertoire"],
        experience_level="intermediate",
    )

    assert prefs.instruments == ("Guitar", "Vocals")
    assert prefs.genres == ("Rock", "MPB")
    assert prefs.play_context is PlayContext.FRIENDS
    assert prefs.experience_level is ExperienceLevel.INTERMEDIATE


def test_from_submission_rejects_unknown_instrument() -> None:
    with pytest.raises(InvalidPreferencesError):
        UserPreferences.from_submission(
            user_id="user_1",
            instruments=["Theremin"],
            genres=[],
            play_context=None,
            goals=[],
            experience_level=None,
        )


def test_from_submission_allows_empty_submission() -> None:
    prefs = UserPreferences.from_submission(
        user_id="user_1",
        instruments=[],
        genres=[],
        play_context=None,
        goals=[],
        experience_level=None,
    )

    assert prefs.instruments == ()
    assert prefs.play_context is None
    assert prefs.experience_level is None


def test_from_submission_rejects_unknown_experience_level() -> None:
    with pytest.raises(InvalidPreferencesError):
        UserPreferences.from_submission(
            user_id="user_1",
            instruments=[],
            genres=[],
            play_context=None,
            goals=[],
            experience_level="wizard",
        )


def test_from_submission_rejects_unknown_genre() -> None:
    with pytest.raises(InvalidPreferencesError):
        UserPreferences.from_submission(
            user_id="user_1",
            instruments=[],
            genres=["Jazz-Fusion-Experimental"],
            play_context=None,
            goals=[],
            experience_level=None,
        )


def test_from_submission_rejects_unknown_goal() -> None:
    with pytest.raises(InvalidPreferencesError):
        UserPreferences.from_submission(
            user_id="user_1",
            instruments=[],
            genres=[],
            play_context=None,
            goals=["Become a rock star"],
            experience_level=None,
        )


def test_from_submission_rejects_unknown_play_context() -> None:
    with pytest.raises(InvalidPreferencesError):
        UserPreferences.from_submission(
            user_id="user_1",
            instruments=[],
            genres=[],
            play_context="strangers",
            goals=[],
            experience_level=None,
        )


def test_from_submission_partial_save_is_allowed() -> None:
    prefs = UserPreferences.from_submission(
        user_id="user_1",
        instruments=["Guitar"],
        genres=[],
        play_context=None,
        goals=[],
        experience_level=None,
    )

    assert prefs.instruments == ("Guitar",)
    assert prefs.genres == ()
    assert prefs.play_context is None
    assert prefs.experience_level is None


def test_from_submission_deduplicates_instruments() -> None:
    prefs = UserPreferences.from_submission(
        user_id="user_1",
        instruments=["Guitar", "Guitar", "Bass"],
        genres=[],
        play_context=None,
        goals=[],
        experience_level=None,
    )

    assert prefs.instruments == ("Guitar", "Bass")


def test_from_submission_preserves_insertion_order_after_dedup() -> None:
    prefs = UserPreferences.from_submission(
        user_id="user_1",
        instruments=["Bass", "Guitar", "Bass"],
        genres=[],
        play_context=None,
        goals=[],
        experience_level=None,
    )

    assert prefs.instruments == ("Bass", "Guitar")
