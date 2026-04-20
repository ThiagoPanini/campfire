"""Health check — confirm the backend is alive. No auth required."""

from __future__ import annotations

from common import client, pretty


def main() -> None:
    with client(require_auth=False) as http:
        pretty(http.get("/api/v1/health"))


if __name__ == "__main__":
    main()
