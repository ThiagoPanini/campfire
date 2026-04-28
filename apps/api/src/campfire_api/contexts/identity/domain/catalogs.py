from campfire_api.shared.catalogs import INSTRUMENTS as PLAYABLE_INSTRUMENTS

INSTRUMENTS = frozenset({*PLAYABLE_INSTRUMENTS, "I don't play"})

GENRES = frozenset(
    {
        "Rock",
        "Hard Rock",
        "Heavy Metal",
        "Metalcore",
        "Metal",
        "Blues",
        "Pop",
        "Country",
        "Reggae",
        "Jazz",
        "MPB",
        "Samba",
        "Bossa Nova",
        "Forro",
        "Other",
    }
)

CONTEXTS = frozenset(
    {"friends", "amateur", "pro", "solo", "church", "sessions", "rehearsal_studio", "other"}
)

GOALS = frozenset(
    {
        "Learn new songs faster",
        "Track my full repertoire",
        "Share my set with the group",
        "Prepare for jam sessions",
        "Practice more consistently",
        "Know what I can already play",
    }
)

EXPERIENCE = frozenset({"beginner", "learning", "intermediate", "advanced"})
