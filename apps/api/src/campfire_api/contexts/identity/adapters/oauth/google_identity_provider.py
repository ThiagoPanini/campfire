from __future__ import annotations

from typing import Any

import httpx
from google.auth.transport import requests
from google.oauth2 import id_token

from campfire_api.contexts.identity.application.errors import GoogleSignInFailed
from campfire_api.contexts.identity.domain.entities import GoogleIdentity
from campfire_api.contexts.identity.domain.value_objects import DisplayName, Email, ProviderSubject


class GoogleOAuthIdentityProvider:
    def __init__(self, *, client_id: str, client_secret: str) -> None:
        self.client_id = client_id
        self.client_secret = client_secret

    async def exchange_code(
        self, *, code: str, code_verifier: str, redirect_uri: str
    ) -> GoogleIdentity:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(
                    "https://oauth2.googleapis.com/token",
                    data={
                        "code": code,
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "redirect_uri": redirect_uri,
                        "grant_type": "authorization_code",
                        "code_verifier": code_verifier,
                    },
                )
            response.raise_for_status()
            token = response.json()["id_token"]
            claims: dict[str, Any] = id_token.verify_oauth2_token(
                token, requests.Request(), self.client_id, clock_skew_in_seconds=10
            )
            return GoogleIdentity(
                subject=ProviderSubject(str(claims["sub"])),
                email=Email(str(claims["email"])),
                display_name=DisplayName(str(claims.get("name") or claims["email"]).strip()),
                nonce=str(claims.get("nonce") or ""),
                email_verified=claims.get("email_verified") is True,
            )
        except Exception as exc:
            raise GoogleSignInFailed() from exc
