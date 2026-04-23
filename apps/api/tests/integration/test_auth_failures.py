from __future__ import annotations

import json

from main.handler import lambda_handler


def test_me_rejects_missing_authentication() -> None:
    response = lambda_handler(
        {
            "rawPath": "/me",
            "requestContext": {"http": {"method": "GET"}},
        },
        None,
    )

    payload = json.loads(response["body"])

    assert response["statusCode"] == 401
    assert payload["error"] == "unauthorized"
