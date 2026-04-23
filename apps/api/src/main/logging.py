from __future__ import annotations

import logging


def configure_logging() -> logging.Logger:
    """Create the shared application logger."""

    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s %(message)s")
    return logging.getLogger("campfire.api")
