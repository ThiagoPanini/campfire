# Contract: Auth configuration probe

**Surface owner**: `apps/api/src/campfire_api/contexts/identity/adapters/http/routers/config.py` (NEW)
**Spec refs**: FR-005, SC-006

---

## `GET /auth/config`

Public, unauthenticated. Tells the SPA which auth surfaces are available in this environment so it can render the UI accordingly. Cached for 60 seconds client-side via `Cache-Control: public, max-age=60`.

### Request

```http
GET /auth/config HTTP/1.1
```

### 200 Response

```json
{
  "google": {
    "enabled": true
  },
  "passwordSignUp": {
    "enabled": true,
    "requiresEmailConfirmation": true
  }
}
```

| Field | Type | Source |
|---|---|---|
| `google.enabled` | `boolean` | `GOOGLE_OAUTH_ENABLED` AND all of `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`, `OAUTH_FLOW_HMAC_KEY` set. |
| `passwordSignUp.enabled` | `boolean` | always `true` for this slice (kept for forward-compat). |
| `passwordSignUp.requiresEmailConfirmation` | `boolean` | `EMAIL_CONFIRMATION_REQUIRED` (default `true`; emergency rollback only). |

### Frontend behavior

- On `useSessionStore` mount, `GET /auth/config` is fetched once.
- If `google.enabled === false`, both `SignInForm` and `SignUpForm` either:
  - **production**: hide the Google button entirely (no surface for an inert control), OR
  - **non-production**: render the button disabled with `title="Google sign-in is not configured for this environment"` for operator visibility (FR-005).
  Choice is driven by a small client-side heuristic: the button is rendered visible+disabled when `import.meta.env.DEV` is true, hidden otherwise.
- If `passwordSignUp.requiresEmailConfirmation === false`, the sign-up form skips the confirm step (rollback path); this is a feature flag for emergencies, not user-toggleable.

### Errors

`GET /auth/config` MUST NOT return 4xx in normal operation; if all backends are healthy, the route always returns 200. A 5xx (DB down, etc.) is acceptable but rare; the SPA falls back to "Google disabled" until a successful refetch.

### What it MUST NOT contain

- Client IDs, client secrets, redirect URIs, mailer credentials, HMAC keys, environment names, version strings, build hashes, request IDs of other users, or any other configuration value beyond the booleans above. Per FR-036.
