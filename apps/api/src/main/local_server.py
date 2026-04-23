from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from os import getenv
from typing import Any
from urllib.parse import parse_qs, urlsplit

from main.handler import lambda_handler
from main.local_auth import (
    LocalAuthSettings,
    LocalTokenVerificationError,
    ensure_local_signing_material,
    issue_access_token,
    load_local_auth_settings,
    load_local_jwks,
    verify_access_token,
)


@dataclass(frozen=True)
class LocalServerSettings:
    """Configuration for the local HTTP adapter."""

    host: str
    port: int
    allow_origin: str
    auth: LocalAuthSettings


class CampfireLocalHttpServer(ThreadingHTTPServer):
    """Threaded local HTTP server with auth context attached."""

    def __init__(self, server_address: tuple[str, int], handler_class, settings: LocalServerSettings) -> None:
        super().__init__(server_address, handler_class)
        self.settings = settings


class CampfireRequestHandler(BaseHTTPRequestHandler):
    """Translate local HTTP requests into the Lambda event shape."""

    server: CampfireLocalHttpServer
    protocol_version = "HTTP/1.1"

    def do_OPTIONS(self) -> None:  # noqa: N802
        self._write_json(HTTPStatus.NO_CONTENT, {})

    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/.well-known/jwks.json":
            self._write_json(HTTPStatus.OK, load_local_jwks(self.server.settings.auth))
            return

        if self.path.startswith("/_local/token"):
            self._write_json(HTTPStatus.OK, self._issue_local_session())
            return

        claims: dict[str, Any] | None = None

        if self.path == "/me":
            token = self._bearer_token()
            if not token:
                self._write_json(
                    HTTPStatus.UNAUTHORIZED,
                    {"error": "unauthorized", "message": "Bearer token required."},
                )
                return

            try:
                claims = verify_access_token(token, self.server.settings.auth)
            except LocalTokenVerificationError as error:
                self._write_json(HTTPStatus.UNAUTHORIZED, {"error": "unauthorized", "message": str(error)})
                return

        response = lambda_handler(self._event(claims=claims), None)
        self._write_lambda_response(response)

    def log_message(self, format: str, *args: object) -> None:
        return

    def _bearer_token(self) -> str | None:
        auth_header = self.headers.get("Authorization", "").strip()

        if not auth_header.startswith("Bearer "):
            return None

        token = auth_header.removeprefix("Bearer ").strip()
        return token or None

    def _cors_headers(self) -> dict[str, str]:
        return {
            "Access-Control-Allow-Headers": "Authorization, Content-Type",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Origin": self.server.settings.allow_origin,
            "Access-Control-Expose-Headers": "Content-Type",
            "Access-Control-Max-Age": "3600",
        }

    def _issue_local_session(self) -> dict[str, object]:
        query = parse_qs(urlsplit(self.path).query)
        subject = query.get("subject", ["dev-user"])[0]
        email = query.get("email", ["ash@example.com"])[0]
        display_name = query.get("displayName", ["Ash Rivera"])[0]
        lifetime_seconds = int(query.get("lifetimeSeconds", ["3600"])[0])
        expires_at = datetime.now(UTC) + timedelta(seconds=lifetime_seconds)

        return {
            "accessToken": issue_access_token(
                self.server.settings.auth,
                subject=subject,
                email=email,
                display_name=display_name,
                lifetime_seconds=lifetime_seconds,
            ),
            "displayName": display_name,
            "email": email,
            "expiresAt": int(expires_at.timestamp() * 1000),
        }

    def _event(self, *, claims: dict[str, Any] | None) -> dict[str, object]:
        request_context: dict[str, object] = {"http": {"method": self.command}}

        if claims is not None:
            request_context["authorizer"] = {"jwt": {"claims": claims}}

        return {
            "headers": dict(self.headers.items()),
            "rawPath": self.path,
            "requestContext": request_context,
        }

    def _write_json(self, status: HTTPStatus, payload: dict[str, object]) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(int(status))
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Content-Type", "application/json")

        for name, value in self._cors_headers().items():
            self.send_header(name, value)

        self.end_headers()
        self.wfile.write(body)

    def _write_lambda_response(self, response: dict[str, object]) -> None:
        status_code = int(response.get("statusCode", HTTPStatus.INTERNAL_SERVER_ERROR))
        headers = {"Content-Type": "application/json", **self._cors_headers(), **dict(response.get("headers", {}))}
        body_text = str(response.get("body", ""))
        body = body_text.encode("utf-8")

        self.send_response(status_code)

        for name, value in headers.items():
            self.send_header(name, value)

        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def load_local_server_settings() -> LocalServerSettings:
    """Load the local HTTP adapter configuration from the environment."""

    return LocalServerSettings(
        host=getenv("LOCAL_API_HOST", "127.0.0.1"),
        port=int(getenv("LOCAL_API_PORT", "8010")),
        allow_origin=getenv("LOCAL_API_ALLOW_ORIGIN", "*"),
        auth=load_local_auth_settings(),
    )


def serve_local_api(settings: LocalServerSettings) -> None:
    """Run the local backend HTTP server until interrupted."""

    ensure_local_signing_material(settings.auth)
    server = CampfireLocalHttpServer((settings.host, settings.port), CampfireRequestHandler, settings)

    try:
        server.serve_forever()
    except KeyboardInterrupt:  # pragma: no cover - manual shutdown path
        pass
    finally:
        server.server_close()


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run the Campfire backend locally over HTTP.")
    parser.add_argument("--host", default=None, help="Override the local bind host.")
    parser.add_argument("--port", type=int, default=None, help="Override the local bind port.")
    return parser


def main() -> None:
    """CLI entry point for the local backend HTTP server."""

    args = _build_parser().parse_args()
    settings = load_local_server_settings()

    if args.host:
        settings = LocalServerSettings(
            host=args.host,
            port=settings.port,
            allow_origin=settings.allow_origin,
            auth=settings.auth,
        )

    if args.port:
        settings = LocalServerSettings(
            host=settings.host,
            port=args.port,
            allow_origin=settings.allow_origin,
            auth=settings.auth,
        )

    serve_local_api(settings)


if __name__ == "__main__":
    main()
