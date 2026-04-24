from __future__ import annotations

import logging
from collections import Counter

SENSITIVE_FIELD_NAMES = {"authorization", "code", "email", "password", "token"}


class Observability:
    """Small metrics/logger helper for auth-bootstrap flows."""

    def __init__(self, logger: logging.Logger) -> None:
        self._logger = logger
        self._metrics: Counter[str] = Counter()

    def record_event(self, name: str, **fields: object) -> None:
        """Increment an application metric and write a structured log line."""

        self._metrics[name] += 1
        safe_fields = {
            key: "[redacted]" if key.lower() in SENSITIVE_FIELD_NAMES else value
            for key, value in fields.items()
        }
        payload = " ".join(f"{key}={value}" for key, value in safe_fields.items())
        self._logger.info("event=%s %s", name, payload)

    def snapshot(self) -> dict[str, int]:
        """Return the in-memory metric counts for tests."""

        return dict(self._metrics)
