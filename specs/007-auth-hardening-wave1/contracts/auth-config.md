# Contract: Auth Configuration Hardening

**Surface owner**: `apps/api/src/campfire_api/contexts/identity/adapters/http/routers/config.py`
**Findings**: C-1

## `GET /auth/config`

Public, unauthenticated. Returns public booleans only.

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
| `google.enabled` | boolean | Existing `settings.google_enabled()` calculation. |
| `passwordSignUp.enabled` | boolean | `true` for Wave 1. |
| `passwordSignUp.requiresEmailConfirmation` | boolean | Existing `settings.email_confirmation_required()`. |

### Consumers That Must Update

- Backend Pydantic schemas: `AuthConfigResponse` gains `PasswordSignUpConfig`.
- Backend router: `routers/config.py` constructs the nested `passwordSignUp` object.
- Frontend: `apps/web/src/features/auth/api/auth.api.ts` changes `AuthConfig.passwordSignUp` from `boolean` to `{ enabled: boolean; requiresEmailConfirmation: boolean }`.
- OpenAPI snapshot: regenerate the current canonical snapshot at `specs/002-backend-auth-slice/contracts/openapi.json`.
- Render and docs: mark `EMAIL_CONFIRMATION_REQUIRED=false` as incident-only and scheduled for removal after 30 days of stabilization.

### Non-Exposure Rule

The response must not include env names, client IDs, redirect URIs, HMAC key presence, mail provider data, request IDs, or build metadata.
