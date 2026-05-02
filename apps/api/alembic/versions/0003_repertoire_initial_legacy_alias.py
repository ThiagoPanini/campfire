"""legacy repertoire revision alias

Revision ID: 0003_repertoire_initial
Revises: 0002_repertoire_initial
Create Date: 2026-05-01
"""

from collections.abc import Sequence

revision: str = "0003_repertoire_initial"
down_revision: str | None = "0002_repertoire_initial"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Compatibility no-op for local databases stamped before revision renumbering."""


def downgrade() -> None:
    """Compatibility no-op for local databases stamped before revision renumbering."""
