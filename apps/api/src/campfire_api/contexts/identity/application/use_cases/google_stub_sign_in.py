from dataclasses import dataclass

from campfire_api.contexts.identity.application.errors import GoogleStubDisabled, InvalidCredentials
from campfire_api.contexts.identity.application.use_cases.authenticate_user import AuthenticateUser
from campfire_api.contexts.identity.application.use_cases.session_tokens import IssuedSession
from campfire_api.contexts.identity.domain.entities import User
from campfire_api.contexts.identity.domain.ports import Clock, UserRepository
from campfire_api.contexts.identity.domain.value_objects import DisplayName, Email, UserId

GOOGLE_STUB_EMAIL = "google.member@campfire.test"
SEEDED_EMAIL = "ada@campfire.test"


@dataclass
class ContinueWithGoogleStub:
    users: UserRepository
    authenticate_user: AuthenticateUser
    clock: Clock
    enabled: bool

    async def __call__(self, intent: str) -> IssuedSession:
        if not self.enabled:
            raise GoogleStubDisabled()
        email = Email(SEEDED_EMAIL if intent == "sign-in" else GOOGLE_STUB_EMAIL)
        user = await self.users.get_by_email(email)
        if user is None:
            if intent != "sign-up":
                raise InvalidCredentials()
            now = self.clock.now()
            user = User(
                id=UserId.new(),
                email=email,
                display_name=DisplayName("Google Member"),
                created_at=now,
                updated_at=now,
            )
            await self.users.add(user)
        return await self.authenticate_user._open_session(user.id)
