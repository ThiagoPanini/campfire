import pytest
from httpx import ASGITransport, AsyncClient

from campfire_api.main import create_app
from campfire_api.settings import get_settings_provider


@pytest.mark.unit
async def test_create_app_reads_configured_cors_origin_inside_running_loop(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("CORS_ORIGINS", "https://campfire-web-mvp.onrender.com")
    get_settings_provider.cache_clear()

    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.options(
            "/auth/register",
            headers={
                "Origin": "https://campfire-web-mvp.onrender.com",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == (
        "https://campfire-web-mvp.onrender.com"
    )
    get_settings_provider.cache_clear()
