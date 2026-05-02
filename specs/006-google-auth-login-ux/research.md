# Research: Google Authentication and Login Experience Improvements

**Phase**: 0 (decisions + rationale)
**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

This document resolves every `NEEDS CLARIFICATION` raised during planning. Each section follows the format **Decision / Rationale / Alternatives considered**. References to repository code use `path:line` form so each claim is verifiable.

---

## R1 — Google integration: server-side, client-side, or split?

**Decision**: 100% server-side. The browser only ever sees a redirect to Google and a redirect back to the API; the API alone holds the client secret, performs the code-for-tokens exchange, verifies the ID token, and creates the session.

**Rationale**:
- The existing identity context is built around opaque server-issued tokens with an httpOnly refresh cookie — never a JWT or provider token in the browser. Mixing a client-side Google SDK ("Google Identity Services" / GSI button + ID-token POST) would create a parallel trust path the rest of the system doesn't know how to reason about.
- The spec's clarification answer pinned this explicitly: *"Backend-owned OAuth Authorization Code + PKCE redirect/callback flow"*.
- Server-side keeps the client secret out of the browser bundle and out of the static-site build artifact (Render serves the SPA as plain static files — anything in `import.meta.env.VITE_*` is shipped to the client).
- ID-token verification is centralized: one `GoogleIdentityProvider` adapter in `adapters/oauth/`, one place to roll keys, one place to extend (Apple, GitHub, etc.) without touching the SPA.

**Alternatives considered**:
- *GSI client-side ID token + backend verify-only*: smaller backend surface, but ties UX to Google's button widget, leaks the client ID to the browser (acceptable, but unnecessary), and the popup/redirect mode handling becomes a frontend concern. Rejected for inconsistency with the current opaque-token model.
- *Hybrid (frontend launches popup, backend exchanges code)*: gains nothing over pure backend-owned, splits the failure surface across two layers.

---

## R2 — Authorization Code + PKCE flow shape

**Decision**:

1. **Start (`POST /auth/google/start`)**: client posts `{ intent: "sign-in" | "sign-up", next?: string }`. Server validates `next` (same-origin, leading `/`, no `//`, no `://`), generates `state_id` (UUID), `state_secret` (32 bytes urlsafe), `code_verifier` (96 bytes urlsafe → `code_challenge = base64url(sha256(verifier))`), `nonce` (32 bytes urlsafe). Stores a row in `oauth_flow_states` keyed by `state_id`, with `state_token_hash = HMAC-SHA256(server_pepper, state_secret)`, `pkce_verifier`, `nonce_hash = HMAC-SHA256(server_pepper, nonce)`, `intent`, `return_to`, `created_at`, `expires_at = now + 10 min`. Sets a cookie `campfire_oauth_state={state_id}.{state_secret}` with `Path=/auth/google`, `HttpOnly`, `Secure` (per `REFRESH_COOKIE_SECURE`), `SameSite=lax`, `Max-Age=600`. Returns `200 { authorize_url }`. Browser navigates.
2. **Authorize URL**: `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=…&redirect_uri=${API}/auth/google/callback&scope=openid%20email%20profile&code_challenge=…&code_challenge_method=S256&state=${state_id}&nonce=…&prompt=select_account&access_type=online`. We do NOT request offline access (no refresh tokens from Google) — Campfire's own refresh-token machinery owns session lifetime.
3. **Callback (`GET /auth/google/callback?code&state` or `?error`)**: server reads `campfire_oauth_state` cookie → splits into `(state_id, state_secret)` → loads row by `state_id` → checks `consumed_at IS NULL` → checks `expires_at > now` → recomputes `HMAC-SHA256(server_pepper, state_secret)` and compares against `state_token_hash` (constant-time) → checks query `state == state_id`. On any mismatch: mark consumed (`consumed_reason='invalid'`), 302 to `${WEB}/signin?auth_error=google_failed`. On `?error=` (user cancelled / Google denied): 302 to `${WEB}/signin?auth_error=google_cancelled` if `error=access_denied`, else `google_failed`. On success: POST to `https://oauth2.googleapis.com/token` with `code`, `client_id`, `client_secret`, `redirect_uri`, `grant_type=authorization_code`, `code_verifier`. Verify the returned `id_token` with `google.oauth2.id_token.verify_oauth2_token(token, requests.Request(), audience=client_id, clock_skew_in_seconds=10)` (this also fetches/caches Google's JWKS). Compare `claims["nonce"]` to the stored nonce via HMAC. Reject if `email_verified != true`. Mark the row consumed. Run `CompleteGoogleSignIn(google_subject, google_email, google_name, intent, return_to)` use case → opens session via `IssueSession`. Set the existing refresh cookie. 302 to `${WEB}${return_to or /home}?auth=ok`.
4. **Frontend post-redirect**: SPA loads, `useSessionStore` mounts → calls `POST /auth/refresh` with `credentials: 'include'` → gets a fresh access token from the just-set refresh cookie → navigates to the captured `return_to`.

**Rationale**:
- The existing refresh cookie is already cross-origin (`SameSite=none; Secure` in dev/prod per `render.yaml`) and scoped to `Path=/auth/refresh`. Reusing it means zero new cookie surface for the access path.
- Sending the access token through `/auth/refresh` (instead of in a URL fragment) avoids the classic "OAuth-redirect leaks the token to history/referrer/server logs" footgun.
- A second, narrowly-scoped state cookie (`Path=/auth/google`) avoids polluting unrelated requests and stays well below browser per-domain cookie limits.
- 10-minute flow expiry matches Google's recommendation; longer windows enlarge the replay window for stolen state values; shorter risks slow users.
- `prompt=select_account` lets users switch Google accounts and is a common UX expectation.
- `access_type=online` signals to Google we don't want a refresh token, simplifying our trust boundary.

**Alternatives considered**:
- *Stateless signed JWT for the state*: avoids a DB row but forces JWS in the identity layer (currently no JWT use anywhere) and complicates one-shot consumption (we'd need a server-side blacklist anyway). Rejected — a row in Postgres is cheaper.
- *Frontend route as redirect URI*: forces the SPA to handle code-for-tokens or a transient ticket; drags the client secret toward the browser; needs another endpoint to do the exchange anyway. Rejected.
- *Pass `next` through Google's `state` (signed)*: works but couples our payload format to a third party's URL grammar. We pass only an opaque ID; the server is the source of truth for `return_to`.

---

## R3 — ID-token verification library

**Decision**: Add `google-auth>=2,<3` (one pin). Use `google.oauth2.id_token.verify_oauth2_token(...)`, which:
- fetches and caches Google's JWKS (`https://www.googleapis.com/oauth2/v3/certs`),
- verifies signature, `iss in {"accounts.google.com", "https://accounts.google.com"}`, `aud == client_id`, `exp` with skew,
- exposes the parsed claims dict for our own checks (`email_verified`, `nonce`, `sub`, `email`, `name`).

**Rationale**: Official, narrow-surface, maintained by Google, already used by ~every Python OIDC integration. Hand-rolling on `python-jose` (already a dep) means we own JWKS rotation, key selection, algorithm whitelisting, and clock-skew handling — all known footguns. The spec's confidentiality / no-leakage requirements make a verified-by-Google library safer than a hand-rolled one.

**Alternatives considered**:
- *python-jose only*: free of new deps, costs us correctness risk. Rejected.
- *authlib*: pulls in a much bigger surface (frameworks, clients, JWS, JWE, JWA, etc.) for a single endpoint we already implement by hand. Rejected.
- *google-auth-oauthlib*: wraps `requests-oauthlib`, sync-only, would need a thread offload. Rejected — we already use `httpx` for the token POST.

---

## R4 — State / nonce / CSRF strategy

**Decision**: Server-side `oauth_flow_states` row + browser-bound `campfire_oauth_state` cookie. PKCE verifier stored plaintext server-side (it is a single-use, short-lived secret never sent to the client). `state` and `nonce` stored as HMAC digests using a server pepper (`OAUTH_FLOW_HMAC_KEY`). Mismatches collapse to a single generic "Google sign-in failed" 302.

**Rationale**:
- HMACing the state value at rest means a leaked DB snapshot doesn't hand the attacker valid in-flight states; the live cookie is required to consume the row.
- PKCE bound by `code_verifier` (server-only) defeats the canonical authorization-code-interception attack even if `state` were guessable.
- Storing the verifier plaintext is acceptable because the row is wiped on consume and on `expires_at` sweeps; encrypting at rest would add a key-management layer for negligible benefit on a 10-minute single-use secret. (Documented as an explicit non-goal.)

**Alternatives considered**:
- *Argon2-hash the verifier*: it'd be one-way, but PKCE verification at the Google token endpoint requires sending the verifier in plaintext — we have to keep it in a recoverable form anyway. Rejected.
- *Symmetric encryption at rest*: postpones the threat model question to "where do we store the key" without changing it; not worth the operational cost on a 10-minute row.

---

## R5 — Account linking model

**Decision**: Link by **Google subject**, not by email.

Algorithm in `CompleteGoogleSignIn(google_subject, google_email_lc, google_name, intent)`:

```
link = ProviderLinkRepository.get(provider="google", subject=google_subject)
if link:
    user = UserRepository.get_by_id(link.user_id)
    return IssueSession(user.id)

# subject not seen before — try email
user = UserRepository.get_by_email(Email(google_email_lc))
if user is None:
    user = User(id=new_id(), email=google_email_lc, display_name=DisplayName.from_google(google_name),
                email_confirmed_at=now)
    UserRepository.add(user)
elif user.email_confirmed_at is None:
    # unconfirmed password account being upgraded by Google's verification
    EmailConfirmationRepository.invalidate_pending_for(user.id, reason="upgraded_by_google")
    user.email_confirmed_at = now; UserRepository.update(user)

ProviderLinkRepository.add(ProviderLink(user_id=user.id, provider="google",
                                        subject=google_subject, email_at_link=google_email_lc))
return IssueSession(user.id)
```

Linking does NOT touch `credentials` — the password row, if any, is preserved and continues to work (FR-011).

**Rationale**:
- Google subjects are stable across email changes (FR-004); emails are not.
- Allowing a verified Google email to take over an unconfirmed account is safe because (a) Google has verified it and (b) the unconfirmed Campfire account never granted any access.
- Refusing to link to a *confirmed* password account would block a real user's Google sign-in for no good reason; both credentials co-existing is the desired outcome (FR-009, FR-011).

**Alternatives considered**:
- *Require explicit "link your Google account" inside a logged-in profile screen first*: better intuitively but the spec says no profile management screen and explicitly forbids asking for the password inside the Google flow (FR-009). Rejected.
- *Refuse linking when a password account already exists*: forces account duplication, breaks FR-009.

---

## R6 — Email confirmation model

**Decision**:

- Sign-up creates the user with `email_confirmed_at = NULL`, persists the `password_hash` (Argon2id, unchanged from today), and inserts a `email_confirmations` row in status `pending` with `code_hash = HMAC-SHA256(EMAIL_CONFIRMATION_HMAC_KEY, code)`, `expires_at = now + 15 min`, `attempt_count = 0`, `resend_count = 0`. Sends the code via `EmailSender` and **does NOT issue a session**. Returns 202 with a neutral body (no enumeration).
- `POST /auth/confirm { email, code }`:
  1. Lookup user by email; if not found → return generic 400 `confirmation invalid` (no enumeration).
  2. Lookup latest `pending` confirmation for `(user.id, lower(email))`; if none → same generic 400.
  3. If `expires_at <= now` → mark `expired`, generic 400.
  4. If `attempt_count >= MAX_ATTEMPTS` (5) → mark `invalidated` reason `attempts_exceeded`, generic 400.
  5. Compare `HMAC(code_input)` to stored `code_hash` constant-time:
     - mismatch → `attempt_count += 1`, generic 400.
     - match → mark `verified`, set `user.email_confirmed_at = now`, call `IssueSession(user.id)`, set refresh cookie, return access token.
- `POST /auth/confirm/resend { email }`:
  1. Lookup user; if not found OR confirmed → 202 with neutral body (no enumeration).
  2. Latest `pending` row → if `last_resent_at + 60s > now` → return generic 429.
  3. If sliding-1-hour `resend_count >= 3` → return generic 429.
  4. Mark old row `invalidated` reason `resent`, insert new row with new code, send via `EmailSender`. Return 202.
- Codes are 6 ASCII digits (`secrets.choice("0123456789")` × 6, leading zeros allowed). Rendered in email as a fixed-width string for clarity.
- Email content: subject is internationalized (`en` / `pt`); body contains the code, the expiry, and a short security note. **No links**, **no internal IDs**, **no tokens** — exactly per FR-019.
- Notification-on-existing-confirmed-account (FR-017): `RegisterUser` detects `EmailAlreadyRegistered` and instead enqueues a `someone_tried_signup` notification through the same `EmailSender` (no code attached); the API response is identical to a fresh sign-up.

**Rationale**:
- 6-digit numeric balances UX (mobile typing) with a verifier-side brute-force cap that 5 attempts × short-lived codes makes negligible.
- HMAC (not Argon2) is correct here because the input space is 10⁶ and the per-code rate cap (5) is the security boundary; Argon2's slowness would punish honest verifiers without buying anything.
- Storing only the digest means a leaked DB snapshot does not yield codes (FR-036).
- The 60-second cooldown + 3-per-hour cap stops the most common abuse (hammering resend to mass-mail a target) while letting honest users recover from a typo.
- Server-side caps in Postgres survive the in-memory rate limiter being process-local on Render.

**Alternatives considered**:
- *Magic link instead of code*: lower keystrokes for the user, but requires a deep-linkable URL (couples to web routing), opens phishing surface, and forces email rendering policy beyond plain text. Rejected for MVP.
- *Argon2 the code*: defensible but actively harmful as analyzed above.
- *Per-IP-only resend cap (in-memory)*: insufficient — Render restarts wipe the limiter; spec wants per-account caps.

---

## R7 — Required schema changes & migration

**Decision**: One new Alembic migration `0002_identity_oauth_and_confirmation` that:

1. Adds `users.email_confirmed_at TIMESTAMPTZ NULL`.
2. Backfills `UPDATE users SET email_confirmed_at = created_at WHERE email_confirmed_at IS NULL` so all pre-existing accounts are treated as confirmed (FR-026, FR-030, SC-005).
3. Creates `provider_links`, `email_confirmations`, `oauth_flow_states` per [data-model.md](./data-model.md).
4. Does **not** drop `/auth/google-stub` or any existing column. `google_stub_sign_in.py` is kept (`GOOGLE_STUB_ENABLED=false` in prod via `render.yaml`) so integration tests can still exercise an "external Google" without hitting Google.

**Rationale**: Backfill + additive schema = zero downtime, zero session invalidation on deploy (FR-030). Keeping the stub avoids re-architecting the integration test suite and gives operators a tested fallback path while real Google is being rotated.

**Alternatives considered**:
- *Two migrations (one for users column, one for new tables)*: gains nothing on a feature that ships atomically; doubles the rollback surface.
- *Drop the stub now*: the spec says "replace" but FR-005 also requires a working "Google off" path; the stub is exactly that path for tests. Removal is a follow-up, not part of this slice.

---

## R8 — Session issuance/reuse for Google + confirmed password users

**Decision**: Extract the access-token + refresh-token + Session row creation block out of `AuthenticateUser` into a new `IssueSession(user_id) → IssuedSession` use case. `AuthenticateUser`, `ConfirmEmail`, and `CompleteGoogleSignIn` all call it. The HTTP routers continue to call `set_refresh_cookie(...)` with the existing helper — no new cookie attributes, no new TTLs.

**Rationale**: One place owns the session-issuance invariant (fingerprint uniqueness, family-id generation, expiry math) so Google sessions and password sessions are byte-for-byte identical from the rest of the system's perspective. Tests asserting equivalence (FR-035 a/b) become trivial.

**Alternatives considered**: Inline the duplication into each use case. Rejected — invites drift.

---

## R9 — Redirect handling

**Decision**:

- **Capture** (frontend): on any guarded route render where the user is unauthenticated, push the current `pathname + search` to `sessionStorage["auth.next"]` (NOT `localStorage` — it has to die when the tab dies) and navigate to `/signin`.
- **Sanitize** (frontend `redirect.ts` and backend in `start_google_sign_in`): a path is acceptable iff `value.startsWith("/")` AND NOT `value.startsWith("//")` AND `"://" not in value`. Anything else collapses to `/home`.
- **Password path**: after a successful login, the SPA pops `sessionStorage["auth.next"]` and navigates there.
- **Google path**: `next` is sent in the `POST /auth/google/start` body, server re-sanitizes, server stores it in `oauth_flow_states.return_to`, server uses it on the final 302. The browser-side `sessionStorage["auth.next"]` is cleared on `start`.
- **Sign-up confirmation path**: after `POST /auth/confirm`, the SPA falls back to `/home` (a fresh sign-up never has a captured `next` worth preserving; the user came in via `/signup`).
- **Sign-out**: server revokes session + clears refresh cookie; client clears in-memory access token + `sessionStorage["auth.next"]`; navigates to `/`.
- **`auth_error=` / `auth=ok` query params**: stripped from the URL after the SPA reads them (`history.replaceState`) so they don't pollute deep-link sharing.

**Rationale**: `sessionStorage` is the right scope for "where did I come from in this tab". A server-side store would be over-engineered for a same-origin redirect within a static SPA. Stripping query params keeps the URL bar clean.

**Alternatives considered**:
- *URL `?next=…` everywhere*: leaks the path through referrer headers when the user copies a Google-error link. `sessionStorage` is private to the tab.
- *Server-set cookie for `next`*: introduces a third auth-related cookie. Not worth it.

---

## R10 — Frontend UX updates

**Decision**:

- **`PasswordField`** (new): `<input type={visible ? "text" : "password"}>` with a sibling `<button type="button" aria-pressed={visible} aria-label={visible ? t.auth.hidePassword : t.auth.showPassword}>` rendering Lucide `Eye` / `EyeOff`. Toggling preserves caret position via `inputRef.current.setSelectionRange(start, end)` after switching `type`. Default `visible=false`. Toggle is keyboard-operable (`Tab` reaches it, `Enter`/`Space` activates).
- **Live validation** (`validation.ts`): email rule unchanged; password rule extended to:
  - length ≥ 10 (was ≥ 8 — applied at sign-up only),
  - chars from at least 3 of 4 classes (`[a-z]`, `[A-Z]`, `[0-9]`, `[^A-Za-z0-9]`),
  - not in a small embedded blocklist of common passwords (top ~25, bundled — no network call).
- **`PasswordStrengthHint`** (new): under the password field on sign-up, shows three faint pill chips "10+", "3 of 4 classes", "not common". Each turns solid + green when its rule is met. No raw score, no bar — keeps the check explainable.
- **Generic credential error**: the same i18n key (`t.auth.errors.credentials`) is shown for every login-time failure (wrong password, unknown email, unconfirmed, Google-only, unverified-google-email). One exception per spec: an `unconfirmed=true` flag on the response (returned ONLY when the email matches an unconfirmed account that the user just submitted) flips the form into "we sent you a confirmation code — resend it?" mode. **This must NOT be visible to an attacker probing arbitrary emails** — the flag is set only when the submitted email + password pair would otherwise have succeeded. (Implementation: server runs `verify_password` first; only if it returns true AND the user is unconfirmed do we set the flag — so the flag itself implies the attacker already had the password, which means we're not leaking enumeration data.)
- **Loading state**: `submitting` flag drives a spinner inside the active button (Lucide `Loader2`, `aria-busy=true`); the button is `aria-disabled=true` but stays focusable. Other auth controls (the alternate Google button, swap-form link, cancel) remain operable.
- **Confirm-email page**: 6 input boxes wired to a single state via a small controller (paste-friendly: pasting `123456` fills all 6); `inputMode="numeric"`, `autocomplete="one-time-code"`, `pattern="\d*"`. Submit is automatic on the 6th digit. Resend button is rate-limit aware: starts disabled, enables after the server's `Retry-After` window.
- **Google button visibility**: `useSessionStore` calls `GET /auth/config` once on mount; if `google.enabled=false`, both forms render the button as disabled with a `title`/`aria-describedby` tooltip explaining "Google sign-in is not configured for this environment" (operator-targeted, not user-blame phrasing). Web buttons are hidden in production when disabled and shown disabled in dev — controlled by a single `t.auth.googleUnavailable` string.
- **i18n**: every new string is added to both `apps/web/src/i18n/locales/en.ts` and `pt.ts`. A small CI-time check (added in `npm run typecheck` via TS exhaustiveness on the locale shape — already a strict struct) catches missing keys.

**Rationale**: Each new control mirrors a WCAG 2.1 AA pattern; the spec's enumeration-resistance rule is enforced server-side and explicitly NOT relaxed by the "we sent a code" affordance because the affordance is gated on a successful password verify.

**Alternatives considered**: A password-strength meter showing entropy bits — visually nice but explicable only to engineers; rejected in favor of three explicit rules.

---

## R11 — Environment variables & secrets

**Decision**: All new settings are added to `EnvSettings` and surfaced through `SettingsProvider`:

| Var | Default | Purpose |
|---|---|---|
| `GOOGLE_OAUTH_ENABLED` | `false` | Master switch. When false, `/auth/google/start` returns 503 and `/auth/config` reports `google.enabled=false`. |
| `GOOGLE_OAUTH_CLIENT_ID` | (unset) | Google OAuth client ID. Required when enabled. |
| `GOOGLE_OAUTH_CLIENT_SECRET` | (unset) | Google OAuth client secret. Required when enabled. |
| `GOOGLE_OAUTH_REDIRECT_URI` | `http://localhost:8000/auth/google/callback` | Must match the URI registered with Google. Per environment. |
| `WEB_BASE_URL` | `http://localhost:5173` | Where the API redirects users after the Google callback. Per environment. |
| `OAUTH_FLOW_HMAC_KEY` | (unset, required when Google enabled) | 32-byte secret (base64) for HMACing state/nonce digests. |
| `OAUTH_FLOW_TTL_SECONDS` | `600` | OAuth flow window. |
| `EMAIL_CONFIRMATION_REQUIRED` | `true` | When false, falls back to the pre-feature behavior (sign-up issues a session immediately). Kept for emergency rollback only. |
| `EMAIL_CONFIRMATION_HMAC_KEY` | (unset, required when enabled) | 32-byte secret for HMACing stored confirmation codes. |
| `EMAIL_CONFIRMATION_TTL_SECONDS` | `900` | 15 min. |
| `EMAIL_CONFIRMATION_MAX_ATTEMPTS` | `5` | Per-code attempt cap. |
| `EMAIL_CONFIRMATION_RESEND_COOLDOWN_SECONDS` | `60` | Min seconds between resends. |
| `EMAIL_CONFIRMATION_RESEND_HOURLY_CAP` | `3` | Per-account, sliding 1h. |
| `MAIL_BACKEND` | `console` | `console` (dev) or `http` (prod). |
| `MAIL_HTTP_URL` | (unset) | Provider HTTP endpoint when `MAIL_BACKEND=http`. |
| `MAIL_HTTP_API_KEY` | (unset) | Provider API key. |
| `MAIL_FROM` | `noreply@campfire.local` | Per environment. |
| `MAIL_OUTBOX_DIR` | `tmp/mail/` | Where the console mailer drops `.eml`-like files for developer retrieval. Local-dev only. |
| `GOOGLE_STUB_ENABLED` | `false` (was `true`) | Default-flipped: production keeps it off; tests enable it via fixture. |

**Render `render.yaml` deltas**:
- Dev API: `GOOGLE_OAUTH_ENABLED=true`, `GOOGLE_OAUTH_REDIRECT_URI=https://campfire-api-dev.onrender.com/auth/google/callback`, `WEB_BASE_URL=https://campfire-dev.onrender.com`, `MAIL_BACKEND=console` (or `http` once a sandbox provider exists), `EMAIL_CONFIRMATION_REQUIRED=true`. `OAUTH_FLOW_HMAC_KEY` / `EMAIL_CONFIRMATION_HMAC_KEY` / `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` / `MAIL_HTTP_API_KEY` declared without values (`sync: false`) so they are set via the Render dashboard.
- Prod API: same shape, prod URLs, prod credentials.
- Static sites: no new vars (`/auth/config` is a runtime probe).

**Rationale**: Defaults are safe-when-unset (`GOOGLE_OAUTH_ENABLED=false`). Required-when-enabled vars are validated at app startup (`EnvSettings.model_post_init`) with a fail-fast `RuntimeError` so a half-configured deploy never silently falls back to broken behavior. Secrets stay in Render's secret store (already the constitutional pattern; `.env` only locally).

**Alternatives considered**: Single `GOOGLE_OAUTH_CONFIG` JSON blob — concise but harder to rotate one piece at a time on Render's per-key UI. Rejected.

---

## R12 — Fallback when Google is disabled / misconfigured

**Decision**:

- **Disabled** (`GOOGLE_OAUTH_ENABLED=false`): `/auth/google/start` → `503 google sign-in unavailable` (existing `GoogleSignInUnavailable` body). `/auth/google/callback` → same. `/auth/config` → `{ google: { enabled: false } }`. Web hides the button or renders it disabled (per R10).
- **Misconfigured** (enabled but a required var unset): app fails to start. Loud > silent.
- **Runtime failure** (Google network down, JWKS fetch failure, signature mismatch, audience mismatch, unverified email, expired flow row, mismatched state cookie): all collapse to `GoogleSignInFailed` → 302 to `${WEB}/signin?auth_error=google_failed`. Server logs include a single redacted line `[google_oauth] failure reason=<short_code>` where `short_code` is one of an enumerated set (no token bytes, no email, no claims dump).
- **Password auth always works** when Google is off — verified by `test_google_disabled_falls_back.py`.

**Rationale**: Operators need a one-knob kill switch; users need an unambiguous, non-alarming error; logs need enough breadcrumb to diagnose without leaking material.

---

## R13 — Test strategy

**Decision**: Mirror existing layout under `apps/api/tests/{unit,integration,contract}/identity/`.

Backend coverage (FR-035 mapped to test files):

| Test file | Marker | Asserts |
|---|---|---|
| `unit/identity/test_start_google_sign_in.py` | `unit` | `next` sanitization, state cookie + row contents, returned `authorize_url` shape. |
| `unit/identity/test_complete_google_sign_in.py` | `unit` | new-user creation; subject-link reuse; email-link to confirmed; email-link to unconfirmed (upgrades + invalidates pending confirmations); rejects `email_verified=false`; rejects bad nonce, bad audience, expired ID token (via `FakeGoogleIdentityProvider`). |
| `unit/identity/test_register_user.py` (updated) | `unit` | creates user with `email_confirmed_at=None`, persists confirmation row, calls mailer once, returns no session. |
| `unit/identity/test_confirm_email.py` | `unit` | happy path; expiry; attempt-cap → invalidated; wrong code → `attempt_count++`; non-existent email → generic; already-confirmed → generic. |
| `unit/identity/test_resend_confirmation.py` | `unit` | 60s cooldown; 3-per-hour cap; both collapse to identical generic refusal; old row marked `invalidated reason=resent`. |
| `unit/identity/test_authenticate_user.py` (updated) | `unit` | unconfirmed → fails with same `InvalidCredentials` as wrong-password, plus the gated `unconfirmed=true` flag only when password verified. |
| `unit/identity/test_account_linking.py` | `unit` | linking preserves existing password, sessions, and refresh tokens. |
| `unit/identity/test_no_enumeration.py` | `unit` | response bodies + status codes are byte-identical across {unknown email, wrong password, unconfirmed, Google-only}. Parametric. |
| `unit/test_architecture.py` (updated) | `unit` | adds `google-auth`, `httpx` to the banned-in-domain/application set; whitelists the new adapter paths. |
| `integration/identity/test_google_oauth.py` | `integration` | real Postgres + `FakeGoogleIdentityProvider`: full start-to-finish, refresh cookie set, `/auth/refresh` works after callback, `auth_error=` redirects on cancellation/state mismatch. |
| `integration/identity/test_confirm_email.py` | `integration` | end-to-end with the `FakeEmailSender` capturing codes; verifies session issuance + cookie. |
| `integration/identity/test_register_unconfirmed.py` | `integration` | sign-up does not yield a session; `/me` returns 401. |
| `integration/identity/test_login_blocks_unconfirmed.py` | `integration` | login fails generic; `unconfirmed=true` flag only when password is correct. |
| `integration/identity/test_no_secret_leakage.py` (updated) | `integration` | scans response bodies + captured logs for any of: password, plaintext code, raw ID token, refresh token, Google client secret, JWS payload. Asserts none appear. |
| `integration/identity/test_google_disabled_falls_back.py` | `integration` | with `GOOGLE_OAUTH_ENABLED=false`: `/auth/config` reports false, `/auth/google/start` → 503, password login still works, `/auth/google-stub` (with `GOOGLE_STUB_ENABLED=true`) still works for legacy tests. |
| `contract/test_openapi_snapshot.py` | `contract` | snapshot updated to include new endpoints. |

Frontend coverage:

- `npm run typecheck`: TS strict mode + locale-key exhaustiveness already catches untranslated keys.
- `npm run build`: Vite production build must succeed.
- No new frontend test runner this slice (Constitution IV). UI behavior is verified by manual smoke per `quickstart.md` and by the backend integration tests that drive the actual contract.

**Rationale**: Each FR-035 sub-bullet maps to exactly one test; enumeration tests are parametric so adding a new failure path automatically extends coverage; secret-leakage scanning is a body+log scan, not a regex over source code (which would drift).

---

## R14 — Documentation updates

**Decision**: Land the following Mintlify pages in the same change set:

- `docs/identity/overview.mdx` — high-level identity model, refreshed.
- `docs/identity/google-oauth.mdx` — flow diagram, env vars, failure-mode catalog, key rotation.
- `docs/identity/email-confirmation.mdx` — code lifecycle, abuse caps, troubleshooting "I never got the code".
- `docs/identity/runbook-disable-google.mdx` — one-knob disable + verification steps.
- `docs/identity/env-vars.mdx` — single source of truth for everything in R11.
- `docs/operations/render-secrets.mdx` — updated with where each new var lives in Render's per-environment secrets.

`AGENTS.md` (which `CLAUDE.md` symlinks to) gets the SPECKIT-marker reference to `specs/006-google-auth-login-ux/plan.md` so future agent runs pick up this plan as the active context.

**Rationale**: Constitution Principle V — every user-facing or architectural change ships with the doc that reflects it.

---

## Open items rolled forward to Phase 2

None. All `NEEDS CLARIFICATION` are resolved here.
