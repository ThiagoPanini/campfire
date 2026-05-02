from types import SimpleNamespace

import pytest

from campfire_api.contexts.identity.adapters.http.deps import client_ip
from campfire_api.settings import EnvSettings, EnvSettingsProvider

pytestmark = pytest.mark.unit


def request(peer: str = "127.0.0.1", xff: str | None = None):
    headers = {}
    if xff is not None:
        headers["x-forwarded-for"] = xff
    return SimpleNamespace(client=SimpleNamespace(host=peer), headers=headers)


def settings(value: str = "") -> EnvSettingsProvider:
    return EnvSettingsProvider(EnvSettings(TRUSTED_PROXIES=value))


def test_client_ip_uses_direct_peer_without_forwarded_header() -> None:
    assert client_ip(request("203.0.113.10"), settings()) == "203.0.113.10"


def test_client_ip_ignores_xff_when_trusted_proxies_empty() -> None:
    assert client_ip(request("127.0.0.1", "203.0.113.10"), settings()) == "127.0.0.1"


def test_client_ip_uses_rightmost_untrusted_hop_from_trusted_peer() -> None:
    assert (
        client_ip(
            request("127.0.0.1", "203.0.113.10, 10.0.0.5"),
            settings("127.0.0.1/32,10.0.0.0/8"),
        )
        == "203.0.113.10"
    )


def test_client_ip_ignores_xff_from_untrusted_peer() -> None:
    assert (
        client_ip(request("198.51.100.9", "203.0.113.10"), settings("127.0.0.1/32"))
        == "198.51.100.9"
    )


def test_client_ip_falls_back_on_malformed_xff() -> None:
    assert client_ip(request("127.0.0.1", "not-an-ip"), settings("127.0.0.1/32")) == "127.0.0.1"


def test_client_ip_falls_back_when_all_hops_trusted() -> None:
    assert (
        client_ip(
            request("127.0.0.1", "10.0.0.5, 10.0.0.6"),
            settings("127.0.0.1/32,10.0.0.0/8"),
        )
        == "127.0.0.1"
    )
