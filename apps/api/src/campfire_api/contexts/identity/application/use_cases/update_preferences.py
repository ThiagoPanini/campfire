from dataclasses import dataclass

from campfire_api.contexts.identity.application.errors import InvalidCredentials, UnknownCatalogId
from campfire_api.contexts.identity.domain.entities import PreferencesProfile
from campfire_api.contexts.identity.domain.ports import Clock, PreferencesRepository, UserRepository
from campfire_api.contexts.identity.domain.value_objects import UserId


@dataclass
class UpdatePreferences:
    users: UserRepository
    preferences: PreferencesRepository
    clock: Clock

    async def __call__(
        self,
        user_id: UserId,
        instruments: list[str],
        genres: list[str],
        context: str | None,
        goals: list[str],
        experience: str | None,
    ) -> PreferencesProfile:
        now = self.clock.now()
        profile = PreferencesProfile(user_id, instruments, genres, context, goals, experience, now)
        try:
            profile.validate_catalogs()
        except ValueError as exc:
            raise UnknownCatalogId() from exc
        user = await self.users.get_by_id(user_id)
        if not user:
            raise InvalidCredentials()
        user.first_login = False
        user.updated_at = now
        await self.preferences.replace(profile)
        await self.users.update(user)
        return profile
