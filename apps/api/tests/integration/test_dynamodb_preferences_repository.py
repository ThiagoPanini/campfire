from __future__ import annotations

from uuid import uuid4

import boto3
import pytest
from moto.server import ThreadedMotoServer

from application.preferences.service import GetUserPreferences, SaveUserPreferences, UpdateOnboardingState
from application.user_context.service import GetOrBootstrapLocalUser
from domain.user.models import OnboardingStatus, VerifiedIdentityClaims
from infrastructure.persistence.local_preferences_repository import DynamoDbUserPreferencesRepository
from infrastructure.persistence.local_user_repository import DynamoDbLocalUserRepository
from main.local_dynamodb import ensure_local_users_table
from main.settings import load_settings


@pytest.fixture()
def local_dynamodb(monkeypatch):
    server = ThreadedMotoServer(port=0)
    server.start()
    _host, port = server.get_host_and_port()

    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "campfire-local")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "campfire-local")
    monkeypatch.setenv("AWS_SESSION_TOKEN", "campfire-local")
    monkeypatch.setenv("AWS_EC2_METADATA_DISABLED", "true")
    monkeypatch.setenv("AWS_REGION", "us-east-1")
    monkeypatch.setenv("DYNAMODB_ENDPOINT_URL", f"http://localhost:{port}")
    monkeypatch.setenv("LOCAL_USERS_TABLE", f"campfire-local-users-{uuid4().hex}")

    ensure_local_users_table(load_settings())
    yield
    server.stop()


def _make_table(settings):
    return boto3.resource(
        "dynamodb",
        endpoint_url=settings.dynamodb_endpoint_url,
        region_name=settings.aws_region,
    ).Table(settings.local_users_table)


def _bootstrap_user(settings, provider_subject: str, email: str):
    table = _make_table(settings)
    repository = DynamoDbLocalUserRepository(table)
    service = GetOrBootstrapLocalUser(repository=repository)
    claims = VerifiedIdentityClaims(
        provider_name="cognito",
        provider_subject=provider_subject,
        email=email,
        email_verified=True,
        display_name="Test User",
    )
    result = service.execute(claims)
    return result.user, DynamoDbUserPreferencesRepository(table), repository


def test_preferences_are_persisted_and_retrieved(local_dynamodb) -> None:
    settings = load_settings()
    user, pref_repo, _ = _bootstrap_user(settings, "pref-sub-1", "prefs@example.com")

    save_service = SaveUserPreferences(repository=pref_repo)
    saved = save_service.execute(
        user_id=user.user_id,
        instruments=["Guitar"],
        genres=["Rock"],
        play_context="friends",
        goals=[],
        experience_level="learning",
    )

    get_service = GetUserPreferences(repository=pref_repo)
    retrieved = get_service.execute(user.user_id)

    assert retrieved is not None
    assert retrieved.instruments == saved.instruments
    assert retrieved.play_context == saved.play_context


def test_get_preferences_returns_none_when_not_saved(local_dynamodb) -> None:
    settings = load_settings()
    user, pref_repo, _ = _bootstrap_user(settings, "pref-sub-none", "none@example.com")

    get_service = GetUserPreferences(repository=pref_repo)
    result = get_service.execute(user.user_id)

    assert result is None


def test_preferences_save_updates_onboarding_status(local_dynamodb) -> None:
    settings = load_settings()
    user, pref_repo, user_repo = _bootstrap_user(settings, "pref-sub-onboarding", "onboarding@example.com")

    assert user.onboarding_status is OnboardingStatus.REQUIRED

    SaveUserPreferences(repository=pref_repo).execute(
        user_id=user.user_id,
        instruments=["Guitar"],
        genres=[],
        play_context=None,
        goals=[],
        experience_level=None,
    )
    UpdateOnboardingState(repository=user_repo).complete(user.user_id)

    updated_user = user_repo.get_by_email(user.email_normalized)
    assert updated_user is not None
    assert updated_user.onboarding_status is OnboardingStatus.COMPLETED


def test_preferences_override_on_second_put(local_dynamodb) -> None:
    settings = load_settings()
    user, pref_repo, _ = _bootstrap_user(settings, "pref-sub-update", "update@example.com")
    save_service = SaveUserPreferences(repository=pref_repo)

    save_service.execute(
        user_id=user.user_id,
        instruments=["Guitar"],
        genres=["Rock"],
        play_context="friends",
        goals=[],
        experience_level=None,
    )
    save_service.execute(
        user_id=user.user_id,
        instruments=["Piano"],
        genres=["Classical"],
        play_context="solo",
        goals=[],
        experience_level="learning",
    )

    get_service = GetUserPreferences(repository=pref_repo)
    result = get_service.execute(user.user_id)

    assert result is not None
    assert result.instruments == ("Piano",)
    assert result.genres == ("Classical",)
