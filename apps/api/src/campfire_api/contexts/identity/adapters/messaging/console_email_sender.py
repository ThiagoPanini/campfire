from __future__ import annotations

import hashlib
import logging
import re
from datetime import UTC, datetime
from pathlib import Path

from campfire_api.contexts.identity.domain.value_objects import ConfirmationCode, Email

LOGGER = logging.getLogger(__name__)


def _safe_name(email: Email) -> str:
    return re.sub(r"[^a-z0-9_.-]+", "_", email.value)


def _recipient_hash(email: Email) -> str:
    return hashlib.sha256(email.value.encode()).hexdigest()[:16]


class ConsoleEmailSender:
    def __init__(self, outbox_dir: str, from_email: str | None = None) -> None:
        self.outbox_dir = Path(outbox_dir)
        self.from_email = from_email or "noreply@campfire.local"

    async def send_confirmation_code(
        self, to: Email, code: ConfirmationCode, locale: str, expires_at: datetime
    ) -> None:
        self.outbox_dir.mkdir(parents=True, exist_ok=True)
        body = (
            f"From: {self.from_email}\n"
            f"To: {to.value}\n"
            "Subject: Campfire confirmation code\n\n"
            f"Your Campfire confirmation code is {code.value}.\n"
            f"It expires at {expires_at.isoformat()}.\n"
        )
        path = (
            self.outbox_dir
            / f"{datetime.now(UTC).strftime('%Y%m%d%H%M%S')}-{_safe_name(to)}-confirmation.txt"
        )
        path.write_text(body, encoding="utf-8")
        LOGGER.info(
            "event=mail_sent template=confirmation_code to_hash=%s locale=%s path=%s",
            _recipient_hash(to),
            locale,
            path,
        )

    async def send_duplicate_signup_notice(self, to: Email, locale: str) -> None:
        self.outbox_dir.mkdir(parents=True, exist_ok=True)
        body = (
            f"From: {self.from_email}\n"
            f"To: {to.value}\n"
            "Subject: Campfire sign-up notice\n\n"
            "Someone tried to sign up for Campfire with this email. "
            "If this was you, sign in instead.\n"
        )
        path = (
            self.outbox_dir
            / f"{datetime.now(UTC).strftime('%Y%m%d%H%M%S')}-{_safe_name(to)}-duplicate.txt"
        )
        path.write_text(body, encoding="utf-8")
        LOGGER.info(
            "event=mail_sent template=duplicate_signup_notice to_hash=%s locale=%s",
            _recipient_hash(to),
            locale,
        )

    async def send_google_promotion_notice(self, to: Email, locale: str) -> None:
        self.outbox_dir.mkdir(parents=True, exist_ok=True)
        body = (
            f"From: {self.from_email}\n"
            f"To: {to.value}\n"
            "Subject: Campfire Google sign-in enabled\n\n"
            "Your unconfirmed Campfire account was confirmed by Google sign-in. "
            "The old password can no longer be used.\n"
        )
        path = (
            self.outbox_dir
            / f"{datetime.now(UTC).strftime('%Y%m%d%H%M%S')}-{_safe_name(to)}-google-promotion.txt"
        )
        path.write_text(body, encoding="utf-8")
        LOGGER.info(
            "event=mail_sent template=google_promotion_notice to_hash=%s locale=%s",
            _recipient_hash(to),
            locale,
        )
