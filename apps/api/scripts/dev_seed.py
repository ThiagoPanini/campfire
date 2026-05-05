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
                    WITH seeded_user AS (
                        INSERT INTO users (id, email, display_name, email_confirmed_at)
                        VALUES (:id, 'ada@campfire.test', 'Ada', now())
                        ON CONFLICT (email) DO UPDATE
                        SET
                            display_name = EXCLUDED.display_name,
                            email_confirmed_at = COALESCE(
                                users.email_confirmed_at,
                                EXCLUDED.email_confirmed_at
                            ),
                            updated_at = now()
                        RETURNING id
                    )
                    INSERT INTO credentials (user_id, password_hash)
                    SELECT id, :password_hash
                    FROM seeded_user
                    ON CONFLICT (user_id) DO UPDATE
                    SET
                        password_hash = EXCLUDED.password_hash,
                        updated_at = now()
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
