from __future__ import annotations

import asyncio
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from campfire_api.settings import EnvSettingsProvider

ADA_ID = UUID("018f0000-0000-7000-8000-000000000001")
ADA_HASH = (
    "$argon2id$v=19$m=19456,t=2,p=1$WO8c3zdKufpGYC/woOXNPg"
    "$+MEKvl/kFcr1xURYss4uqLegvP9LWwfeUP0KZw0XMaM"
)


async def seed_ada() -> None:
    engine = create_async_engine(await EnvSettingsProvider().database_url())
    try:
        async with engine.begin() as connection:
            await connection.execute(
                text(
                    """
                    INSERT INTO users (id, email, display_name)
                    VALUES (:id, 'ada@campfire.test', 'Ada')
                    ON CONFLICT (email) DO UPDATE
                    SET display_name = EXCLUDED.display_name
                    """
                ),
                {"id": ADA_ID},
            )
            await connection.execute(
                text(
                    """
                    INSERT INTO credentials (user_id, password_hash)
                    VALUES (:id, :password_hash)
                    ON CONFLICT (user_id) DO UPDATE
                    SET password_hash = EXCLUDED.password_hash
                    """
                ),
                {"id": ADA_ID, "password_hash": ADA_HASH},
            )
    finally:
        await engine.dispose()


def main() -> None:
    asyncio.run(seed_ada())
    print("Dev seed applied: ada@campfire.test")


if __name__ == "__main__":
    main()
