from __future__ import annotations

import hmac
from dataclasses import dataclass
from uuid import UUID

from campfire_api.contexts.identity.application.errors import GoogleSignInFailed
from campfire_api.contexts.identity.application.use_cases.issue_session import IssueSession
from campfire_api.contexts.identity.application.use_cases.session_tokens import IssuedSession
from campfire_api.contexts.identity.application.use_cases.start_google_sign_in import _hmac
from campfire_api.contexts.identity.domain.entities import (
    ProviderLink,
    User,
    display_name_from_email,
)
from campfire_api.contexts.identity.domain.ports import (
    Clock,
    CredentialsRepository,
    EmailConfirmationRepository,
    EmailSender,
    GoogleIdentityProvider,
    OAuthFlowStateRepository,
    ProviderLinkRepository,
    RefreshTokenRepository,
    SessionRepository,
    TokenIssuer,
    UserRepository,
)
from campfire_api.contexts.identity.domain.value_objects import UserId
from campfire_api.settings import SettingsProvider


@dataclass(frozen=True)
class GoogleCompletion:
    session: IssuedSession
    return_to: str | None


@dataclass
class CompleteGoogleSignIn:
    flows: OAuthFlowStateRepository
    provider_links: ProviderLinkRepository
    email_confirmations: EmailConfirmationRepository
    users: UserRepository
    credentials: CredentialsRepository
    email_sender: EmailSender
    google: GoogleIdentityProvider
    sessions: SessionRepository
    refresh_tokens: RefreshTokenRepository
    token_issuer: TokenIssuer
    settings: SettingsProvider
    clock: Clock

    async def __call__(self, *, code: str, query_state: str, state_cookie: str) -> GoogleCompletion:
        flow_id, state_secret = self._parse_cookie(state_cookie)
        if str(flow_id.value) != query_state:
            raise GoogleSignInFailed()
        hmac_key = await self.settings.oauth_flow_hmac_key()
        redirect_uri = await self.settings.google_oauth_redirect_uri()
        if not hmac_key or not redirect_uri:
            raise GoogleSignInFailed()
        flow = await self.flows.consume_atomic(flow_id, reason="completed", now=self.clock.now())
        if flow is None or not hmac.compare_digest(
            _hmac(hmac_key, state_secret), flow.state_token_hash
        ):
            raise GoogleSignInFailed()
        identity = await self.google.exchange_code(
            code=code, code_verifier=flow.pkce_verifier, redirect_uri=redirect_uri
        )
        if not identity.email_verified or not hmac.compare_digest(
            _hmac(hmac_key, identity.nonce), flow.nonce_hash
        ):
            raise GoogleSignInFailed()

        link = await self.provider_links.get("google", identity.subject)
        if link:
            user = await self.users.get_by_id(link.user_id)
            if not user:
                raise GoogleSignInFailed()
        else:
            user = await self.users.get_by_email(identity.email)
            now = self.clock.now()
            if user is None:
                display_name = identity.display_name
                if not display_name.value:
                    display_name = display_name_from_email(identity.email)
                user = User(
                    id=UserId.new(),
                    email=identity.email,
                    display_name=display_name,
                    created_at=now,
                    updated_at=now,
                    email_confirmed_at=now,
                )
                await self.users.add(user)
            elif user.email_confirmed_at is None:
                await self.email_confirmations.invalidate_pending_for(
                    user.id, reason="upgraded_by_google", now=now
                )
                user.email_confirmed_at = now
                user.updated_at = now
                await self.users.update(user)
                await self.credentials.delete_for_user(user.id)
                await self.email_sender.send_google_promotion_notice(user.email, "en")
            await self.provider_links.add(
                ProviderLink(
                    id=UserId.new(),
                    user_id=user.id,
                    provider="google",
                    subject=identity.subject,
                    email_at_link=identity.email,
                    created_at=now,
                    updated_at=now,
                )
            )
        session = await IssueSession(
            sessions=self.sessions,
            refresh_tokens=self.refresh_tokens,
            token_issuer=self.token_issuer,
            clock=self.clock,
            access_ttl_seconds=await self.settings.access_token_ttl_seconds(),
        )(user.id)
        return GoogleCompletion(session=session, return_to=flow.return_to)

    def _parse_cookie(self, value: str) -> tuple[UserId, str]:
        try:
            raw_id, secret = value.split(".", 1)
            return UserId(UUID(raw_id)), secret
        except Exception as exc:
            raise GoogleSignInFailed() from exc
