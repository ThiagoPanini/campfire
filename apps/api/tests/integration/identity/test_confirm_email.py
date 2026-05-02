import re
from pathlib import Path

import pytest

pytestmark = pytest.mark.integration


def latest_code() -> str:
    files = list(Path("tmp/mail").glob("*confirmation.txt")) + list(
        Path("apps/api/tmp/mail").glob("*confirmation.txt")
    )
    assert files
    body = max(files, key=lambda path: path.stat().st_mtime).read_text()
    match = re.search(r"\b(\d{6})\b", body)
    assert match
    return match.group(1)


async def test_confirm_email_full_flow(client) -> None:
    await client.post(
        "/auth/register",
        json={"email": "new@campfire.test", "password": "Campfire123!"},
    )
    response = await client.post(
        "/auth/confirm",
        json={"email": "new@campfire.test", "code": latest_code()},
    )
    assert response.status_code == 200
    assert response.json()["accessToken"]
    assert "campfire_refresh" in response.headers["set-cookie"]

    me = await client.get(
        "/me",
        headers={"Authorization": f"Bearer {response.json()['accessToken']}"},
    )
    assert me.status_code == 200
    assert me.json()["email"] == "new@campfire.test"
