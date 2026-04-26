"""seed ada

Revision ID: 0002_seed_ada
Revises: 0001_identity_initial
Create Date: 2026-04-26
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "0002_seed_ada"
down_revision: str | None = "0001_identity_initial"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

ADA_ID = "018f0000-0000-7000-8000-000000000001"
ADA_HASH = "$argon2id$v=19$m=19456,t=2,p=1$WO8c3zdKufpGYC/woOXNPg$+MEKvl/kFcr1xURYss4uqLegvP9LWwfeUP0KZw0XMaM"


def upgrade() -> None:
    op.execute(
        sa.text(
            """
            INSERT INTO users (id, email, display_name, first_login)
            VALUES (:id, 'ada@campfire.test', 'Ada', false)
            ON CONFLICT (email) DO NOTHING
            """
        ).bindparams(id=ADA_ID)
    )
    op.execute(
        sa.text(
            """
            INSERT INTO credentials (user_id, password_hash)
            VALUES (:id, :password_hash)
            ON CONFLICT (user_id) DO NOTHING
            """
        ).bindparams(id=ADA_ID, password_hash=ADA_HASH)
    )
    op.execute(
        sa.text(
            """
            INSERT INTO preferences (user_id, instruments, genres, context, goals, experience)
            VALUES (
              :id,
              '["Guitar","Vocals"]'::jsonb,
              '["Rock","MPB","Bossa Nova"]'::jsonb,
              'friends',
              '["Track my full repertoire","Share my set with the group"]'::jsonb,
              'intermediate'
            )
            ON CONFLICT (user_id) DO NOTHING
            """
        ).bindparams(id=ADA_ID)
    )


def downgrade() -> None:
    op.execute("DELETE FROM users WHERE email = 'ada@campfire.test'")
