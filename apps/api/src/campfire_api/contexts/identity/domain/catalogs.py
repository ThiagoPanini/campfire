from campfire_api.shared.catalogs import INSTRUMENTS as INSTRUMENTS

GENRES = frozenset(
    {
        "Rock",
        "MPB",
        "Samba",
        "Jazz",
        "Forro",
        "Bossa Nova",
        "Pop",
        "Blues",
        "Country",
        "Metal",
        "Reggae",
        "Funk",
        "Other",
    }
)

CONTEXTS = frozenset({"friends", "amateur", "pro", "solo", "church", "sessions"})

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
