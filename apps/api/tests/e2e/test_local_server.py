from __future__ import annotations

import json
import os
import socket
import subprocess
import sys
from pathlib import Path
from time import monotonic, sleep
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from uuid import uuid4

import pytest
from moto.server import ThreadedMotoServer

from main.local_auth import issue_access_token, load_local_auth_settings
from main.local_dynamodb import ensure_local_users_table
from main.settings import load_settings


API_ROOT = Path(__file__).resolve().parents[2]


def _free_port() -> int:
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        return int(probe.getsockname()[1])


def _request_json(url: str, *, token: str | None = None) -> tuple[int, dict[str, object]]:
    request = Request(url, method="GET")

    if token:
        request.add_header("Authorization", f"Bearer {token}")

    try:
        with urlopen(request, timeout=2) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        return error.code, json.loads(error.read().decode("utf-8"))


@pytest.fixture()
def local_backend(tmp_path, monkeypatch):
    dynamodb_server = ThreadedMotoServer(port=0)
    dynamodb_server.start()
    _host, dynamodb_port = dynamodb_server.get_host_and_port()

    api_port = _free_port()
    api_base_url = f"http://127.0.0.1:{api_port}"

    monkeypatch.setenv("APP_ENV", "local-test")
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "campfire-local")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "campfire-local")
    monkeypatch.setenv("AWS_SESSION_TOKEN", "campfire-local")
    monkeypatch.setenv("AWS_EC2_METADATA_DISABLED", "true")
    monkeypatch.setenv("AWS_REGION", "us-east-1")
    monkeypatch.setenv("DYNAMODB_ENDPOINT_URL", f"http://localhost:{dynamodb_port}")
    monkeypatch.setenv("LOCAL_USERS_TABLE", f"campfire-local-users-{uuid4().hex}")
    monkeypatch.setenv("API_BASE_URL", api_base_url)
    monkeypatch.setenv("LOCAL_API_HOST", "127.0.0.1")
    monkeypatch.setenv("LOCAL_API_PORT", str(api_port))
    monkeypatch.setenv("LOCAL_AUTH_ISSUER", api_base_url)
    monkeypatch.setenv("LOCAL_AUTH_PRIVATE_KEY_PATH", str(tmp_path / "auth" / "private-key.pem"))
    monkeypatch.setenv("LOCAL_AUTH_JWKS_PATH", str(tmp_path / "auth" / "jwks.json"))

    ensure_local_users_table(load_settings())

    server_executable = Path(sys.executable).with_name("campfire-local-server")
    process = subprocess.Popen(
        [str(server_executable), "--host", "127.0.0.1", "--port", str(api_port)],
        cwd=str(API_ROOT),
        env=os.environ.copy(),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )

    deadline = monotonic() + 10
    while monotonic() < deadline:
        if process.poll() is not None:
            stderr = process.stderr.read() if process.stderr else ""
            raise RuntimeError(f"Local backend exited early: {stderr}")

        try:
            status, _payload = _request_json(f"{api_base_url}/health")
            if status == 200:
                break
        except Exception:
            sleep(0.2)
    else:
        process.terminate()
        raise RuntimeError("Local backend did not become ready in time.")

    yield api_base_url

    process.terminate()
    process.wait(timeout=5)
    dynamodb_server.stop()


def test_local_server_exercises_health_and_me(local_backend) -> None:
    health_status, health_payload = _request_json(f"{local_backend}/health")
    unauthorized_status, unauthorized_payload = _request_json(f"{local_backend}/me")

    token = issue_access_token(
        load_local_auth_settings(),
        subject="abc123",
        email="ash@example.com",
        display_name="Ash Rivera",
    )

    first_status, first_payload = _request_json(f"{local_backend}/me", token=token)
    second_status, second_payload = _request_json(f"{local_backend}/me", token=token)

    assert health_status == 200
    assert health_payload["status"] == "ok"
    assert unauthorized_status == 401
    assert unauthorized_payload["error"] == "unauthorized"
    assert first_status == 200
    assert first_payload["bootstrap"]["firstLogin"] is True
    assert second_status == 200
    assert second_payload["bootstrap"]["firstLogin"] is False
    assert first_payload["user"]["id"] == second_payload["user"]["id"]
