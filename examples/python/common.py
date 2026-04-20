"""Shared helpers for the Campfire example scripts.

Every script imports ``BASE_URL`` and ``USER_ID`` from here and builds a
small :class:`httpx.Client` with the placeholder auth header pre-attached.
"""

from __future__ import annotations

import os
import sys

import httpx

BASE_URL = os.environ.get("CAMPFIRE_BASE_URL", "http://localhost:8000")
USER_ID = os.environ.get("CAMPFIRE_USER_ID")


def client(require_auth: bool = True) -> httpx.Client:
    if require_auth and not USER_ID:
        sys.stderr.write(
            "CAMPFIRE_USER_ID is not set.\n"
            "1. Start the backend.\n"
            "2. Run the 02_list_users.py script (authenticated with any seeded id).\n"
            "3. Export one of the returned ids as CAMPFIRE_USER_ID.\n"
        )
        sys.exit(2)

    headers = {"X-User-Id": USER_ID} if USER_ID else {}
    return httpx.Client(base_url=BASE_URL, headers=headers, timeout=10.0)


def pretty(response: httpx.Response) -> None:
    print(f"{response.request.method} {response.request.url} -> {response.status_code}")
    try:
        import json

        print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    except ValueError:
        print(response.text)
