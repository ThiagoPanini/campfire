from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from domain.user.models import OnboardingStatus
from domain.user.repository import LocalUserRepository


def defer_onboarding_response(
    user_id: str,
    body: Mapping[str, object],
    repository: LocalUserRepository,
) -> dict[str, Any]:
    """Persist explicit onboarding deferral and return the public state."""

    status = body.get("status")
    if status != OnboardingStatus.DEFERRED.value:
        raise ValueError("Only onboarding deferral is supported by this endpoint.")

    user = repository.update_onboarding_state(user_id, OnboardingStatus.DEFERRED)
    return {
        "onboarding": {
            "status": user.onboarding_status.value,
            "completedAt": (
                user.onboarding_completed_at.isoformat()
                if user.onboarding_completed_at
                else None
            ),
            "deferredAt": (
                user.onboarding_deferred_at.isoformat()
                if user.onboarding_deferred_at
                else None
            ),
        }
    }
