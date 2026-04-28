from sqlalchemy.ext.asyncio import AsyncSession

from campfire_api.contexts.identity.adapters.persistence.mappers import preferences_from_row
from campfire_api.contexts.identity.adapters.persistence.models import PreferencesRow
from campfire_api.contexts.identity.domain.entities import PreferencesProfile
from campfire_api.contexts.identity.domain.value_objects import UserId


class SqlAlchemyPreferencesRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_user_id(self, user_id: UserId) -> PreferencesProfile | None:
        row = await self.session.get(PreferencesRow, user_id.value)
        return preferences_from_row(row) if row else None

    async def add(self, preferences: PreferencesProfile) -> None:
        self.session.add(
            PreferencesRow(
                user_id=preferences.user_id.value,
                instruments=preferences.instruments,
                genres=preferences.genres,
                context=preferences.context,
                goals=preferences.goals,
                experience=preferences.experience,
                updated_at=preferences.updated_at,
            )
        )
        await self.session.flush()

    async def replace(self, preferences: PreferencesProfile) -> None:
        row = await self.session.get(PreferencesRow, preferences.user_id.value)
        if row is None:
            await self.add(preferences)
            return
        row.instruments = preferences.instruments
        row.genres = preferences.genres
        row.context = preferences.context
        row.goals = preferences.goals
        row.experience = preferences.experience
        if preferences.updated_at:
            row.updated_at = preferences.updated_at
        await self.session.flush()
