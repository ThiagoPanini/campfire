import pytest
from fastapi.testclient import TestClient

from campfire_api.main import create_app
from campfire_api.settings import EnvSettings, EnvSettingsProvider

pytestmark = pytest.mark.unit


def provider(**values) -> EnvSettingsProvider:
    defaults = {
        "ENV": "prod",
        "EMAIL_CONFIRMATION_HMAC_KEY": "email-key",
        "OAUTH_FLOW_HMAC_KEY": "oauth-key",
    }
    defaults.update(values)
    return EnvSettingsProvider(EnvSettings(**defaults))


def test_prod_lifespan_requires_email_confirmation_hmac_key() -> None:
    with pytest.raises(RuntimeError, match="EMAIL_CONFIRMATION_HMAC_KEY"):
        with TestClient(create_app(provider(EMAIL_CONFIRMATION_HMAC_KEY=""))):
            pass


def test_prod_lifespan_requires_oauth_flow_hmac_key() -> None:
    with pytest.raises(RuntimeError, match="OAUTH_FLOW_HMAC_KEY"):
        with TestClient(create_app(provider(OAUTH_FLOW_HMAC_KEY=""))):
            pass


def test_lifespan_allows_dev_without_hmac_keys() -> None:
    with TestClient(
        create_app(provider(ENV="dev", EMAIL_CONFIRMATION_HMAC_KEY="", OAUTH_FLOW_HMAC_KEY=""))
    ) as client:
        assert client.get("/healthz").status_code == 200


def test_lifespan_allows_fully_configured_prod() -> None:
    with TestClient(create_app(provider())) as client:
        assert client.get("/healthz").status_code == 200
