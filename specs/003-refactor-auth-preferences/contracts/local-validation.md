# Contract: Local and Dev Validation

The MVP must be locally practical without pretending that mock authentication is production-equivalent. This contract separates backend/local validation from real authentication validation.

## Validation Planes

| Plane | Purpose | Required services |
|---|---|---|
| Local backend plane | Fast API, repository, and contract validation. | LocalStack Community for DynamoDB, SSM, Secrets Manager, S3, STS, logs; local Python server; local JWT signer. |
| Local frontend plane | Fast UI routing/component validation. | Vite app, local backend API, test fixtures for component/unit tests. |
| Dev auth plane | Real MVP authentication acceptance. | AWS dev Cognito user pool, Google OAuth configuration, deployed or locally configured callback URLs. |

## LocalStack Responsibilities

LocalStack must validate:

- DynamoDB table shape for users, identity links, onboarding state, and preferences.
- Conditional write behavior that prevents duplicate normalized email records.
- Repository integration for `/me`, `/me/preferences`, and onboarding deferral.
- SSM/Secrets Manager paths required by runtime configuration, using non-secret local dummy values.
- Local server behavior for authenticated API calls with locally signed JWTs.

LocalStack must not be claimed as validating:

- Cognito Hosted UI.
- Google OAuth consent or callback behavior.
- Cognito email verification delivery.
- Cognito password recovery delivery.
- Cognito provider account linking.

## Real Auth Acceptance

At least one repeatable dev-environment path must validate:

1. Email/password sign-up.
2. Email verification.
3. Email/password login.
4. Password reset request and completion.
5. Google first login with a new email.
6. Google login with an email that already exists as email/password, resulting in the same Campfire account.
7. Logout and protected-route blocking after logout.
8. Routing to onboarding for users without completed/deferred onboarding.
9. Routing directly to home for users with completed onboarding.

## Test Classification

| Test type | May use local JWT signer? | May use mocked UI state? | Counts for MVP auth acceptance? |
|---|---:|---:|---:|
| Backend unit | yes | N/A | no |
| Backend integration with LocalStack | yes | N/A | partially, for backend auth boundary and persistence only |
| Backend contract | yes | N/A | partially, for API contract only |
| Frontend unit | yes | yes | no |
| Playwright UI routing smoke | yes | controlled fixtures allowed | no, unless connected to real Cognito |
| Dev Cognito e2e | no | no | yes |

## Required Commands

The final implementation should document commands equivalent to:

```bash
make up
make run
make run/web
make test/backend/unit
make test/backend/integration
make test/backend/contract
make test/frontend/unit
make test/e2e
make validate/infra
make docs
```

If some Makefile targets remain as placeholders from `002-cicd-local-env` during this feature, tasks must either implement the target needed for this MVP or document the temporary direct command in `quickstart.md`.

## Environment Variables

Local/dev docs must identify, without committing values:

- `VITE_API_BASE_URL`
- `VITE_AUTH_AUTHORITY`
- `VITE_AUTH_CLIENT_ID`
- `VITE_AUTH_REDIRECT_URI`
- `VITE_AUTH_POST_LOGOUT_REDIRECT_URI`
- `VITE_AUTH_SCOPE`
- `VITE_AUTH_RESPONSE_TYPE`
- Google OAuth client id/secret storage path for Terraform
- Cognito user pool id/client id/domain outputs

## Non-Acceptance Paths

- A Playwright test that writes `campfire.mock.session` directly is useful for route tests but does not prove MVP auth.
- A local token from `make token` proves backend JWT mapping but does not prove sign-up, login, email verification, Google, or password recovery.
- A screenshot of the auth page is not authentication validation.
