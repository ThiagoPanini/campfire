"""List every repertoire entry declared by the current user."""

from __future__ import annotations

from common import client, pretty


def main() -> None:
    with client() as http:
        pretty(http.get("/api/v1/repertoire/me"))


if __name__ == "__main__":
    main()
