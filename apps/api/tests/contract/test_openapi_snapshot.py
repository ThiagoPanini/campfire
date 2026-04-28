import json
from pathlib import Path

import pytest

from campfire_api.main import create_app

pytestmark = pytest.mark.contract


def test_openapi_snapshot_matches() -> None:
    snapshot = (
        Path(__file__).resolve().parents[4] / "specs/002-backend-auth-slice/contracts/openapi.json"
    )
    openapi = create_app().openapi()
    assert json.loads(snapshot.read_text()) == openapi
    assert "/me/preferences" not in openapi["paths"]
    schemas = openapi.get("components", {}).get("schemas", {})
    assert "PreferencesPayload" not in schemas
