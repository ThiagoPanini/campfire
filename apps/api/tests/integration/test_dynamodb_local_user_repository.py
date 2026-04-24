from __future__ import annotations

from uuid import uuid4

import boto3
import pytest
from moto.server import ThreadedMotoServer

from application.user_context.service import GetOrBootstrapLocalUser
from domain.user.models import VerifiedIdentityClaims
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


def test_dynamodb_repository_bootstraps_and_reuses_local_user(local_dynamodb) -> None:
    settings = load_settings()
    table = boto3.resource(
        "dynamodb",
        endpoint_url=settings.dynamodb_endpoint_url,
        region_name=settings.aws_region,
    ).Table(settings.local_users_table)
    repository = DynamoDbLocalUserRepository(table)
    service = GetOrBootstrapLocalUser(repository=repository)
    claims = VerifiedIdentityClaims(
        provider_name="cognito",
        provider_subject="subject-1",
        email="ash@example.com",
        email_verified=True,
        display_name="Ash Rivera",
    )

    first_result = service.execute(claims)
    second_result = service.execute(claims)
    stored_items = table.scan()["Items"]

    assert first_result.first_login is True
    assert second_result.first_login is False
    assert first_result.user.user_id == second_result.user.user_id
    assert len(stored_items) == 2
    assert {item["sk"] for item in stored_items} == {"PROFILE", "IDENTITY#cognito#subject-1"}


def _make_table(settings):
    return boto3.resource(
        "dynamodb",
        endpoint_url=settings.dynamodb_endpoint_url,
        region_name=settings.aws_region,
    ).Table(settings.local_users_table)


def test_dynamodb_email_lookup_returns_user(local_dynamodb) -> None:
    settings = load_settings()
    repository = DynamoDbLocalUserRepository(_make_table(settings))
    service = GetOrBootstrapLocalUser(repository=repository)
    claims = VerifiedIdentityClaims(
        provider_name="cognito",
        provider_subject="subject-email-lookup",
        email="lookup@example.com",
        email_verified=True,
        display_name="Lookup User",
    )

    created = service.execute(claims)
    found = repository.get_by_email("lookup@example.com")

    assert found is not None
    assert found.user_id == created.user.user_id


def test_dynamodb_provider_identity_lookup_returns_user(local_dynamodb) -> None:
    settings = load_settings()
    repository = DynamoDbLocalUserRepository(_make_table(settings))
    service = GetOrBootstrapLocalUser(repository=repository)
    claims = VerifiedIdentityClaims(
        provider_name="cognito",
        provider_subject="identity-lookup-sub",
        email="identity@example.com",
        email_verified=True,
        display_name="Identity User",
    )

    created = service.execute(claims)
    found = repository.get_by_provider_identity("cognito", "identity-lookup-sub")

    assert found is not None
    assert found.user_id == created.user.user_id


def test_dynamodb_google_identity_links_to_existing_email_user(local_dynamodb) -> None:
    settings = load_settings()
    repository = DynamoDbLocalUserRepository(_make_table(settings))
    service = GetOrBootstrapLocalUser(repository=repository)

    cognito_claims = VerifiedIdentityClaims(
        provider_name="cognito",
        provider_subject="cognito-sub",
        email="shared@example.com",
        email_verified=True,
        display_name="Shared User",
    )
    google_claims = VerifiedIdentityClaims(
        provider_name="google",
        provider_subject="google-sub",
        email="shared@example.com",
        email_verified=True,
        display_name="Shared User",
    )

    first_result = service.execute(cognito_claims)
    google_result = service.execute(google_claims)

    assert google_result.user.user_id == first_result.user.user_id
    assert google_result.first_login is False

    google_found = repository.get_by_provider_identity("google", "google-sub")
    assert google_found is not None
    assert google_found.user_id == first_result.user.user_id
