from __future__ import annotations

from fastapi import APIRouter

from campfire.interfaces.api.v1 import health, instruments, repertoire, songs, users

api_v1_router = APIRouter(prefix="/v1")
api_v1_router.include_router(health.router)
api_v1_router.include_router(users.router)
api_v1_router.include_router(songs.router)
api_v1_router.include_router(instruments.router)
api_v1_router.include_router(repertoire.router)
