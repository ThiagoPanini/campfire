from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from campfire_api import __version__
from campfire_api.contexts.identity.adapters.http.error_mapping import (
    register_identity_error_handlers,
)
from campfire_api.contexts.identity.adapters.http.routers import auth, google_stub, health, me
from campfire_api.settings import SettingsProvider, get_settings_provider
from campfire_api.shared.logging import configure_logging
from campfire_api.shared.request_id import RequestIdMiddleware


def create_app(settings: SettingsProvider | None = None) -> FastAPI:
    provider = settings or get_settings_provider()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        await configure_logging(await provider.log_level())
        yield

    app = FastAPI(title="Campfire API", version=__version__, lifespan=lifespan)
    app.state.settings_provider = provider

    app.add_middleware(RequestIdMiddleware)

    # Starlette middleware must be registered during construction. Settings are
    # env-backed in v1, so this synchronous unwrap is safe for app assembly.
    import asyncio

    try:
        asyncio.get_running_loop()
        origins = ["http://localhost:5173"]
    except RuntimeError:
        origins = list(asyncio.run(provider.cors_origins()))
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Request-Id"],
    )

    register_identity_error_handlers(app)
    app.include_router(health.router)
    app.include_router(auth.router)
    app.include_router(google_stub.router)
    app.include_router(me.router)
    return app


app = create_app()
