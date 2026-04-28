**Backend (`apps/api/`)**
- Python 3.12 (`>=3.12,<3.13`), package manager **`uv`** (NOT pip/poetry)
- FastAPI 0.115, Pydantic 2.x + pydantic-settings, SQLAlchemy 2.x async + asyncpg
- Alembic for migrations (hand-written; "no autogenerate without review")
- argon2-cffi (passwords), python-jose (JWT), httpx (Deezer adapter only — banned elsewhere)
- uuid-utils (UUID v7)
- pytest + pytest-asyncio (`asyncio_mode = "auto"`), Testcontainers Postgres for integration
- ruff (line-length 100, py312, rules `E,F,I,TID251,UP,B,ASYNC`), mypy

**Frontend (`apps/web/`)**
- TypeScript 5.x strict (no JS), React 19.2, Vite 8, plain CSS (no Tailwind / CSS-in-JS)
- lucide-react icons
- No state library; per-feature stores under `features/<slice>/store/`
- Path aliases (mirrored in `tsconfig.json` and `vite.config.ts`):
  `@app @pages @features @shared @i18n @theme @api @mocks @styles @assets`
- API client at `src/api/client.ts`: bearer-token + automatic refresh-on-401, optional `VITE_AUTH_FALLBACK=session-storage` for hosts that drop httpOnly cookies. Uses `VITE_API_URL` (default `http://localhost:8000`).

**Database**: Postgres 16 (Alpine) via `docker-compose.yml` — service name `postgres`, default creds `campfire/campfire`. Tests use Testcontainers by default; set `TEST_BACKEND=compose` to point at the running compose DB instead.

**Docs**: Mintlify (`docs/docs.json`, `mint dev` from `docs/`).

**MCP servers wired** (`.mcp.json`): serena (ide-assistant context), filesystem (rooted at repo), aws-docs, mintlify (placeholder until site is generated via `npx mint-mcp add <siteId>`).
