**Project**: Campfire — private music hub for small, informal music circles. Solo-builder MVP; AI-heavy workflow.

**Three sanctioned MVP user jobs** (constitution Principle I — anything else is out of scope until amended):
1. record songs a user already knows
2. capture songs the user is still learning
3. share that repertoire with a small circle

**Repo shape** (monorepo):

```
apps/
├── api/   # Python 3.12 FastAPI backend (uv-managed)
└── web/   # React 19 + Vite + TypeScript SPA
docs/      # Mintlify docs-as-code (mint dev)
specs/     # Spec Kit feature folders (NNN-slug/)
.specify/  # Spec Kit templates + constitution
.github/   # GitHub Actions CI/CD (ci.yml, deploy-{develop,production}.yml)
render.yaml # Develop + Production environments on Render
```

**Active feature branch (as of 2026-05-01)**: `006-google-auth-login-ux`. Authoritative plan for the in-flight slice is always pointed to by `AGENTS.md` (and its `CLAUDE.md` symlink) inside the `<!-- SPECKIT START --> … <!-- SPECKIT END -->` markers — re-read that block whenever the branch changes.

**Backend bounded contexts shipped**:
- `identity` — auth (password + Google OAuth), sessions, refresh tokens, email confirmation, account linking.
- `repertoire` — song catalog search via Deezer + per-user entries.
Both live under `apps/api/src/campfire_api/contexts/<name>/{domain,application,adapters}/`.

**Frontend feature slices shipped**: `auth/` and `repertoire/` under `apps/web/src/features/`. The earlier `onboarding/` slice was removed during the auth UX rebuild (slice 006); `/onboarding` is kept in `routes.ts` as a stale-redirect to landing/home.

**Slices delivered** (chronological):
- 001 frontend MVP prototype (FE-only — superseded by real backend)
- 002 backend auth slice (identity context, password auth, sessions)
- 003 repertoire song entry (repertoire context, Deezer adapter)
- 004 app home redesign
- 005 CI/CD pipeline (GitHub Actions + Render deploy hooks)
- 006 Google auth + login UX (real Google OIDC, email confirmation, password UX)

**Audit (2026-05-01)**: see [`AUDIT.md`](../../../../../workspaces/campfire/AUDIT.md) at repo root, plus `project/open-risks-2026-05-01` memory. The architecture is solid; eight focused auth-hardening fixes (security S-1..S-7, contract C-1, persistence Q-1) are tracked there for a Wave 1 round before the next feature.
