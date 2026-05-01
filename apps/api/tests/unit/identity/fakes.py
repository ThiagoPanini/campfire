from __future__ import annotations

import hashlib
from datetime import UTC, datetime, timedelta

from campfire_api.contexts.identity.domain.entities import (
    Credentials,
    EmailConfirmation,
    GoogleIdentity,
    OAuthFlowState,
    ProviderLink,
    RefreshToken,
    Session,
    User,
)
from campfire_api.contexts.identity.domain.value_objects import (
    ConfirmationCode,
    Email,
    ProviderSubject,
    UserId,
)


class FrozenClock:
    def __init__(self) -> None:
        self.value = datetime(2026, 4, 26, tzinfo=UTC)

    def now(self) -> datetime:
        return self.value


class FakeHasher:
    async def hash(self, plaintext: str) -> str:
        return f"hash:{plaintext}"

    async def verify(self, plaintext: str, password_hash: str) -> bool:
        return password_hash == f"hash:{plaintext}"


class FakeTokenIssuer:
    def __init__(self, clock: FrozenClock) -> None:
        self.clock = clock
        self.n = 0

    def fingerprint(self, token: str) -> bytes:
        return hashlib.sha256(token.encode()).digest()

    async def issue_access_token(self):
        self.n += 1
        token = f"access-{self.n}"
        return token, self.fingerprint(token), self.clock.now() + timedelta(minutes=15)

    async def issue_refresh_token(self):
        token = f"refresh-{self.n}"
        return token, self.fingerprint(token), self.clock.now() + timedelta(days=14)


class FakeUsers:
    def __init__(self) -> None:
        self.by_id = {}
        self.by_email = {}

    async def get_by_email(self, email: Email) -> User | None:
        return self.by_email.get(email.value)

    async def get_by_id(self, user_id: UserId) -> User | None:
        return self.by_id.get(user_id.value)

    async def add(self, user: User) -> None:
        self.by_id[user.id.value] = user
        self.by_email[user.email.value] = user

    async def update(self, user: User) -> None:
        await self.add(user)


class FakeCredentials:
    def __init__(self) -> None:
        self.rows = {}

    async def get_by_user_id(self, user_id: UserId) -> Credentials | None:
        return self.rows.get(user_id.value)

    async def add(self, credentials: Credentials) -> None:
        self.rows[credentials.user_id.value] = credentials


class FakeSessions:
    def __init__(self) -> None:
        self.rows = {}

    async def add(self, session: Session) -> None:
        self.rows[session.id.value] = session

    async def get_by_access_fingerprint(self, fingerprint: bytes) -> Session | None:
        return next(
            (row for row in self.rows.values() if row.access_token_fingerprint == fingerprint), None
        )

    async def revoke(self, session_id: object, reason: str, now: datetime) -> None:
        row = self.rows[getattr(session_id, "value", session_id)]
        row.revoked_at = now
        row.revoked_reason = reason

    async def revoke_family(self, family_id: object, reason: str, now: datetime) -> None:
        family = getattr(family_id, "value", family_id)
        for row in self.rows.values():
            if row.family_id.value == family and row.revoked_at is None:
                row.revoked_at = now
                row.revoked_reason = reason


class FakeRefreshTokens:
    def __init__(self) -> None:
        self.rows = {}

    async def add(self, token: RefreshToken) -> None:
        self.rows[token.id.value] = token

    async def get_by_fingerprint(self, fingerprint: bytes) -> RefreshToken | None:
        return next(
            (row for row in self.rows.values() if row.token_fingerprint == fingerprint), None
        )

    async def consume_atomic(self, token_id: object, now: datetime) -> RefreshToken | None:
        row = self.rows[getattr(token_id, "value", token_id)]
        if row.consumed_at is not None:
            return None
        row.consumed_at = now
        return row

    async def revoke_family(self, family_id: object, reason: str, now: datetime) -> None:
        family = getattr(family_id, "value", family_id)
        for row in self.rows.values():
            if row.family_id.value == family and row.revoked_at is None:
                row.revoked_at = now
                row.revoked_reason = reason


class FakeProviderLinkRepository:
    def __init__(self) -> None:
        self.rows: list[ProviderLink] = []

    async def get(self, provider: str, subject: ProviderSubject) -> ProviderLink | None:
        return next(
            (row for row in self.rows if row.provider == provider and row.subject == subject),
            None,
        )

    async def get_for_user(self, user_id: UserId, provider: str) -> ProviderLink | None:
        return next(
            (row for row in self.rows if row.user_id == user_id and row.provider == provider),
            None,
        )

    async def add(self, link: ProviderLink) -> None:
        self.rows.append(link)


class FakeEmailConfirmationRepository:
    def __init__(self, clock: FrozenClock) -> None:
        self.clock = clock
        self.rows: list[EmailConfirmation] = []

    async def get_pending_for_user(self, user_id: UserId) -> EmailConfirmation | None:
        return next(
            (row for row in self.rows if row.user_id == user_id and row.status == "pending"),
            None,
        )

    async def add(self, confirmation: EmailConfirmation) -> None:
        self.rows.append(confirmation)

    async def update(self, confirmation: EmailConfirmation) -> None:
        return None

    async def invalidate_pending_for(self, user_id: UserId, *, reason: str, now: datetime) -> None:
        for row in self.rows:
            if row.user_id == user_id and row.status == "pending":
                row.invalidate(reason)
                row.last_resent_at = now

    async def count_resends_in_window(self, user_id: UserId, window_start: datetime) -> int:
        return sum(
            1 for row in self.rows if row.user_id == user_id and row.created_at >= window_start
        )


class FakeOAuthFlowStateRepository:
    def __init__(self, clock: FrozenClock) -> None:
        self.clock = clock
        self.rows = {}

    async def add(self, flow: OAuthFlowState) -> None:
        self.rows[str(flow.id.value)] = flow

    async def consume_atomic(
        self, flow_id: object, *, reason: str, now: datetime
    ) -> OAuthFlowState | None:
        row = self.rows.get(str(getattr(flow_id, "value", flow_id)))
        if row is None or row.consumed_at is not None or row.expires_at <= now:
            return None
        row.consumed_at = now
        row.consumed_reason = reason
        return row


class FakeGoogleIdentityProvider:
    def __init__(self, identity: GoogleIdentity | None = None) -> None:
        self.identity = identity

    async def exchange_code(
        self, *, code: str, code_verifier: str, redirect_uri: str
    ) -> GoogleIdentity:
        if self.identity is None:
            raise AssertionError("fake google identity missing")
        return self.identity


class FakeEmailSender:
    def __init__(self) -> None:
        self.confirmations = []
        self.duplicate_notices = []

    async def send_confirmation_code(
        self, to: Email, code: ConfirmationCode, locale: str, expires_at: datetime
    ) -> None:
        self.confirmations.append((to, code, locale, expires_at))

    async def send_duplicate_signup_notice(self, to: Email, locale: str) -> None:
        self.duplicate_notices.append((to, locale))


class FakeConfirmationCodeHasher:
    def hash(self, code: ConfirmationCode) -> bytes:
        return f"hash:{code.value}".encode()

    def verify(self, code: ConfirmationCode, digest: bytes) -> bool:
        return self.hash(code) == digest
