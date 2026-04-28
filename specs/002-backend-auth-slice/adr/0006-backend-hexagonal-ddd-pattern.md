# ADR-0006: Backend Hexagonal + DDD architecture pattern

**Status**: Accepted
**Date**: 2026-04-26
**Deciders**: Maintainer (Thiago Panini)
**Slice**: `002-backend-auth-slice`
**Constitution**: v1.1.0 (Principle III + new "Backend Architecture
Invariants" subsection)

## Context

The constitution (Principle III) commits the project to "Clean
Architecture + Hexagonal + DDD, applied pragmatically", but it does not
fix the *shape* of those patterns in Python or the specific Python
idioms used. Without that fixation, a second backend feature would risk
re-litigating the layout, the naming, the dependency-injection
mechanism, and the testability boundaries.

A reference implementation exists in the maintainer's prior project
[`b3stocks`](https://github.com/ThiagoPanini/b3stocks). It is also
hexagonal/Clean/DDD but targets AWS Lambda fan-out, which produces a
very different operational shape from a long-running FastAPI service.
Slice `002-backend-auth-slice` therefore adopted a Hexagonal+DDD layout
adapted to FastAPI rather than copying `b3stocks` directly. The
comparative review is archived at
`specs/002-backend-auth-slice/analysis/architecture-review.md`.

This ADR fixes that adapted layout so future backend slices inherit it
instead of redesigning it.

## Decision

The backend uses a **bounded-context-sliced Hexagonal + DDD layout**
with the following idioms:

### 1. Slicing unit: bounded context

Code is grouped under
`apps/api/src/campfire_api/contexts/<context>/`. The first context is
`identity`. A new context is created when its business rules can be
described without referencing another context's rules. Use cases inside
a context share repositories, ports, and the application-error
hierarchy.

This contrasts with `b3stocks`, which slices per Lambda function
(`features/<feature>/`). The Lambda-shaped slice is appropriate for
serverless fan-out; it produces unwanted fragmentation in a long-running
service where several use cases legitimately share infrastructure.

### 2. Layers inside each context

```
contexts/<context>/
  domain/           # entities, value objects, ports (Protocols), domain exceptions, events, catalogs
  application/      # use cases + application-layer error hierarchy
  adapters/         # http, persistence, security, rate_limiting, clock, ...
```

`domain/` and `application/` MUST NOT import any framework, ORM,
password library, JWT library, or cloud SDK. This is enforced by an
AST-walking test (`apps/api/tests/unit/test_architecture.py`).

### 3. Python idioms (locked in)

| Concept | Idiom | Notes |
|---|---|---|
| Port | `typing.Protocol` | Structural typing; no `ABC` inheritance; fakes are plain classes. |
| Use case | `@dataclass` with `__call__` | Reads as a callable; integrates naturally with FastAPI `Depends`. |
| Entity | `@dataclass` (mutable) | Plain Python; no ORM mixins. |
| Value object | `@dataclass(frozen=True)` with `__post_init__` validation | Immutable; encapsulates invariants. |
| Identifier | Frozen dataclass over `UUID` (e.g. `UserId(value: UUID)`) | Cross-context references travel as these. |
| ORM model | Separate file `adapters/persistence/models.py` (`*Row` suffix) | Never imported from `domain/` or `application/`. |
| Mapper | `adapters/persistence/mappers.py` | Pure functions `row → entity` (and back where needed). |
| Application error | `IdentityError` hierarchy in `application/errors.py` | Translated to HTTP by a single registered FastAPI handler. |
| HTTP DTO | Pydantic `BaseModel` in `adapters/http/schemas.py` | Pydantic appears nowhere else. |
| Settings | `SettingsProvider` Protocol | Forbids `os.getenv` in `domain/`/`application/`. |
| Clock | `Clock` Protocol with `SystemClock` adapter | Forbids `datetime.utcnow()` in `domain/`/`application/`. |
| DI | FastAPI `Depends` factories in `adapters/http/deps.py` | No DI framework. |
| Transaction | `session_scope` async context manager owned by the adapter | Lifted to a `UnitOfWork` Protocol when a non-HTTP trigger appears. |

### 4. Cross-context dependencies

A context MAY import another context's identifier value objects or call
its public application services through the adapter boundary. A context
MUST NOT import another context's entities, ORM rows, or repositories.

When the second context lands, shared infrastructure (e.g. the SQLA
engine, the `session_scope`, request-id middleware) moves into
`apps/api/src/campfire_api/contexts/_shared/` rather than living inside
`identity/`.

### 5. Composition root

`create_app()` in `apps/api/src/campfire_api/main.py` is the single
composition root: it instantiates the `SettingsProvider`, registers
middleware, registers the per-context error handler, and includes the
per-context routers explicitly. There is no auto-discovery of contexts.

## Consequences

### Positive

- **Layer purity is testable.** Violations break the build; reviewer
  attention is freed for behavior, not for layering.
- **Use cases are deterministic.** `Clock` and `SettingsProvider` ports
  let unit tests run without time-of-day flakiness or environment
  mutation.
- **Future contexts inherit a working pattern.** Adding `repertoire/`,
  `groups/`, etc. is a recipe (see the playbook), not a redesign.
- **No runtime DI framework.** FastAPI `Depends` is enough for the size
  of the project; the cost of a heavier DI library is avoided.
- **Bounded contexts cap blast radius.** A change inside `identity/`
  cannot accidentally couple to `repertoire/`, because cross-context
  imports beyond identifier value objects are mechanically uncommon
  (and the next ADR may make them mechanically forbidden).

### Negative / trade-offs

- **More files than a transaction-script FastAPI app.** Tutorials show
  routers calling SQLAlchemy directly; that style is faster to write
  for the first feature and unmaintainable by the third. We accept the
  upfront file count.
- **Use-case construction is currently inline in routers.** Each route
  builds its use case from `repos` and `Depends` factories. Acceptable
  today; tracked as a refinement (see "Deferred refinements" below).
- **`get_repositories` returns a `dict`.** Loses static typing on
  repository access. Same refinement.
- **Transaction boundary is HTTP-shaped.** Acceptable while every
  trigger is an HTTP request. Must be lifted to an explicit
  `UnitOfWork` Protocol before a non-HTTP trigger ships.

## Alternatives considered

### A. Vertical slice per Lambda (b3stocks-style)

Each feature gets its own `domain/use_case/infra/presentation/`
directory tree. **Rejected** for FastAPI:

- Multiple flows in `identity` (register, login, refresh, logout,
  preferences, get-me) share repositories, password hashing, token
  issuing, and the same database session. A per-flow slice would
  duplicate or hide that sharing.
- The Lambda handler pattern wires dependencies at module import time
  with global instances. FastAPI's request-scoped `Depends` is a
  better fit for a long-running async service.
- "One class per file" inflates file count without payoff at the
  current project size.

We keep the *concept* (own your domain, own your adapters, own your
presentation) and reject the *granularity* (per Lambda).

### B. Transaction-script / "FastAPI tutorial" style

Routers call SQLAlchemy and Pydantic directly; no separate domain or
application layer. **Rejected.** Forces the third feature into either
a rewrite or the gradual sprawl of "service" modules that are
indistinguishable from controllers.

### C. Django-style fat models

Entities own persistence (`User.save()`, `User.objects.get()`).
**Rejected.** Couples the domain to the ORM, which the constitution
forbids and the architecture test catches.

### D. Strict Onion / Clean Architecture purism

Separate `entities/`, `usecases/`, `interfaces/`, `frameworks/` at the
top level, with explicit dependency-rule enforcement at every layer.
**Rejected as overkill** for a solo-built MVP. The chosen pattern keeps
the dependency rule (enforced by test) without the ceremony of four
top-level layers.

### E. Hexagonal with `ABC` + leading-`I` interface naming

`IUserRepository(ABC)` etc. **Rejected.** `Protocol` provides
structural typing — fakes do not need to inherit, and this keeps the
test-double surface minimal. The `I`-prefix is a Java/C# convention
without payoff in Python.

## Deferred refinements (will become their own ADR if adopted)

These were called out by the comparative review and intentionally not
done in slice 002 to avoid overengineering. Each has a concrete trigger.

| Refinement | Trigger that should re-open the discussion |
|---|---|
| Typed `IdentityRepositories` dataclass + per-use-case `Depends` factories | Adding the third use case to a context, or any router file exceeding ~150 lines. |
| Explicit `UnitOfWork` Protocol owning `commit()` / `rollback()` | First non-HTTP trigger (cron, queue consumer, CLI). |
| `PlainPassword` value object (consolidate length policy) | Any change to password rules, or a second place that needs to validate plaintext passwords. |
| Strongly-typed `AuthContext` (`UserId`, `SessionId`, `SessionFamilyId`) | Any new endpoint that consumes `AuthContext` fields directly. |
| Decide on `domain/events.py` (use it or delete it) | First feature that needs an audit trail or a notification. |
| `contexts/_shared/` for shared adapters (engine, UoW, mappers utils) | Second bounded context lands. |

## Related

- Constitution **v1.1.0** — Principle III and the new
  "Backend Architecture Invariants" subsection
  (`.specify/memory/constitution.md`).
- ADR-0001 — PostgreSQL as the persistence engine.
- ADR-0002 — SQLAlchemy async + asyncpg driver.
- ADR-0003 — Specific AWS service deferred.
- ADR-0004 — UUID v7 + `timestamptz` UTC + no extensions.
- ADR-0005 — LocalStack adoption deferred.
- Backend architecture playbook (`docs/backend/architecture.mdx`).
- Comparative review of `b3stocks` vs. campfire
  (`specs/002-backend-auth-slice/analysis/architecture-review.md`).
