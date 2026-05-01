import pytest

from campfire_api.contexts.identity.application.use_cases.start_google_sign_in import sanitize_next

pytestmark = pytest.mark.unit


@pytest.mark.parametrize("value", ["/repertoire", "/home?x=1"])
def test_sanitize_next_accepts_safe_paths(value: str) -> None:
    assert sanitize_next(value) == value


@pytest.mark.parametrize(
    "value",
    ["//evil.com", "https://evil.com", "javascript:alert(1)", "/x://evil", "", None],
)
def test_sanitize_next_rejects_unsafe_paths(value: str | None) -> None:
    assert sanitize_next(value) is None
