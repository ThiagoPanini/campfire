import json
from pathlib import Path

import pytest

from campfire_api.main import create_app

pytestmark = pytest.mark.contract


def test_openapi_snapshot_matches() -> None:
    snapshot = (
        Path(__file__).resolve().parents[4] / "specs/002-backend-auth-slice/contracts/openapi.json"
    )
    assert json.loads(snapshot.read_text()) == create_app().openapi()
