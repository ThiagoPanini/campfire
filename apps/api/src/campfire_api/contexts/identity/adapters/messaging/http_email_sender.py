from __future__ import annotations

from datetime import datetime

import httpx

from campfire_api.contexts.identity.domain.value_objects import ConfirmationCode, Email


class HttpEmailSender:
    def __init__(self, url: str, api_key: str, from_email: str) -> None:
        self.url = url
        self.api_key = api_key
        self.from_email = from_email

    async def _send(self, *, to: Email, subject: str, text: str) -> None:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                self.url,
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "from": self.from_email,
                    "to": to.value,
                    "subject": subject,
                    "text": text,
                },
            )
            response.raise_for_status()

    async def send_confirmation_code(
        self, to: Email, code: ConfirmationCode, locale: str, expires_at: datetime
    ) -> None:
        await self._send(
            to=to,
            subject="Campfire confirmation code",
            text=(
                f"Your Campfire confirmation code is {code.value}.\n"
                f"It expires at {expires_at.isoformat()}."
            ),
        )

    async def send_duplicate_signup_notice(self, to: Email, locale: str) -> None:
        await self._send(
            to=to,
            subject="Campfire sign-up notice",
            text=(
                "Someone tried to sign up for Campfire with this email. "
                "If this was you, sign in instead."
            ),
        )

    async def send_google_promotion_notice(self, to: Email, locale: str) -> None:
        await self._send(
            to=to,
            subject="Campfire Google sign-in enabled",
            text=(
                "Your unconfirmed Campfire account was confirmed by Google sign-in. "
                "The old password can no longer be used."
            ),
        )
