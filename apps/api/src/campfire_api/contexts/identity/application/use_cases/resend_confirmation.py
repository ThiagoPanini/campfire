from dataclasses import dataclass
from datetime import timedelta

from campfire_api.contexts.identity.application.use_cases.confirmation_codes import (
    generate_confirmation_code,
)
from campfire_api.contexts.identity.domain.entities import EmailConfirmation
from campfire_api.contexts.identity.domain.ports import (
    Clock,
    ConfirmationCodeHasher,
    EmailConfirmationRepository,
    EmailSender,
    UserRepository,
)
from campfire_api.contexts.identity.domain.value_objects import Email, UserId


@dataclass
class ResendConfirmation:
    users: UserRepository
    confirmations: EmailConfirmationRepository
    hasher: ConfirmationCodeHasher
    email_sender: EmailSender
    clock: Clock
    ttl_seconds: int
    cooldown_seconds: int
    hourly_cap: int

    async def __call__(self, email: str, locale: str = "en") -> None:
        user = await self.users.get_by_email(Email(email))
        if user is None:
            return
        if user.email_confirmed_at is not None:
            await self.email_sender.send_duplicate_signup_notice(user.email, locale)
            return

        now = self.clock.now()
        pending = await self.confirmations.get_pending_for_user(user.id)
        if pending and pending.last_resent_at:
            elapsed = (now - pending.last_resent_at).total_seconds()
            if elapsed < self.cooldown_seconds:
                return
        if pending and (now - pending.created_at).total_seconds() < self.cooldown_seconds:
            return

        window_start = now - timedelta(hours=1)
        resend_count = await self.confirmations.count_resends_in_window(user.id, window_start)
        if resend_count >= self.hourly_cap:
            return

        await self.confirmations.invalidate_pending_for(user.id, reason="resent", now=now)
        code = generate_confirmation_code()
        confirmation = EmailConfirmation(
            id=UserId.new(),
            user_id=user.id,
            email=user.email,
            code_hash=self.hasher.hash(code),
            created_at=now,
            expires_at=now + timedelta(seconds=self.ttl_seconds),
            resend_count=(pending.resend_count + 1) if pending else 1,
            last_resent_at=now,
        )
        await self.confirmations.add(confirmation)
        await self.email_sender.send_confirmation_code(
            user.email, code, locale, confirmation.expires_at
        )
