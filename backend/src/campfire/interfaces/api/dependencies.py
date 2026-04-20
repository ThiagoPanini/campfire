"""FastAPI DI wiring.

The container is attached to ``app.state`` at startup (see ``main.py``) so
requests pull a single shared instance rather than constructing adapters
per-call.
"""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import Depends, Header, HTTPException, Request, status

from campfire.domain.exceptions import NotAuthorizedUserError
from campfire.domain.models.user import User
from campfire.infrastructure.bootstrap import Container


def get_container(request: Request) -> Container:
    container: Container = request.app.state.container
    return container


ContainerDep = Annotated[Container, Depends(get_container)]


def get_current_user(
    container: ContainerDep,
    x_user_id: Annotated[UUID | None, Header(alias="X-User-Id")] = None,
) -> User:
    try:
        return container.authenticator.authenticate(x_user_id)
    except NotAuthorizedUserError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc) or "not authorized",
        ) from exc


CurrentUser = Annotated[User, Depends(get_current_user)]
