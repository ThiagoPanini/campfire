from __future__ import annotations

import pytest

from campfire.domain.models.proficiency import Proficiency


@pytest.mark.parametrize(
    ("score", "label"),
    [
        (0, "beginner"),
        (3, "beginner"),
        (4, "intermediate"),
        (7, "intermediate"),
        (8, "advanced"),
        (9, "advanced"),
        (10, "expert"),
    ],
)
def test_proficiency_labels(score: int, label: str) -> None:
    assert Proficiency(score).label == label


@pytest.mark.parametrize("score", [-1, 11, 100])
def test_proficiency_rejects_out_of_range(score: int) -> None:
    with pytest.raises(ValueError):
        Proficiency(score)


def test_proficiency_rejects_bool() -> None:
    with pytest.raises(ValueError):
        Proficiency(True)  # type: ignore[arg-type]
