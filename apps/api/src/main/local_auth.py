from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from os import getenv
from pathlib import Path
from typing import Any

import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from jwt.algorithms import RSAAlgorithm


DEFAULT_KID = "campfire-local-dev"
DEFAULT_ISSUER = "http://localhost:8010"
DEFAULT_TOKEN_LIFETIME_SECONDS = 3600


class LocalTokenVerificationError(Exception):
    """Raised when a local bearer token cannot be trusted."""


@dataclass(frozen=True)
class LocalAuthSettings:
    """Configuration for local JWT signing and verification."""

    issuer: str
    audience: str
    key_id: str
    private_key_path: Path
    jwks_path: Path


def _project_root() -> Path:
    return Path(__file__).resolve().parents[2]


def load_local_auth_settings() -> LocalAuthSettings:
    """Load local JWT settings from the environment."""

    auth_dir = _project_root() / ".local" / "auth"
    default_audience = getenv("USER_POOL_CLIENT_ID", "campfire-web")

    return LocalAuthSettings(
        issuer=getenv("LOCAL_AUTH_ISSUER", DEFAULT_ISSUER),
        audience=getenv("LOCAL_AUTH_AUDIENCE", default_audience),
        key_id=getenv("LOCAL_AUTH_KID", DEFAULT_KID),
        private_key_path=Path(getenv("LOCAL_AUTH_PRIVATE_KEY_PATH", auth_dir / "private-key.pem")).resolve(),
        jwks_path=Path(getenv("LOCAL_AUTH_JWKS_PATH", auth_dir / "jwks.json")).resolve(),
    )


def _write_json(path: Path, payload: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(f"{json.dumps(payload, indent=2)}\n", encoding="utf-8")


def ensure_local_signing_material(settings: LocalAuthSettings, *, force: bool = False) -> None:
    """Create local signing material if it does not exist yet."""

    if settings.private_key_path.exists() and settings.jwks_path.exists() and not force:
        return

    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public_key = private_key.public_key()

    private_key_bytes = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    settings.private_key_path.parent.mkdir(parents=True, exist_ok=True)
    settings.private_key_path.write_bytes(private_key_bytes)

    jwk = json.loads(RSAAlgorithm.to_jwk(public_key))
    jwk.update({"alg": "RS256", "kid": settings.key_id, "use": "sig"})
    _write_json(settings.jwks_path, {"keys": [jwk]})


def load_local_jwks(settings: LocalAuthSettings) -> dict[str, object]:
    """Read the local JWKS document from disk."""

    return json.loads(settings.jwks_path.read_text(encoding="utf-8"))


def issue_access_token(
    settings: LocalAuthSettings,
    *,
    subject: str,
    email: str,
    display_name: str,
    provider_name: str = "cognito",
    email_verified: bool = True,
    lifetime_seconds: int = DEFAULT_TOKEN_LIFETIME_SECONDS,
) -> str:
    """Issue a locally signed access token that mimics the JWT authorizer input."""

    ensure_local_signing_material(settings)
    private_key = settings.private_key_path.read_text(encoding="utf-8")
    now = datetime.now(UTC)

    payload = {
        "aud": settings.audience,
        "email": email,
        "email_verified": email_verified,
        "exp": now + timedelta(seconds=lifetime_seconds),
        "iat": now,
        "iss": settings.issuer,
        "name": display_name,
        "provider": provider_name,
        "sub": subject,
        "token_use": "access",
    }

    return jwt.encode(
        payload,
        private_key,
        algorithm="RS256",
        headers={"kid": settings.key_id, "typ": "JWT"},
    )


def verify_access_token(token: str, settings: LocalAuthSettings) -> dict[str, Any]:
    """Verify a local bearer token and return the trusted claims."""

    try:
        header = jwt.get_unverified_header(token)
    except jwt.PyJWTError as error:
        raise LocalTokenVerificationError("Bearer token header is invalid.") from error

    key_id = str(header.get("kid") or "")
    jwks = load_local_jwks(settings)

    for candidate in jwks.get("keys", []):
        if str(candidate.get("kid")) != key_id:
            continue

        public_key = RSAAlgorithm.from_jwk(json.dumps(candidate))

        try:
            claims = jwt.decode(
                token,
                public_key,
                algorithms=["RS256"],
                audience=settings.audience,
                issuer=settings.issuer,
            )
        except jwt.PyJWTError as error:
            raise LocalTokenVerificationError("Bearer token verification failed.") from error

        return dict(claims)

    raise LocalTokenVerificationError("Bearer token key identifier is unknown.")


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Manage Campfire local JWT auth material.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    ensure_parser = subparsers.add_parser("ensure-material", help="Create local signing material if missing.")
    ensure_parser.add_argument("--force", action="store_true", help="Replace any existing local keys.")

    issue_parser = subparsers.add_parser("issue", help="Issue a local JWT for backend testing.")
    issue_parser.add_argument("--subject", default="local-user-1", help="JWT subject claim.")
    issue_parser.add_argument("--email", default="ash@example.com", help="Email claim.")
    issue_parser.add_argument("--display-name", default="Ash Rivera", help="Display name claim.")
    issue_parser.add_argument("--provider", default="cognito", help="Provider name claim.")
    issue_parser.add_argument(
        "--email-verified",
        choices=("true", "false"),
        default="true",
        help="Whether the issued token should include a verified email claim.",
    )
    issue_parser.add_argument(
        "--lifetime-seconds",
        type=int,
        default=DEFAULT_TOKEN_LIFETIME_SECONDS,
        help="Token lifetime in seconds.",
    )
    return parser


def main() -> None:
    """CLI entry point for Campfire local JWT helpers."""

    parser = _build_parser()
    args = parser.parse_args()
    settings = load_local_auth_settings()

    if args.command == "ensure-material":
        ensure_local_signing_material(settings, force=args.force)
        print(settings.private_key_path)
        return

    if args.command == "issue":
        token = issue_access_token(
            settings,
            subject=args.subject,
            email=args.email,
            display_name=args.display_name,
            provider_name=args.provider,
            email_verified=args.email_verified == "true",
            lifetime_seconds=args.lifetime_seconds,
        )
        print(token)
        return

    parser.error(f"Unsupported command: {args.command}")


if __name__ == "__main__":
    main()
