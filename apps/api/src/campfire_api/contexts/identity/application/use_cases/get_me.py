from dataclasses import dataclass

from campfire_api.contexts.identity.application.errors import InvalidCredentials
from campfire_api.contexts.identity.domain.entities import PreferencesProfile, User
from campfire_api.contexts.identity.domain.ports import PreferencesRepository, UserRepository
from campfire_api.contexts.identity.domain.value_objects import UserId


@dataclass
class CurrentUser:
    user: User
    preferences: PreferencesProfile


@dataclass
class GetCurrentUser:
    users: UserRepository
    preferences: PreferencesRepository

    async def __call__(self, user_id: UserId) -> CurrentUser:
        user = await self.users.get_by_id(user_id)
        if not user:
            raise InvalidCredentials()
        preferences = await self.preferences.get_by_user_id(user_id)
        if not preferences:
            raise InvalidCredentials()
        return CurrentUser(user, preferences)
