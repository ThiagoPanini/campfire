"""Search songs by substring of title or artist."""

from __future__ import annotations

import sys

from common import client, pretty


def main() -> None:
    query = sys.argv[1] if len(sys.argv) > 1 else "beatles"
    with client() as http:
        pretty(http.get("/api/v1/songs/search", params={"q": query}))


if __name__ == "__main__":
    main()
