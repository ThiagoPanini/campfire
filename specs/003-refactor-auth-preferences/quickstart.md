# Quickstart: Refactor Campfire Authentication and Preferences MVP

This quickstart describes the expected validation workflow for the MVP implementation. It distinguishes local backend validation from real authentication validation.

## Prerequisites

- Python 3.12 and `uv`.
- Node 20 LTS and npm.
- Terraform 1.8.x.
- Docker with Compose v2 for LocalStack.
- AWS credentials for the dev environment when validating real Cognito/Google authentication.
- Google OAuth credentials configured through managed secret storage, not committed files.

## 1. Start Local AWS Dependencies

```bash
make up
```

Expected result:

- LocalStack is reachable at `http://localhost:4566`.
- DynamoDB table exists for Campfire user, identity, onboarding, and preference items.
- SSM/Secrets Manager local placeholder paths exist where needed.

## 2. Start the Backend

```bash
make run
```

Verify health:

```bash
curl http://127.0.0.1:8010/health
```

Expected result:

```json
{
  "status": "ok",
  "service": "campfire-api"
}
```

## 3. Validate Backend Auth Boundary Locally

Local backend tests may use the local JWT signer to exercise API behavior without real Cognito.

```bash
TOKEN="$(make -s token)"
curl -H "Authorization: Bearer ${TOKEN}" http://127.0.0.1:8010/me
```

Expected result:

- `/me` returns one Campfire user context.
- Repeating the request does not create a duplicate user.
- If token claims contain a verified normalized email that already exists under another provider identity, the backend resolves the same Campfire user and links the identity.

## 4. Save Preferences Locally

```bash
curl -X PUT http://127.0.0.1:8010/me/preferences \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "instruments": ["Guitar"],
    "genres": ["Rock"],
    "playContext": "friends",
    "goals": ["Prepare for jam sessions"],
    "experienceLevel": "learning"
  }'
```

Expected result:

- Preferences are stored for the authenticated user.
- Onboarding state becomes `completed`.
- `GET /me` returns `onboarding.status = completed`.

## 5. Validate Onboarding Deferral Locally

For a user without saved preferences:

```bash
curl -X PATCH http://127.0.0.1:8010/me/onboarding \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"status":"deferred"}'
```

Expected result:

- Onboarding state becomes `deferred`.
- `GET /me` returns `onboarding.status = deferred`.
- Home remains accessible but shows an update-preferences action.

## 6. Start the Frontend

```bash
make run/web
```

Expected local routes:

- `http://127.0.0.1:5173/` shows landing.
- `/signin` shows functional sign-in UI.
- `/signup` shows functional sign-up UI.
- `/onboarding` and `/app` block unauthenticated access.

## 7. Configure Real Dev Authentication

Use Terraform outputs and managed secrets to configure a dev Cognito user pool with:

- Public email/password sign-up.
- Email verification.
- Password recovery.
- Google identity provider.
- Callback URL for `/auth/callback`.
- Logout URL for `/`.
- API Gateway JWT authorizer for the same issuer/client.

Frontend environment values must point to the dev Cognito configuration:

```bash
VITE_AUTH_AUTHORITY="https://<dev-cognito-domain>"
VITE_AUTH_CLIENT_ID="<dev-web-client-id>"
VITE_AUTH_REDIRECT_URI="http://127.0.0.1:5173/auth/callback"
VITE_AUTH_POST_LOGOUT_REDIRECT_URI="http://127.0.0.1:5173/"
VITE_AUTH_SCOPE="openid email profile"
VITE_AUTH_RESPONSE_TYPE="code"
```

Do not commit real values.

## 8. Real Auth Acceptance Checklist

Run against dev Cognito/Google, not local mock auth:

- New email/password user can sign up.
- Email/password user must verify email before trusted main access.
- Verified email/password user can sign in.
- Email/password user can request and complete password reset.
- New Google user can sign in and creates one Campfire account.
- Existing email/password user can sign in with Google using the same verified email and reaches the same Campfire account.
- Duplicate sign-up with the same email does not create a second Campfire user.
- Authenticated user without completed/deferred onboarding lands on `/onboarding`.
- Saving preferences sends the user to `/app`.
- Existing user with completed onboarding lands directly on `/app`.
- Explicit onboarding deferral sends the user to `/app` and home keeps an update-preferences action.
- Logout clears the session and protected routes redirect to `/signin`.

## 9. Run Tests

Expected command set:

```bash
make test/backend/unit
make test/backend/integration
make test/backend/contract
make test/frontend/unit
make test/e2e
```

If implementation occurs before all `002-cicd-local-env` Makefile placeholder targets are complete, use the direct equivalent commands and record that gap in the task completion notes.

## 10. Validate Infrastructure and Docs

```bash
terraform -chdir=infra/terraform/environments/dev fmt -check
terraform -chdir=infra/terraform/environments/dev validate
```

Docs validation should include:

- Mintlify navigation includes the new auth/onboarding guide.
- `docs/docs.json` uses the Campfire palette from `DESIGN.md`, including primary `#E8813A` and dark `#131313`.
- Auth-bootstrap pages no longer claim that the MVP is admin-provisioned only.
- API docs mirror `contracts/auth-and-preferences-api.openapi.yaml`.

## Success Signal

The implementation is ready for review when a maintainer can run the local backend/persistence flow with LocalStack, run the frontend, validate real Cognito/Google auth in dev, and demonstrate:

```text
landing -> sign-up/login -> verification or Google -> onboarding -> home -> logout
```

without relying on mock authentication as the acceptance path.
