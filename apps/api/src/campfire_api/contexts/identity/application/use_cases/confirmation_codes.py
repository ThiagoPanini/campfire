import secrets

from campfire_api.contexts.identity.domain.value_objects import ConfirmationCode


def generate_confirmation_code() -> ConfirmationCode:
    return ConfirmationCode(f"{secrets.randbelow(1_000_000):06d}")
