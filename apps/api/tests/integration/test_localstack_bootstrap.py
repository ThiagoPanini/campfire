from __future__ import annotations

import json
from urllib.request import urlopen

import boto3


def test_localstack_bootstrap_resources_exist(localstack_ready: str) -> None:
    session = boto3.session.Session(
        aws_access_key_id="campfire-local",
        aws_secret_access_key="campfire-local",
        aws_session_token="campfire-local",
        region_name="us-east-1",
    )

    dynamodb = session.client("dynamodb", endpoint_url=localstack_ready)
    ssm = session.client("ssm", endpoint_url=localstack_ready)
    s3 = session.client("s3", endpoint_url=localstack_ready)

    tables = dynamodb.list_tables()["TableNames"]
    params = ssm.get_parameters_by_path(Path="/campfire/local", Recursive=True)["Parameters"]
    buckets = [bucket["Name"] for bucket in s3.list_buckets()["Buckets"]]

    assert "campfire-local-users" in tables
    assert any(param["Name"].startswith("/campfire/local/") for param in params)
    assert "campfire-local-artifacts" in buckets

    try:
        with urlopen(f"{localstack_ready}/_localstack/health", timeout=3) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except OSError:
        payload = None

    if payload is not None:
        healthy_states = {"running", "available"}
        for service in ("dynamodb", "sts", "ssm", "secretsmanager", "s3", "logs"):
            assert payload["services"][service] in healthy_states
