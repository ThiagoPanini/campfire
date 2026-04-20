"""FastAPI ASGI entrypoint."""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from campfire import __version__
from campfire.config import Settings, get_settings
from campfire.infrastructure.bootstrap import build_container
from campfire.interfaces.api.v1 import api_v1_router


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        app.state.container = build_container()
        yield

    app = FastAPI(
        title="campfire",
        version=__version__,
        description="Private music repertoire portal.",
        lifespan=lifespan,
    )

    if settings.cors_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    app.include_router(api_v1_router, prefix=settings.api_prefix)
    return app


app = create_app()
