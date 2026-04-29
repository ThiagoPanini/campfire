# Import all ORM models to register them with Base.metadata.
# This module must be imported before Alembic reads target_metadata for autogenerate.
from campfire_api.contexts.identity.adapters.persistence import models as _identity  # noqa: F401
from campfire_api.contexts.repertoire.adapters.persistence import (
    models as _repertoire,  # noqa: F401
)
