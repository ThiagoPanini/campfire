**Project**: Campfire — private music hub for small, informal music circles. Solo-builder MVP; AI-heavy workflow.

**Three sanctioned MVP user jobs** (constitution Principle I — anything else is out of scope until amended):
1. record songs a user already knows
2. capture songs the user is still learning
3. share that repertoire with a small circle

**Repo shape** (monorepo, NOT frontend-only — older memories that say "frontend-only prototype" are wrong):

```
apps/
├── api/   # Python 3.12 FastAPI backend (uv-managed)
└── web/   # React 19 + Vite + TypeScript SPA
docs/      # Mintlify docs-as-code (mint dev)
specs/     # Spec Kit feature folders (NNN-slug/)
.specify/  # Spec Kit templates + constitution
```

**Active feature branch (as of last session)**: `003-repertoire-song-entry`. Authoritative plan for the in-flight slice is always pointed to by `AGENTS.md` (and its `CLAUDE.md` symlink) inside the `<!-- SPECKIT START --> … <!-- SPECKIT END -->` markers — re-read that block whenever the branch changes.

**Backend bounded contexts shipped**: `identity` (auth, sessions, preferences) and `repertoire` (song catalog search via Deezer + per-user entries). Both live under `apps/api/src/campfire_api/contexts/<name>/{domain,application,adapters}/`.

**Frontend feature slices shipped**: `auth/`, `onboarding/`, `repertoire/` under `apps/web/src/features/`.
