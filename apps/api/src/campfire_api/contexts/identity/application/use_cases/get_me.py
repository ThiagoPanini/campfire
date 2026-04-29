from dataclasses import dataclass

from campfire_api.contexts.identity.application.errors import InvalidCredentials
from campfire_api.contexts.identity.domain.entities import User
from campfire_api.contexts.identity.domain.ports import UserRepository
from campfire_api.contexts.identity.domain.value_objects import UserId


@dataclass
class GetCurrentUser:
    users: UserRepository

    async def __call__(self, user_id: UserId) -> User:
        user = await self.users.get_by_id(user_id)
        if not user:
            raise InvalidCredentials()
        return user
