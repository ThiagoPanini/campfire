**Slice anatomy** (`apps/web/src/features/<slice>/`):
```
features/<slice>/
├── index.ts          # Public surface — components + store + types + catalogs
├── types.ts
├── catalogs.ts       # Single source of truth, mirrored from backend (e.g. PROFICIENCY_LEVELS)
├── api/<slice>.api.ts        # Thin wrapper over @api/client request<T>()
├── api/<slice>.mock.ts       # Optional mock for FE-first delivery (constitution Principle II)
├── store/<slice>.store.ts    # Plain hook-based store; no Redux/Zustand
└── components/*.tsx
```
Existing slices: `auth/` (sessionStore + SignInForm/SignUpForm), `onboarding/`, `repertoire/`.

**Pages** live in `apps/web/src/pages/*.tsx` and compose feature components. Routing is hand-rolled in `apps/web/src/app/App.tsx` with a `RouteId` enum + `pushState`/`popstate` (no router lib).

**Auth gating**: `RequireAuth` guard in `app/router/guards.tsx`. Protected routes: `home`, `repertoire`, `onboarding`. The `useSessionStore` hook owns auth state, language (EN/PT), and accent preset.

**i18n**: pure object lookup at `src/i18n/locales/{en,pt}.ts`, accessed via `translate(language)`. Keys are nested namespaces (e.g. `repertoire.empty.title`). When adding strings, ALWAYS add to both EN and PT in the same change.

**Styling**: plain CSS in `src/styles/global.css`; design tokens (colors, spacing, motion) live there. Accent presets are CSS custom properties (`--cf-accent`, `--cf-accent-dark`) toggled in `App.tsx` from the session store. Respect `prefers-reduced-motion: reduce`.

**Path aliases** (must match in `vite.config.ts` AND `tsconfig.json`): `@app @pages @features @shared @i18n @theme @api @mocks @styles @assets`. When adding a new top-level dir under `src/`, register it in BOTH files.

**API client conventions** (`@api/client`): export `request<T>(path, init?)`, `setAccessToken`, `getAccessToken`, `ApiError`. Bearer token attached automatically; 401s auto-trigger `/auth/refresh` once before propagating. `VITE_AUTH_FALLBACK=session-storage` enables a sessionStorage refresh token for hosts that drop httpOnly cookies (XSS trade-off documented inline).
