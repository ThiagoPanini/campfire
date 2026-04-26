# Comparative Architecture Review — `campfire/apps/api` vs. `b3stocks`

**Date**: 2026-04-26
**Author**: Maintainer (Thiago Panini), with AI-assisted analysis
**Slice under review**: `002-backend-auth-slice`
**Reference repository**: https://github.com/ThiagoPanini/b3stocks
**Companion artifacts**:
- ADR-0006 (`../adr/0006-backend-hexagonal-ddd-pattern.md`)
- Backend architecture playbook (`docs/backend/architecture.mdx`)
- Constitution v1.1.0 (`.specify/memory/constitution.md`)

This document preserves the comparative analysis that produced ADR-0006
and the v1.1.0 constitution amendment. Future implementers should read
the ADR and the playbook for the conclusions; this document exists for
the *trace* of how those conclusions were reached.

---

## Premise tested

The review opened with the maintainer's perception that the new
backend slice "differs substantially" from the familiar `b3stocks`
pattern and might be missing layers (interfaces, adapters, ports, use
cases, domain, presentation).

**Verdict: the perception was wrong.** The slice already implements a
strict Hexagonal + DDD layout, on multiple axes more rigorously than
`b3stocks` (notably: `Protocol`-based ports, an AST-walking
architecture test, mappers between ORM rows and domain entities, a
`SettingsProvider` and `Clock` port, a single error-mapping handler).
The shapes differ because the operational targets differ:
`b3stocks` is AWS Lambda fan-out (slice = one Lambda); `campfire` is
a long-running FastAPI service (slice = one bounded context).

---

## Reference repository — `b3stocks`

### Layout

```
app/src/features/<feature_name>/
  domain/
    entities/<entity>.py          # one class per file
    value_objects/<vo>.py
    interfaces/<port>.py          # ABC + @abstractmethod, leading-I name
    dtos/<dto>.py
  use_case/<feature>_use_case.py  # @dataclass, .execute() method
  infra/
    adapters/<adapter>.py
    repositories/<repo>.py
    mappers/<mapper>.py
  presentation/<feature>_presentation.py   # AWS Lambda handler
features/cross/                            # shared kernel between features
```

### Idioms

| Concept | `b3stocks` choice |
|---|---|
| Port | `ABC` + `@abstractmethod`, named `IFooBar` |
| Use case | `@dataclass(frozen=True)` with `.execute()` |
| Composition | Module-level globals at import (Lambda cold-start friendly) |
| Output | Custom `OutputDTO` envelope returned by every use case |
| Settings | `os.getenv` read inside the use case body |
| File granularity | One class per file |

### Classification (for re-use in `campfire`)

| Element | Verdict | Reason |
|---|---|---|
| Vertical-slice-per-Lambda | Adapt | Campfire already slices, but at the bounded-context level. |
| `ABC` + `IFooBar` | Avoid | `Protocol` (already in use) is structural, more Pythonic. |
| `.execute()` | Avoid | `__call__` reads as a callable; integrates with `Depends`. |
| One class per file | Investigate | Useful if a file exceeds ~300 lines; not currently true. |
| Module-level globals | Avoid | Wrong fit for FastAPI request-scoped DI. |
| `OutputDTO` envelope | Avoid | FastAPI's exception-handler pattern is cleaner. |
| `infra/mappers/` | Reuse | Already adopted (`adapters/persistence/mappers.py`). |
| `cross/` shared kernel | Adapt | Will reappear as `contexts/_shared/` when context #2 lands. |

---

## Target repository — `campfire/apps/api` (slice 002)

### Layout (verified)

```
apps/api/src/campfire_api/
  main.py                      # composition root
  settings.py                  # SettingsProvider Protocol
  shared/{logging.py, request_id.py}
  contexts/identity/
    domain/{entities,value_objects,ports,events,catalogs}.py
    application/
      errors.py
      use_cases/{register_user,authenticate_user,refresh_session,
                 sign_out,update_preferences,get_me,
                 google_stub_sign_in,session_tokens}.py
    adapters/
      http/{routers/*,schemas.py,deps.py,error_mapping.py,csrf.py}
      persistence/{engine,unit_of_work,models,mappers,
                   user_repository,credentials_repository,
                   preferences_repository,session_repository,
                   refresh_token_repository}.py
      security/{argon2_hasher,opaque_token_issuer}.py
      rate_limiting/in_memory_limiter.py
      clock/system_clock.py
tests/
  unit/identity/, integration/identity/, contract/, unit/test_architecture.py
```

### Architectural elements present

| Element | Status | Evidence |
|---|---|---|
| Domain layer | ✅ | `contexts/identity/domain/` |
| Application layer | ✅ | `contexts/identity/application/` |
| Use cases | ✅ | 8 use-case modules under `application/use_cases/` |
| Ports / interfaces | ✅ (as `Protocol`) | `domain/ports.py:16-65` |
| Adapters | ✅ | `adapters/{http,persistence,security,rate_limiting,clock}` |
| Presentation layer | ✅ | `adapters/http/routers/*` |
| DTO/entity separation | ✅ | Pydantic in `schemas.py`; dataclasses in `entities.py` |
| Repositories | ✅ | `SqlAlchemy*Repository` |
| Unit of Work | ⚠ Implicit | `session_scope` exists; not yet a domain Protocol |
| Domain events | ⚠ File present | Emission status not verified in this review |
| Architecture test | ✅ | `tests/unit/test_architecture.py:9` (banned root imports) |
| Tests by layer | ✅ | unit / integration / contract subtrees |

### Friction points (real, but not critical)

1. Use cases are constructed by hand inside each route
   (`adapters/http/routers/auth.py:87`).
2. `get_repositories` returns `dict[str, Any]` — magic strings.
3. Transaction boundary is HTTP-shaped (no `UnitOfWork` Protocol).
4. Password length policy is duplicated in three places (Pydantic
   `Field(min_length=8)`, `RegisterUser`, `Credentials.from_plaintext`).
5. CORS bootstrap uses a synchronous `asyncio.run` workaround in
   `main.py`.
6. `AuthContext` uses `object` for IDs instead of typed value objects.

None of these are architectural failures; they are refinements with
clear triggers (see ADR-0006's "Deferred refinements" table).

---

## Comparison matrix

| Criterion | `b3stocks` | `campfire/apps/api` (slice 002) | Verdict |
|---|---|---|---|
| Slicing unit | Lambda function | Bounded context | Different op-targets; both correct. |
| Port mechanism | `ABC` + `IFoo` | `Protocol` | Campfire wins on idiom. |
| Use case API | `.execute()` | `__call__` | Campfire wins on idiom. |
| Composition | Module globals | FastAPI `Depends` | Campfire wins for long-running. |
| Output | `OutputDTO` envelope | Domain exceptions + handler | Campfire wins on simplicity. |
| ORM ↔ Domain | Mappers in `infra/mappers/` | Mappers in `adapters/persistence/mappers.py` | Equivalent. |
| Layer enforcement | Review only | AST guard test | Campfire wins on rigor. |
| Settings | `os.getenv` in use case | `SettingsProvider` Protocol | Campfire wins on testability. |
| File granularity | One class per file | One file per concept | Campfire's choice is fine while files stay small. |
| Coupling to framework | Lambda-shaped | FastAPI-shaped | Symmetric. |

---

## What was extracted into durable documents

The review produced three durable artifacts:

1. **Constitution v1.1.0** added a "Backend Architecture Invariants"
   subsection capturing the seven invariants the implementation
   already obeys. This freezes the *what*.
2. **ADR-0006** documents the pattern decision, the locked Python
   idioms, the rejected alternatives (vertical-slice-per-Lambda,
   transaction-script, Django-style, strict Onion, `ABC`-flavored
   Hexagonal), and the deferred refinements with their triggers.
3. **Backend architecture playbook** (`docs/backend/architecture.mdx`)
   provides the practical recipe for adding a new bounded context,
   the cross-context rules, the idiom cheat sheet, and the
   anti-patterns to refuse.

## Forward-looking note: the next bounded context

The review explicitly considered "user knows song" as the next likely
feature. Conclusion (carried into the playbook):

- It is a **new bounded context** (`repertoire/`), not a slice of
  `identity/`.
- `UserId` is the only thing imported from `identity` (identifier
  value object). Importing `User` would be forbidden.
- The first additional context is the right trigger to create
  `contexts/_shared/adapters/persistence/` (engine, session/UoW) and
  to lift the transaction boundary from "HTTP request" to a
  `UnitOfWork` Protocol.
- A separate `catalog/` context for canonical song metadata is *not*
  required at MVP scale; revisit if/when external catalog integrations
  (Spotify, MusicBrainz) appear.

---

## Closing assessment

> The architecture is sound. The work going forward is *additive*,
> not corrective. Apply the deferred refinements when their triggers
> fire, copy almost nothing from `b3stocks` directly, and keep the
> AST guard test honest as new contexts arrive.
