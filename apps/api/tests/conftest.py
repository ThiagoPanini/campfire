from __future__ import annotations

import os
import sys
from pathlib import Path
from urllib.error import URLError
from urllib.request import urlopen

import pytest
import boto3

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"

if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))


@pytest.fixture(scope="session")
def localstack_ready() -> str:
    endpoint = os.environ.get("DYNAMODB_ENDPOINT_URL", "http://localhost:4566")
    health_url = f"{endpoint.rstrip('/')}/_localstack/health"

    try:
        with urlopen(health_url, timeout=3) as response:
            if response.status >= 400:
                raise RuntimeError(f"unexpected status {response.status}")
        return endpoint
    except (OSError, URLError, RuntimeError):
        pass

    try:
        boto3.client(
            "dynamodb",
            endpoint_url=endpoint,
            region_name="us-east-1",
            aws_access_key_id="campfire-local",
            aws_secret_access_key="campfire-local",
            aws_session_token="campfire-local",
        ).list_tables(Limit=1)
    except Exception as exc:  # pragma: no cover - exercised from real integration environments
        pytest.fail(f"Local AWS emulator is unavailable at {endpoint}. Run `make up` before integration or contract tests. ({exc})")

    return endpoint
