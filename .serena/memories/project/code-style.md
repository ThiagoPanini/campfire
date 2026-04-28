**Python (`apps/api/`)**
- Python 3.12, ruff line-length 100, target-version `py312`, rules `E,F,I,TID251,UP,B,ASYNC` (B008 ignored — FastAPI deps trip it).
- mypy strict-ish: `warn_return_any`, `warn_unused_configs`, `ignore_missing_imports`.
- pytest markers (must be applied; see `pyproject.toml`): `unit`, `integration`, `contract`. `asyncio_mode = "auto"` — don't decorate `@pytest.mark.asyncio`.
- Naming: `snake_case` modules, `PascalCase` classes, value objects/entities under `domain/value_objects.py` & `domain/entities.py`, ports under `domain/ports.py` (Protocol classes).
- Use cases: one class or callable per file under `application/use_cases/<verb_noun>.py`.
- Adapters: subdir per concern (`http/`, `persistence/`, `security/`, `clock/`, `rate_limiting/`, `caching/`, `catalog/`).
- `from __future__ import annotations` is used across `domain/` so Pydantic-free dataclasses can self-reference.
- IDs use UUID v7 via `uuid_utils` (ADR-004).

**TypeScript (`apps/web/`)**
- TS strict, ES2022, JSX `react-jsx`, module `ESNext`, moduleResolution `Bundler`, no JS allowed.
- `PascalCase.tsx` for React components, `camelCase.ts` for utilities/data, `UPPER_CASE` for module-level constants.
- Imports use path aliases (`@features/...`, `@api/...`) NOT relative `../../`.
- One component per file; co-locate styles in `src/styles/global.css` rather than per-component CSS.
- Per-feature `index.ts` is the public surface — only export what other slices/pages need.

**Commits**: conventional-style scoped messages already in use — `feat(api):`, `feat(web):`, `test(api):`, `style(web):`, `chore(...):`. Use `/git-commit` skill.

**Do NOT**:
- Add `any`, inline styles, or new top-level deps without a plan-level note.
- Introduce new state-management libs, CSS-in-JS, GraphQL, message queues, Redis, or NoSQL — Principle III pins the stack.
- Volunteer Playwright/Cypress/k6/etc. — Principle IV defers them.
