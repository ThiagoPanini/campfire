from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from campfire_api.contexts.identity.application.errors import (
    EmailAlreadyRegistered,
    GoogleStubDisabled,
    IdentityError,
    InvalidCredentials,
    RateLimited,
    RefreshTokenInvalid,
    RefreshTokenReused,
    SessionRevokedError,
    UnknownCatalogId,
)


def identity_error_response(exc: IdentityError) -> JSONResponse:
    headers: dict[str, str] = {}
    status = 500
    message = "request failed"
    auth_error_types = (
        InvalidCredentials,
        RefreshTokenInvalid,
        RefreshTokenReused,
        SessionRevokedError,
    )
    if isinstance(exc, auth_error_types):
        status = 401
        message = "invalid credentials"
    elif isinstance(exc, EmailAlreadyRegistered):
        status = 409
        message = "email already registered"
    elif isinstance(exc, UnknownCatalogId):
        status = 422
        message = "unknown catalog id"
    elif isinstance(exc, RateLimited):
        status = 429
        message = "too many attempts"
        headers["Retry-After"] = str(exc.retry_after)
    elif isinstance(exc, GoogleStubDisabled):
        status = 503
        message = "google sign-in unavailable"
    return JSONResponse(status_code=status, content={"message": message}, headers=headers)


def register_identity_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(IdentityError)
    async def _handle_identity_error(_request: Request, exc: IdentityError) -> JSONResponse:
        return identity_error_response(exc)
