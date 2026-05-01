from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
from dataclasses import dataclass
from datetime import timedelta
from urllib.parse import urlencode

from campfire_api.contexts.identity.application.errors import GoogleSignInUnavailable
from campfire_api.contexts.identity.domain.entities import OAuthFlowState
from campfire_api.contexts.identity.domain.ports import Clock, OAuthFlowStateRepository
from campfire_api.settings import SettingsProvider


def sanitize_next(raw: str | None) -> str | None:
    if not raw or not raw.startswith("/") or raw.startswith("//") or "://" in raw:
        return None
    return raw


def _b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


def _hmac(key: str, value: str) -> bytes:
    return hmac.new(key.encode(), value.encode(), hashlib.sha256).digest()


@dataclass(frozen=True)
class GoogleStart:
    authorize_url: str
    state_cookie_value: str


@dataclass
class StartGoogleSignIn:
    flows: OAuthFlowStateRepository
    settings: SettingsProvider
    clock: Clock

    async def __call__(self, *, intent: str, next_path: str | None) -> GoogleStart:
        if not await self.settings.google_enabled():
            raise GoogleSignInUnavailable()
        hmac_key = await self.settings.oauth_flow_hmac_key()
        client_id = await self.settings.google_oauth_client_id()
        redirect_uri = await self.settings.google_oauth_redirect_uri()
        if not hmac_key or not client_id or not redirect_uri:
            raise GoogleSignInUnavailable()

        state_secret = _b64url(secrets.token_bytes(32))
        pkce_verifier = _b64url(secrets.token_bytes(72))
        nonce = _b64url(secrets.token_bytes(32))
        code_challenge = _b64url(hashlib.sha256(pkce_verifier.encode()).digest())
        now = self.clock.now()
        flow = OAuthFlowState.issue(
            state_token_hash=_hmac(hmac_key, state_secret),
            pkce_verifier=pkce_verifier,
            nonce_hash=_hmac(hmac_key, nonce),
            intent=intent,
            return_to=sanitize_next(next_path),
            now=now,
            expires_at=now + timedelta(seconds=await self.settings.oauth_flow_ttl_seconds()),
        )
        await self.flows.add(flow)
        query = urlencode(
            {
                "response_type": "code",
                "client_id": client_id,
                "redirect_uri": redirect_uri,
                "scope": "openid email profile",
                "code_challenge": code_challenge,
                "code_challenge_method": "S256",
                "state": str(flow.id.value),
                "nonce": nonce,
                "prompt": "select_account",
                "access_type": "online",
            }
        )
        return GoogleStart(
            authorize_url=f"https://accounts.google.com/o/oauth2/v2/auth?{query}",
            state_cookie_value=f"{flow.id.value}.{state_secret}",
        )
