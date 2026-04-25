# Data Model: Campfire Frontend MVP Prototype

## MockSession

Represents current prototype state.

| Field | Type | Rules |
|---|---|---|
| `currentUser` | `MockUser | null` | `null` on initial load, sign-out, and full refresh |
| `preferences` | `Preferences` | Stored only while `currentUser` exists in memory |
| `language` | `"en" | "pt"` | Defaults to `"en"`; persists in `sessionStorage` for current tab |
| `accent` | `AccentPresetId` | Defaults to `"COPPER"`; persists in `sessionStorage` for current tab |
| `route` | `RouteId` | One of `landing`, `signin`, `signup`, `onboarding`, `home` |
| `authMode` | `"firstLogin" | "returning"` | Determines home member-panel variant |

### State Transitions

- Initial load: `currentUser = null`, `preferences = empty`, `route = landing`.
- Sign up success: create `MockUser`, set `authMode = firstLogin`, route to onboarding.
- Google from sign-up: create managed mock user, set `authMode = firstLogin`, route to onboarding.
- Sign in success: set seeded `MockUser`, hydrate seeded preferences, set `authMode = returning`, route to home.
- Google from sign-in: set seeded `MockUser`, hydrate seeded preferences, set `authMode = returning`, route to home.
- Onboarding submit: save chosen preferences to memory, route to home.
- Onboarding skip: preserve existing preferences unchanged, route to home.
- Update preferences: route from home to onboarding with current preferences selected.
- Sign out: clear `currentUser` and preferences, route to landing.
- Full refresh: clear `currentUser`, preferences, and route back to landing; keep `language` and `accent`.
- Direct open of home/onboarding without `currentUser`: redirect to landing.

## MockUser

In-memory user only. Never persisted or transmitted.

| Field | Type | Rules |
|---|---|---|
| `displayName` | `string` | Seeded user has fixed name; sign-up derives from email local-part |
| `email` | `string` | Must be well-formed for form submission |
| `password` | `string` | Mock only; seeded account password is demo value |
| `firstLogin` | `boolean` | `true` for sign-up/Google sign-up; `false` for seeded sign-in |
| `preferences` | `Preferences` | Empty for new sign-up; seeded for returning account |

### Validation

- Email rejects empty or malformed values.
- Password rejects values shorter than 8 characters.
- Seeded sign-in only succeeds for the seeded email/password pair.
- Non-seeded sign-in credentials show localized error text and remain on sign-in.

## Preferences

Onboarding answers.

| Field | Type | Rules |
|---|---|---|
| `instruments` | `InstrumentId[]` | Multi-select; may be empty |
| `genres` | `GenreId[]` | Multi-select; may be empty |
| `context` | `ContextId | null` | Single-select; may be null |
| `goals` | `GoalId[]` | Multi-select; may be empty |
| `experience` | `ExperienceId | null` | Single-select; may be null |

## Catalogs

### InstrumentCatalog

Fixed labels: Guitar, Bass, Drums, Piano / Keys, Vocals, Violin, Cavaquinho, Ukulele, Cajón, Mandolin, Flute, Other.

### GenreCatalog

Fixed labels: Rock, MPB, Samba, Jazz, Forró, Bossa Nova, Pop, Blues, Country, Metal, Reggae, Funk, Other.

### ContextCatalog

Fixed Portuguese labels in both languages:

- Roda de amigos
- Banda amadora
- Banda profissional
- Prática solo
- Grupo de louvor
- Sessões / Jam sessions

### GoalCatalog

Fixed English labels in both languages:

- Learn new songs faster
- Track my full repertoire
- Share my set with the group
- Prepare for jam sessions
- Practice more consistently
- Know what I can already play

### ExperienceCatalog

| Id | Label | Sub-label |
|---|---|---|
| `beginner` | Beginner | Less than 1 year |
| `learning` | Learning | 1-3 years |
| `intermediate` | Intermediate | 3-7 years |
| `advanced` | Advanced | 7+ years |

## AccentPreset

| Id | Hex | Default |
|---|---|---|
| `EMBER` | `#FF6B2B` | No |
| `FLAME` | `#FFAA00` | No |
| `GOLD` | `#FFD166` | No |
| `COPPER` | `#E8813A` | Yes |
| `BRASS` | `#D4A84B` | No |

## CopyTable

Two entries: `en` and `pt`. Must cover landing, nav, auth, validation, Google labels, onboarding, home, language/accent controls, and action states.

Integrity rule: every rendered copy key must exist in both languages, except catalog labels intentionally preserved in one language per the spec assumptions.
