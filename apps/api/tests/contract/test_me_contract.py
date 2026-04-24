from __future__ import annotations

import json

import main.handler as handler_module
from domain.user.models import AuthenticationIdentityLink, LocalUser, OnboardingStatus


class FakeRepository:
    def __init__(self) -> None:
        self.users_by_email: dict[str, LocalUser] = {}
        self.links: dict[tuple[str, str], str] = {}

    def get_by_provider_identity(self, provider_name: str, provider_subject: str) -> LocalUser | None:
        user_id = self.links.get((provider_name, provider_subject))
        if user_id is None:
            return None
        return next((user for user in self.users_by_email.values() if user.user_id == user_id), None)

    def get_by_email(self, email_normalized: str) -> LocalUser | None:
        return self.users_by_email.get(email_normalized)

    def create(self, user: LocalUser) -> LocalUser:
        self.users_by_email[user.email_normalized] = user
        return user

    def create_identity_link(self, link: AuthenticationIdentityLink) -> None:
        self.links[(link.provider_name, link.provider_subject)] = link.user_id

    def update(self, user: LocalUser) -> LocalUser:
        self.users_by_email[user.email_normalized] = user
        return user

    def update_onboarding_state(self, user_id: str, status: OnboardingStatus) -> LocalUser:
        user = next(user for user in self.users_by_email.values() if user.user_id == user_id)
        updated = user.complete_onboarding() if status == OnboardingStatus.COMPLETED else user.defer_onboarding()
        return self.update(updated)


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
    assert payload["onboarding"]["status"] == "required"


def test_me_contract_extended_fields(monkeypatch) -> None:
    """Extended /me response includes auth, onboarding, methods, and firstLogin fields."""
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
                            "sub": "ext-sub-123",
                            "email": "extended@example.com",
                            "email_verified": "true",
                            "name": "Extended User",
                        }
                    }
                },
            },
        },
        None,
    )

    payload = json.loads(response["body"])

    assert response["statusCode"] == 200
    # user block
    assert "id" in payload["user"]
    assert payload["user"]["email"] == "extended@example.com"
    assert payload["user"]["displayName"] == "Extended User"
    assert payload["user"]["status"] == "active"
    assert "lastLoginAt" in payload["user"]
    # auth block
    assert payload["auth"]["email"] == "extended@example.com"
    assert payload["auth"]["emailVerified"] is True
    # onboarding block
    assert payload["onboarding"]["status"] == "required"
    assert payload["onboarding"]["completedAt"] is None
    assert payload["onboarding"]["deferredAt"] is None
    # top-level fields
    assert payload["firstLogin"] is True
    assert payload["bootstrap"]["firstLogin"] is True


def test_me_contract_returns_401_without_authorizer(monkeypatch) -> None:
    """Requests without a JWT authorizer block return 401."""
    repository = FakeRepository()
    monkeypatch.setattr(handler_module, "_repository", lambda settings: repository)

    response = handler_module.lambda_handler(
        {
            "rawPath": "/me",
            "requestContext": {
                "http": {"method": "GET"},
            },
        },
        None,
    )

    assert response["statusCode"] == 401


def test_me_contract_returning_user_has_completed_onboarding_fields(monkeypatch) -> None:
    """For a returning user, /me returns the onboarding state needed for home routing."""
    repository = FakeRepository()
    monkeypatch.setattr(handler_module, "_repository", lambda settings: repository)

    # Bootstrap first login
    handler_module.lambda_handler(
        {
            "rawPath": "/me",
            "requestContext": {
                "http": {"method": "GET"},
                "authorizer": {
                    "jwt": {
                        "claims": {
                            "sub": "returning-sub",
                            "email": "returning@example.com",
                            "email_verified": "true",
                            "name": "Returning User",
                        }
                    }
                },
            },
        },
        None,
    )

    # Second request (returning)
    response = handler_module.lambda_handler(
        {
            "rawPath": "/me",
            "requestContext": {
                "http": {"method": "GET"},
                "authorizer": {
                    "jwt": {
                        "claims": {
                            "sub": "returning-sub",
                            "email": "returning@example.com",
                            "email_verified": "true",
                            "name": "Returning User",
                        }
                    }
                },
            },
        },
        None,
    )

    payload = json.loads(response["body"])

    assert response["statusCode"] == 200
    assert payload["firstLogin"] is False
    assert payload["bootstrap"]["firstLogin"] is False
    assert payload["onboarding"]["status"] in ("required", "completed", "deferred")
    assert "completedAt" in payload["onboarding"]
    assert "deferredAt" in payload["onboarding"]


def test_me_contract_returns_401_for_unverified_email(monkeypatch) -> None:
    """Requests with email_verified=false are rejected as 401."""
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
                            "sub": "unverified-sub",
                            "email": "unverified@example.com",
                            "email_verified": "false",
                            "name": "Unverified User",
                        }
                    }
                },
            },
        },
        None,
    )

    assert response["statusCode"] == 401
