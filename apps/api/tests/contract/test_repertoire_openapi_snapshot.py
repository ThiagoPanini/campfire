import json
from pathlib import Path

import pytest

from campfire_api.main import create_app

pytestmark = pytest.mark.contract

SNAPSHOT_PATH = (
    Path(__file__).resolve().parents[4]
    / "specs/003-repertoire-song-entry/contracts/openapi.json"
)


def test_repertoire_paths_in_live_openapi() -> None:
    snapshot = json.loads(SNAPSHOT_PATH.read_text())
    live = create_app().openapi()

    for path, path_item in snapshot.get("paths", {}).items():
        assert path in live["paths"], f"path {path!r} missing from live OpenAPI"
        for method, operation in path_item.items():
            assert method in live["paths"][path], (
                f"method {method.upper()} for {path!r} missing from live OpenAPI"
            )

    for schema_name in snapshot.get("components", {}).get("schemas", {}):
        assert schema_name in live.get("components", {}).get("schemas", {}), (
            f"schema {schema_name!r} missing from live OpenAPI"
        )
