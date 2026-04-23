from __future__ import annotations

from datetime import UTC, datetime


def health_response(service_name: str) -> dict[str, object]:
    """Return the unauthenticated health contract payload."""

    return {
        "status": "ok",
        "service": service_name,
        "timestamp": datetime.now(UTC).isoformat(),
    }
