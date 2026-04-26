from contextvars import ContextVar
from uuid import uuid4

from starlette.types import ASGIApp, Receive, Scope, Send

try:
    from uuid_utils import uuid7
except ImportError:  # pragma: no cover
    uuid7 = None

_request_id: ContextVar[str | None] = ContextVar("request_id", default=None)


def new_uuid() -> str:
    return str(uuid7() if uuid7 else uuid4())


def get_request_id() -> str | None:
    return _request_id.get()


class RequestIdMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = {key.lower(): value for key, value in scope.get("headers", [])}
        request_id = headers.get(b"x-request-id", new_uuid().encode()).decode()
        token = _request_id.set(request_id)

        async def send_with_request_id(message: dict) -> None:
            if message["type"] == "http.response.start":
                message.setdefault("headers", []).append((b"x-request-id", request_id.encode()))
            await send(message)

        try:
            await self.app(scope, receive, send_with_request_id)
        finally:
            _request_id.reset(token)
