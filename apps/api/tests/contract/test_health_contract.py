from __future__ import annotations

import json

from main.handler import lambda_handler


def test_health_contract() -> None:
    response = lambda_handler(
        {
            "rawPath": "/health",
            "requestContext": {"http": {"method": "GET"}},
        },
        None,
    )

    payload = json.loads(response["body"])

    assert response["statusCode"] == 200
    assert payload["status"] == "ok"
    assert payload["service"] == "campfire-api"
    assert "timestamp" in payload
