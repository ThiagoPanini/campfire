from campfire_api.contexts.identity.domain.value_objects import COMMON_PASSWORDS

PASSWORD_RULES = {
    "minLength": 10,
    "requiredCharacterClasses": 3,
    "characterClasses": ["lowercase", "uppercase", "digit", "symbol"],
    "commonPasswords": sorted(COMMON_PASSWORDS),
}
