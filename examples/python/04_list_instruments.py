"""List (and optionally filter) instrument suggestions."""

from __future__ import annotations

import sys

from common import client, pretty


def main() -> None:
    params: dict[str, str | int] = {"limit": 50}
    if len(sys.argv) > 1:
        params["query"] = sys.argv[1]
    with client() as http:
        pretty(http.get("/api/v1/instruments", params=params))


if __name__ == "__main__":
    main()
