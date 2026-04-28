from fastapi import Header, HTTPException, Request


async def require_refresh_cookie(
    request: Request, authorization: str | None = Header(default=None)
) -> str:
    settings = request.app.state.settings_provider
    cookie_name = await settings.refresh_cookie_name()
    refresh_token = request.cookies.get(cookie_name)
    if not refresh_token:
        raise HTTPException(status_code=401, detail={"message": "invalid credentials"})
    if authorization is not None and not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail={"message": "invalid credentials"})
    return refresh_token
