# campfire — architecture notes

## Layering

campfire follows a Hexagonal / Clean-Architecture split. Dependencies point
**inward**: interface → application → domain, with infrastructure adapting
to domain contracts.

```
interfaces/   FastAPI routers, HTTP schemas, DI glue
application/  use cases, commands, application DTOs
domain/       entities, value objects, domain services, repository Protocols, exceptions
infrastructure/ repository implementations, auth adapters, composition root
```

### Why this shape for a tiny product

- The domain (`declared musical knowledge`, `possible repertoire`) is the
  heart of the product. Isolating it means future persistence choices,
  auth providers, and transport layers (CLI, background jobs) can evolve
  without rewriting business rules.
- Protocol-based repositories keep the domain import-free of ORMs.
  The current in-memory implementations prove the seams are real.
- A small composition root (`infrastructure/bootstrap.py`) is the **only**
  place that knows which concrete adapters to instantiate.

## Key domain concepts

| Concept | Type | Notes |
|---|---|---|
| `User` | entity | Authorized group member. Musician/audience are behavioral, not modeled as roles yet. |
| `Song` | entity | Identified by (title, artist). Catalog standardization deferred. |
| `Instrument` | value object | Normalized lowercase name. |
| `RepertoireEntry` | entity | The `declared musical knowledge` central concept. Unique per (user, song, instrument). |
| `PossibleRepertoireService` | domain service | Pure rule: a song is viable iff ≥1 present user declared it. Returns supporters per song. |

## Request flow

```
HTTP → FastAPI router (interfaces/api/v1/*)
     → use case (application/use_cases/*)
       → domain repository Protocol
         ← infrastructure adapter (memory/*)
       → domain service (pure)
     ← application DTO
← HTTP response schema
```

## Authentication

Deliberately stubbed. `PlaceholderAuthenticator` resolves an `X-User-Id`
header against the authorized-user repository. Replacing it with OAuth,
magic links, or invite codes is a single-file swap in
`infrastructure/auth/` plus a DI update.

## Extending

- **New persistence backend**: add `infrastructure/persistence/sql/*` that
  satisfies the existing `Protocol` contracts; swap in `bootstrap.py`.
- **New use case**: add under `application/use_cases/`, depending only on
  domain contracts. Expose via a new router in `interfaces/api/v1/`.
- **Presence model**: when the group decides how presence is captured
  (manual selection, check-in, geolocation), introduce a `Gathering`
  aggregate in `domain/models/` and a `GatheringRepository` Protocol.
  The `ListPossibleRepertoire` use case already consumes a list of
  `present_user_ids` so the interface is stable.
- **Mastery level / multi-artist songs / catalog**: extend `Song` and
  `RepertoireEntry` with optional fields. No cross-layer churn required.

## Test strategy

- `tests/unit/` — pure domain and application logic, no FastAPI.
- `tests/integration/` — full HTTP stack via `TestClient` against the
  in-memory composition root.
