**Backend hexagonal + DDD invariants — enforced by tests AND by ruff. Violations break CI, not just review.**

Authoritative source: `.specify/memory/constitution.md` (v1.1.0) → "Backend Architecture Invariants". Companion: `docs/backend/architecture.mdx`, ADR-0006.

1. **Slicing by bounded context**: code lives under `apps/api/src/campfire_api/contexts/<name>/{domain,application,adapters}/`. A new context is a sibling folder, never a refactor.
2. **Layer purity** is enforced by `apps/api/tests/unit/test_architecture.py`. It walks every `contexts/*/{domain,application}/` and fails if any file imports `fastapi`, `sqlalchemy`, `argon2`, `jose`, or `httpx`. To add a new context, this test "just works" — no edit needed.
3. **Cross-context imports**: ONLY identifier value objects (e.g. `UserId`). Never another context's entities, ORM rows, repositories, or use cases. Repertoire imports `from campfire_api.contexts.identity.domain.value_objects import UserId` — that is the single allowed surface.
4. **Errors**: domain/application raise a `<Context>Error` hierarchy. Translation to HTTP happens in `adapters/http/error_mapping.py` via `register_<context>_error_handlers(app)`. Use cases NEVER raise `HTTPException`.
5. **Transactions**: opened/closed by the adapter (e.g. `get_*_repositories` FastAPI dep). Use cases never call `session.commit()`.
6. **Validation lives where it protects**: Pydantic at HTTP transport, value objects/entities for domain invariants — NOT both. Domain wins; HTTP is a fast-fail UX hint.
7. **Settings + time are ports**: read config via `SettingsProvider` Protocol, time via `Clock` Protocol. No `os.getenv`, no `datetime.utcnow()`, no hard-coded URLs in `domain/`/`application/`.

**Ruff `flake8-tidy-imports.banned-api`** (in `apps/api/pyproject.toml`) bans `sqlalchemy / fastapi / argon2 / jose / httpx` repo-wide; the `[tool.ruff.lint.per-file-ignores]` block whitelists adapter folders. When you add a new adapter folder, you must whitelist it there too — otherwise `make lint` fails.

**Persistence wiring quirk**: both contexts share one SQLAlchemy `Base` declared in `identity/adapters/persistence/models.py` and re-imported by `repertoire/adapters/persistence/models.py`. Adapter→adapter import is allowed (invariant 3 governs domain, not adapters). When context #3 lands, lift `Base` to `shared/persistence/base.py` — see "Complexity Tracking" in the 003 plan for the trigger.

**Shared catalogs**: cross-context vocabularies live in `apps/api/src/campfire_api/shared/catalogs.py`. Identity re-exports `INSTRUMENTS` from there for backward compat. New shared vocab goes here, not in either context.

**OpenAPI snapshots**: each slice owns one snapshot in `specs/NNN-slug/contracts/openapi.json`. Identity's full-app snapshot regenerates whenever new routers ship; per-slice snapshots assert subset-presence. Drift fails CI via `apps/api/tests/contract/test_*_openapi_snapshot.py`. Regenerate with `make openapi-snapshot`.
