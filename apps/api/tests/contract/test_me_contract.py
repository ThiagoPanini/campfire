from __future__ import annotations

import json

import main.handler as handler_module
from domain.user.models import LocalUser


class FakeRepository:
    def __init__(self) -> None:
        self.users: dict[tuple[str, str], LocalUser] = {}

    def get_by_provider_identity(self, provider_name: str, provider_subject: str) -> LocalUser | None:
        return self.users.get((provider_name, provider_subject))

    def create(self, user: LocalUser) -> LocalUser:
        self.users[(user.provider_name, user.provider_subject)] = user
        return user

    def update(self, user: LocalUser) -> LocalUser:
        self.users[(user.provider_name, user.provider_subject)] = user
        return user


def test_me_contract(monkeypatch) -> None:
    repository = FakeRepository()
    monkeypatch.setattr(handler_module, "_repository", lambda settings: repository)

    response = handler_module.lambda_handler(
        {
            "rawPath": "/me",
            "requestContext": {
                "http": {"method": "GET"},
                "authorizer": {
                    "jwt": {
                        "claims": {
                            "sub": "abc123",
                            "email": "ash@example.com",
                            "email_verified": "true",
                            "name": "Ash Rivera",
                        }
                    }
                },
            },
        },
        None,
    )

    payload = json.loads(response["body"])

    assert response["statusCode"] == 200
    assert payload["user"]["email"] == "ash@example.com"
    assert payload["bootstrap"]["firstLogin"] is True
