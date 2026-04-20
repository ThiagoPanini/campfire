# campfire — architecture notes

## Layering

campfire follows a Hexagonal / Clean-Architecture split. Dependencies point
**inward**: interface → application → domain, with infrastructure adapting
to domain contracts.

```
interfaces/     FastAPI routers, HTTP schemas, DI glue
application/    use cases, commands, application DTOs
domain/         entities, value objects, repository/provider Protocols, exceptions
infrastructure/ repository implementations, external-provider adapters, auth, composition root
```

### Why this shape for a tiny product

- The domain (`declared musical knowledge`, `proficiency`) is the heart of the
  product. Isolating it means future persistence choices, auth providers, and
  transport layers can evolve without rewriting business rules.
- Protocol-based contracts (`RepertoireRepository`, `SongRepository`,
  `SongSearchProvider`, `InstrumentCatalog`, `UserRepository`) keep the domain
  import-free of ORMs and HTTP clients.
- A small composition root (`infrastructure/bootstrap.py`) is the **only**
  place that knows which concrete adapters to instantiate.

## Current product scope

The active first slice is user-owned repertoire registration and consultation.
A user can link a `(song, instrument, proficiency)` triple to their profile and
retrieve their own repertoire with derived proficiency labels.

Group-level "possible repertoire for present users" was prototyped in an
earlier scaffold iteration and is intentionally removed from the active scope
to keep the codebase internally consistent. A future iteration can reintroduce
it cleanly as another use case consuming the same domain model — the
`RepertoireRepository.list_for_user` contract stays stable and presence would
enter as an input to a new use case.

## Key domain concepts

| Concept | Type | Notes |
|---|---|---|
| `User` | entity | Authorized group member. |
| `Song` | entity | Identified by (title, artist). Catalog standardization deferred. |
| `Instrument` | value object | Normalized lowercase name. |
| `Proficiency` | value object | Integer 0–10; derives a label (`beginner` / `intermediate` / `advanced` / `expert`). |
| `RepertoireEntry` | entity | Unique per `(user, song, instrument)`, carries a `Proficiency`. |

Pure domain rules (range validation, label derivation) live on the
`Proficiency` value object itself — no separate domain service is needed for
the current slice, so `domain/services/` is kept empty as an explicit seam.

## Ports (Protocols)

| Protocol | Lives in | Default adapter |
|---|---|---|
| `UserRepository` | `domain/repositories/` | `InMemoryUserRepository` |
| `SongRepository` | `domain/repositories/` | `InMemorySongRepository` |
| `RepertoireRepository` | `domain/repositories/` | `InMemoryRepertoireRepository` |
| `SongSearchProvider` | `domain/repositories/` | `InMemorySongSearchProvider` (seeded catalog) |
| `InstrumentCatalog` | `domain/repositories/` | `InMemoryInstrumentCatalog` (curated suggestions) |

`SongSearchProvider` is kept distinct from `SongRepository` on purpose: local
storage of user-linked songs and search-over-a-large-catalog are different
concerns, and decoupling them lets a MusicBrainz/Spotify/etc. adapter slot in
later without touching the rest of the codebase. Tests remain deterministic
because the default adapter is local.

## Request flow

```
HTTP → FastAPI router (interfaces/api/v1/*)
     → use case (application/use_cases/*)
       → domain repository / provider Protocol
         ← infrastructure adapter (memory/*)
     ← application DTO
← HTTP response schema
```

Routers never touch repositories directly — adding a read-only endpoint means
adding a use case first.

## Authentication

Deliberately stubbed. `PlaceholderAuthenticator` resolves an `X-User-Id`
header against the authorized-user repository. Replacing it with OAuth,
magic links, or invite codes is a single-file swap in
`infrastructure/auth/` plus a DI update.

## Extending

- **New persistence backend**: add `infrastructure/persistence/sql/*` that
  satisfies the existing `Protocol` contracts; swap in `bootstrap.py`.
- **External song-search provider**: add an adapter satisfying
  `SongSearchProvider` under `infrastructure/` and wire it in `bootstrap.py`.
  Keep tests using the in-memory default so the suite stays network-free.
- **New use case**: add under `application/use_cases/`, depending only on
  domain contracts. Expose via a new router in `interfaces/api/v1/`.
- **Instrument catalog upgrade**: promote `Instrument` from a value object to
  an aggregate only if governance needs demand it — the current seam already
  supports lookup + custom names.
- **Presence / group-level reads**: reintroduce a dedicated use case that
  takes `present_user_ids` as input and composes `RepertoireRepository`
  queries; the domain is ready for it.

## Test strategy

- `tests/unit/` — pure domain and application logic, no FastAPI.
- `tests/integration/` — full HTTP stack via `TestClient` against the
  in-memory composition root.
- All tests are deterministic and network-free.
