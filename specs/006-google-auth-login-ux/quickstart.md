# Quickstart: Local development for `006-google-auth-login-ux`

**Phase**: 1 · **Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

This guide covers local-dev setup, smoke-testing the Google + email-confirmation flows end-to-end, and the rollback path. Production setup notes are at the bottom.

---

## 1. Prerequisites

- Python 3.12 + `uv` (already required by the repo).
- Node 22 + npm (already required by the repo).
- Docker + Docker Compose (for the local Postgres).
- A personal **Google Cloud sandbox project** distinct from production (see §2). Free tier is enough.

---

## 2. One-time: provision a Google OAuth client for local dev

1. Open <https://console.cloud.google.com/> → create a new project, e.g. `campfire-local-<your-handle>`.
2. **APIs & Services → OAuth consent screen** → User type "External" → fill in app name (`Campfire local`), support email (your address), developer contact email. Add scopes `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`. Add yourself as a test user.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID** → Application type "Web application". Authorized redirect URIs:
   - `http://localhost:8000/auth/google/callback`
4. Copy the **Client ID** and **Client secret**. These go into `.env` (§3) and never into git.

Use a separate Google project for `dev` and `prod` Render environments. This MUST be documented in `docs/identity/google-oauth.mdx`.

---

## 3. Configure environment variables

Create or update `apps/api/.env` (gitignored). Minimum for full local dev:

```dotenv
# Database
DATABASE_URL=postgresql+asyncpg://campfire:campfire@localhost:5432/campfire

# Cookie + CORS
ENV=dev
CORS_ORIGINS=http://localhost:5173
REFRESH_COOKIE_SAMESITE=lax
REFRESH_COOKIE_SECURE=false

# Google OAuth — fill from §2
GOOGLE_OAUTH_ENABLED=true
GOOGLE_OAUTH_CLIENT_ID=xxxxxxxxxxxx-xxxxxx.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8000/auth/google/callback
WEB_BASE_URL=http://localhost:5173
OAUTH_FLOW_HMAC_KEY=$(python -c "import secrets,base64;print(base64.b64encode(secrets.token_bytes(32)).decode())")

# Email confirmation
EMAIL_CONFIRMATION_REQUIRED=true
EMAIL_CONFIRMATION_HMAC_KEY=$(python -c "import secrets,base64;print(base64.b64encode(secrets.token_bytes(32)).decode())")
MAIL_BACKEND=console
MAIL_FROM=noreply@campfire.local
MAIL_OUTBOX_DIR=tmp/mail/

# Legacy stub (off by default; enable only if testing the legacy path)
GOOGLE_STUB_ENABLED=false
```

Generate the two HMAC keys with `python -c "import secrets,base64;print(base64.b64encode(secrets.token_bytes(32)).decode())"` and paste them in.

For the web app, `apps/web/.env.local` — usually nothing new is needed; the SPA reads `/auth/config` at runtime.

---

## 4. Start everything

```bash
# 1. Postgres
docker compose up -d postgres

# 2. API (new terminal)
cd apps/api
uv sync
uv run alembic upgrade head    # applies 0002_identity_oauth_and_confirmation
uv run uvicorn campfire_api.main:app --reload --host 0.0.0.0 --port 8000

# 3. Web (new terminal)
cd apps/web
npm install
npm run dev                    # Vite serves http://localhost:5173
```

Verify:

```bash
curl http://localhost:8000/auth/config
# → {"google":{"enabled":true},"passwordSignUp":{"enabled":true,"requiresEmailConfirmation":true}}
```

---

## 5. Smoke-test the Google flow

1. Open <http://localhost:5173/signup>. The "Continue with Google" button MUST be visible and enabled.
2. Click it. The browser redirects to Google. Approve the consent screen with your test Google account.
3. Google redirects back to `http://localhost:8000/auth/google/callback?code=…&state=…`.
4. The API:
   - validates state cookie + DB row,
   - exchanges the code for tokens (POST to `oauth2.googleapis.com/token`),
   - verifies the ID token (`google-auth`),
   - creates a `User` (or links to an existing one),
   - sets the refresh cookie,
   - 302s to `http://localhost:5173/home?auth=ok`.
5. The SPA mounts, fetches `POST /auth/refresh`, gets an access token, navigates to `/home`. You should see the authenticated home view.

`curl -i http://localhost:8000/me -H "Authorization: Bearer $ACCESS_TOKEN"` returns `{ displayName, email }` reflecting your Google account.

### Failure-mode walkthroughs

| Scenario | Action | Expected result |
|---|---|---|
| User cancels Google consent | Click "Cancel" on Google's consent screen | 302 to `/signin?auth_error=google_cancelled`. SPA renders neutral "Sign-in was cancelled" message. |
| Tampered state | Open `http://localhost:8000/auth/google/callback?code=fake&state=fake` directly | 302 to `/signin?auth_error=google_failed`. No session created. Server log: `event=google_oauth_failure reason=state_cookie_missing` (no token bytes). |
| Google off | Set `GOOGLE_OAUTH_ENABLED=false`, restart API | `/auth/config` returns `{"google":{"enabled":false}}`. SPA hides (or disables) the button. `POST /auth/google/start` returns 503. Password auth still works. |

---

## 6. Smoke-test the email-confirmation flow

1. Open <http://localhost:5173/signup>.
2. Submit a brand-new email with a strong password (e.g. `My-Strong-Pass-1`).
3. The form advances to the "Enter the 6-digit code" page.
4. Read the code from `tmp/mail/<timestamp>-<email>.txt` (the console mailer drops one file per send) — or from the API stdout (the dev mailer logs only `event=mail_sent template=confirmation_code to_hash=…` to stdout; the actual code never hits stdout).
5. Type the code. The page should land on `/home`.

### Edge cases to verify manually

| Scenario | Expected |
|---|---|
| Wrong code 5× | "This code is no longer valid — request a new one". The row's `attempt_count=5` and `status='invalidated'` (`invalidated_reason='attempts_exceeded'`). |
| Wait 16 minutes, then enter the original code | Same generic refusal. Row's `status='expired'`. |
| Click "Resend" twice within 60 s | Second click's UI shows the cooldown; server returns 202 either way (silent rate-limit by design). |
| Try to log in before confirming | Generic `invalid credentials` if the password is wrong; if password correct, the response body is `{"status":"confirmation_required"}` instead of `{accessToken,…}`, and the SPA navigates to the confirm page. |
| Try to navigate directly to `/home` while unconfirmed | Router redirects to `/confirm?email=…`. |

---

## 7. Rollback path

To **disable Google sign-in** in any environment without touching the rest of auth:

```dotenv
GOOGLE_OAUTH_ENABLED=false
```

Restart the API. Verify:

```bash
curl http://localhost:8000/auth/config
# → {"google":{"enabled":false},…}
curl -X POST http://localhost:8000/auth/google/start -d '{"intent":"sign-in"}' -H "Content-Type: application/json"
# → 503 {"detail":"google sign-in unavailable"}
```

Password sign-up + sign-in continue to work, including for users whose accounts were originally created with Google (their `Credentials` row, if any, was preserved; users with no `Credentials` will need to use a future password-reset flow — out of scope for this slice).

To **disable email confirmation** in an emergency (e.g. mailer outage):

```dotenv
EMAIL_CONFIRMATION_REQUIRED=false
```

`POST /auth/register` reverts to the pre-feature behavior (issues a session immediately). This is for emergencies — re-enable as soon as the mailer is healthy.

---

## 8. Production deployment notes (Render)

For each environment (`dev`, `prod`):

1. Create a separate Google OAuth client per environment (see §2). Authorized redirect URI:
   - dev: `https://campfire-api-dev.onrender.com/auth/google/callback`
   - prod: `https://campfire-api-prod.onrender.com/auth/google/callback`
2. In **Render dashboard → service → Environment**, set the same vars as §3, with environment-specific values:
   - `GOOGLE_OAUTH_REDIRECT_URI` = the matching callback URL
   - `WEB_BASE_URL` = `https://campfire-{dev|prod}.onrender.com`
   - `REFRESH_COOKIE_SAMESITE=none`, `REFRESH_COOKIE_SECURE=true` (already so)
   - `MAIL_BACKEND=http`, `MAIL_HTTP_URL`, `MAIL_HTTP_API_KEY`, `MAIL_FROM` set per the chosen vendor
3. Generate fresh, distinct `OAUTH_FLOW_HMAC_KEY` and `EMAIL_CONFIRMATION_HMAC_KEY` per environment (never share with `dev`).
4. Trigger a deploy. The `0002` migration runs as part of the existing `preDeployCommand` (`uv run alembic upgrade head`). Existing users are auto-confirmed by the backfill.
5. Smoke-test §5 and §6 against the deployed URLs.

`render.yaml` declares the var **names** (with `sync: false` for secret values), so a fresh environment knows what to ask for; the values are set by hand in the Render dashboard. Never commit secret values.

---

## 9. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `/auth/google/start` returns 503 | `GOOGLE_OAUTH_ENABLED=false` or one of the required vars unset | Check `/auth/config`; check API startup logs for the fail-fast missing-env error. |
| Google redirects to `/signin?auth_error=google_failed` immediately | redirect URI mismatch with the Google console | Check `GOOGLE_OAUTH_REDIRECT_URI` matches the URI registered in the Google project exactly (scheme, port, path). |
| Confirmation code never arrives | `MAIL_BACKEND=http` but provider creds are wrong / outage | Check API logs for `event=mail_send_failed`. Locally, confirm `MAIL_BACKEND=console` and read `tmp/mail/`. |
| User stuck on confirm page | code expired (15 min) or wrong code 5× | Click "Resend"; new row issued, old marked invalidated. |
| "Continue with Google" button missing in dev | `/auth/config` returns `{google:{enabled:false}}` | Likely missing `OAUTH_FLOW_HMAC_KEY` or `GOOGLE_OAUTH_CLIENT_ID/SECRET`. Set them and restart. |
| Refresh cookie doesn't persist after Google flow in prod | `SameSite=none` requires `Secure=true` | Verify `REFRESH_COOKIE_SECURE=true` in Render env. |
