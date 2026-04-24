from __future__ import annotations

import json

import main.handler as handler_module
from domain.preferences.models import UserPreferences
from domain.user.models import AuthenticationIdentityLink, LocalUser, OnboardingStatus


# ---------------------------------------------------------------------------
# Fake repositories wired via monkeypatch
# ---------------------------------------------------------------------------


class FakeUserRepository:
    def __init__(self) -> None:
        self.users_by_email: dict[str, LocalUser] = {}
        self.links: dict[tuple[str, str], str] = {}

    def get_by_provider_identity(self, provider_name: str, provider_subject: str) -> LocalUser | None:
        user_id = self.links.get((provider_name, provider_subject))
        if user_id is None:
            return None
        return next((u for u in self.users_by_email.values() if u.user_id == user_id), None)

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
        user = next(u for u in self.users_by_email.values() if u.user_id == user_id)
        updated = user.complete_onboarding() if status == OnboardingStatus.COMPLETED else user.defer_onboarding()
        return self.update(updated)


class FakePreferencesRepository:
    def __init__(self) -> None:
        self.prefs: dict[str, UserPreferences] = {}

    def get(self, user_id: str) -> UserPreferences | None:
        return self.prefs.get(user_id)

    def put(self, preferences: UserPreferences) -> UserPreferences:
        self.prefs[preferences.user_id] = preferences
        return preferences


def _me_event(sub: str, email: str = "pref@example.com", email_verified: str = "true") -> dict:
    return {
        "rawPath": "/me",
        "requestContext": {
            "http": {"method": "GET"},
            "authorizer": {
                "jwt": {
                    "claims": {
                        "sub": sub,
                        "email": email,
                        "email_verified": email_verified,
                        "name": "Pref User",
                    }
                }
            },
        },
    }


def _preferences_get_event(sub: str, email: str = "pref@example.com") -> dict:
    return {
        "rawPath": "/me/preferences",
        "requestContext": {
            "http": {"method": "GET"},
            "authorizer": {
                "jwt": {
                    "claims": {
                        "sub": sub,
                        "email": email,
                        "email_verified": "true",
                        "name": "Pref User",
                    }
                }
            },
        },
    }


def _preferences_put_event(sub: str, body: dict, email: str = "pref@example.com") -> dict:
    return {
        "rawPath": "/me/preferences",
        "requestContext": {
            "http": {"method": "PUT"},
            "authorizer": {
                "jwt": {
                    "claims": {
                        "sub": sub,
                        "email": email,
                        "email_verified": "true",
                        "name": "Pref User",
                    }
                }
            },
        },
        "body": json.dumps(body),
    }


def _onboarding_patch_event(sub: str, body: dict, email: str = "pref@example.com") -> dict:
    return {
        "rawPath": "/me/onboarding",
        "requestContext": {
            "http": {"method": "PATCH"},
            "authorizer": {
                "jwt": {
                    "claims": {
                        "sub": sub,
                        "email": email,
                        "email_verified": "true",
                        "name": "Pref User",
                    }
                }
            },
        },
        "body": json.dumps(body),
    }


# ---------------------------------------------------------------------------
# GET /me/preferences
# ---------------------------------------------------------------------------


def test_get_preferences_returns_404_when_no_preferences_exist(monkeypatch) -> None:
    user_repo = FakeUserRepository()
    pref_repo = FakePreferencesRepository()
    monkeypatch.setattr(handler_module, "_repository", lambda s: user_repo)
    monkeypatch.setattr(handler_module, "_preferences_repository", lambda s: pref_repo)
    monkeypatch.setattr(handler_module, "_user_repository", lambda s: user_repo)

    # Bootstrap user first
    handler_module.lambda_handler(_me_event("get-pref-sub"), None)

    response = handler_module.lambda_handler(_preferences_get_event("get-pref-sub"), None)
    assert response["statusCode"] == 404


def test_get_preferences_returns_401_without_auth(monkeypatch) -> None:
    user_repo = FakeUserRepository()
    pref_repo = FakePreferencesRepository()
    monkeypatch.setattr(handler_module, "_repository", lambda s: user_repo)
    monkeypatch.setattr(handler_module, "_preferences_repository", lambda s: pref_repo)
    monkeypatch.setattr(handler_module, "_user_repository", lambda s: user_repo)

    response = handler_module.lambda_handler(
        {"rawPath": "/me/preferences", "requestContext": {"http": {"method": "GET"}}},
        None,
    )
    assert response["statusCode"] == 401


# ---------------------------------------------------------------------------
# PUT /me/preferences
# ---------------------------------------------------------------------------


def test_put_preferences_saves_and_returns_200(monkeypatch) -> None:
    user_repo = FakeUserRepository()
    pref_repo = FakePreferencesRepository()
    monkeypatch.setattr(handler_module, "_repository", lambda s: user_repo)
    monkeypatch.setattr(handler_module, "_preferences_repository", lambda s: pref_repo)
    monkeypatch.setattr(handler_module, "_user_repository", lambda s: user_repo)

    handler_module.lambda_handler(_me_event("put-pref-sub", "putpref@example.com"), None)

    response = handler_module.lambda_handler(
        _preferences_put_event(
            "put-pref-sub",
            {"instruments": ["Guitar"], "genres": ["Rock"], "playContext": "friends", "goals": [], "experienceLevel": "learning"},
            "putpref@example.com",
        ),
        None,
    )

    assert response["statusCode"] == 200
    payload = json.loads(response["body"])
    assert payload["instruments"] == ["Guitar"]


def test_put_preferences_returns_400_for_invalid_instrument(monkeypatch) -> None:
    user_repo = FakeUserRepository()
    pref_repo = FakePreferencesRepository()
    monkeypatch.setattr(handler_module, "_repository", lambda s: user_repo)
    monkeypatch.setattr(handler_module, "_preferences_repository", lambda s: pref_repo)
    monkeypatch.setattr(handler_module, "_user_repository", lambda s: user_repo)

    handler_module.lambda_handler(_me_event("invalid-pref-sub", "invalid@example.com"), None)

    response = handler_module.lambda_handler(
        _preferences_put_event(
            "invalid-pref-sub",
            {"instruments": ["Theremin"], "genres": [], "playContext": None, "goals": [], "experienceLevel": None},
            "invalid@example.com",
        ),
        None,
    )

    assert response["statusCode"] == 400


# ---------------------------------------------------------------------------
# PATCH /me/onboarding
# ---------------------------------------------------------------------------


def test_patch_onboarding_defer_returns_200(monkeypatch) -> None:
    user_repo = FakeUserRepository()
    pref_repo = FakePreferencesRepository()
    monkeypatch.setattr(handler_module, "_repository", lambda s: user_repo)
    monkeypatch.setattr(handler_module, "_preferences_repository", lambda s: pref_repo)
    monkeypatch.setattr(handler_module, "_user_repository", lambda s: user_repo)

    handler_module.lambda_handler(_me_event("defer-onboarding-sub", "defer@example.com"), None)

    response = handler_module.lambda_handler(
        _onboarding_patch_event("defer-onboarding-sub", {"status": "deferred"}, "defer@example.com"),
        None,
    )

    assert response["statusCode"] == 200
    payload = json.loads(response["body"])
    assert payload["onboarding"]["status"] == "deferred"


def test_patch_onboarding_returns_401_without_auth(monkeypatch) -> None:
    user_repo = FakeUserRepository()
    monkeypatch.setattr(handler_module, "_repository", lambda s: user_repo)
    monkeypatch.setattr(handler_module, "_user_repository", lambda s: user_repo)

    response = handler_module.lambda_handler(
        {"rawPath": "/me/onboarding", "requestContext": {"http": {"method": "PATCH"}}},
        None,
    )
    assert response["statusCode"] == 401
