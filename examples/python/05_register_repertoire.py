"""Register a (song, instrument, proficiency) entry for the current user.

Defaults to Alice's stock example: Black / Pearl Jam / guitar / 8.
Duplicate submissions return 409; invalid payloads return 422.
"""

from __future__ import annotations

from common import client, pretty

PAYLOAD = {
    "song_title": "Black",
    "song_artist": "Pearl Jam",
    "instrument": "guitar",
    "proficiency": 8,
}


def main() -> None:
    with client() as http:
        pretty(http.post("/api/v1/repertoire", json=PAYLOAD))


if __name__ == "__main__":
    main()
