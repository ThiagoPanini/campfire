"""List the seeded demo users (Alice, Bob) and print their ids.

Needs CAMPFIRE_USER_ID set to *any* seeded user id. The easy bootstrap:
hit /docs in a browser, run GET /api/v1/users with any uuid, note the 401
error, then call this script once you have grabbed a real id from Swagger.
"""

from __future__ import annotations

from common import client, pretty


def main() -> None:
    with client() as http:
        pretty(http.get("/api/v1/users"))


if __name__ == "__main__":
    main()
