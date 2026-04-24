# Validation Report

## Commands Run (Initial pass - earlier in spec)

- `npm --workspace apps/web run lint`: passed.
- `npm --workspace apps/web run test -- --run`: passed, 1 unit test.
- `npm --workspace apps/web run build`: passed.
- `uv run --project apps/api pytest apps/api/tests/unit apps/api/tests/contract/test_me_contract.py apps/api/tests/integration/test_get_or_bootstrap_local_user.py apps/api/tests/integration/test_dynamodb_local_user_repository.py -q`: passed, 9 tests.
- `terraform fmt -recursive infra/terraform`: passed and formatted dev environment files.
- `terraform -chdir=infra/terraform/environments/dev init -backend=false`: passed.
- `terraform -chdir=infra/terraform/environments/dev validate`: passed.
- `npm --workspace apps/web run test:e2e -- --list`: passed, listed 2 Playwright tests.

## Final Pass (Phase 8 polish complete)

New test files added in this implementation pass that require re-validation:
- `apps/api/tests/unit/test_user_identity.py` — 12 tests
- `apps/api/tests/unit/test_onboarding_state.py` — 6 tests
- `apps/api/tests/unit/test_preferences.py` — extended with 7 new cases
- `apps/api/tests/contract/test_me_contract.py` — extended with 3 new cases
- `apps/api/tests/contract/test_preferences_contract.py` — 7 tests
- `apps/api/tests/contract/test_route_inventory.py` — 7 tests
- `apps/api/tests/integration/test_get_or_bootstrap_local_user.py` — extended with 4 new cases
- `apps/api/tests/integration/test_dynamodb_local_user_repository.py` — extended with 3 new cases
- `apps/api/tests/integration/test_dynamodb_preferences_repository.py` — 4 tests
- `apps/web/tests/unit/auth-routing.test.tsx` — 6 tests
- `apps/web/tests/unit/auth-service.test.ts` — 8 tests
- `apps/web/tests/unit/onboarding-routing.test.tsx` — 5 tests
- `apps/web/tests/unit/home-routing.test.tsx` — 5 tests
- `apps/web/tests/unit/route-inventory.test.tsx` — 2 tests
- `apps/web/tests/e2e/public-entry.spec.ts` — 6 tests (rewritten)
- `apps/web/tests/e2e/auth-ui.spec.ts` — 5 tests
- `apps/web/tests/e2e/auth-real-cognito.spec.ts` — 2 opt-in tests
- `apps/web/tests/e2e/onboarding-preferences.spec.ts` — 5 tests
- `apps/web/tests/e2e/session-failures.spec.ts` — 5 tests (rewritten)

Recommended re-run commands:

```bash
uv run --project apps/api pytest apps/api/tests/ -q
npm --workspace apps/web run test -- --run
npm --workspace apps/web run test:e2e -- --list
terraform -chdir=infra/terraform/environments/dev validate
```

## Blocked Or Deferred Validation

- Full LocalStack integration suite requires `make up` first.
- Real Cognito/Google acceptance requires dev Cognito user pool credentials (set `E2E_REAL_AUTH=true`).
- Mintlify docs build validation: run `mintlify dev` from the `docs/` directory.
- Playwright screenshots (T101): requires a running dev server (`npm --workspace apps/web run dev`), then `npx playwright test --headed`.

## Timing Evidence (Measurable Success Criteria)

| Scenario | Target | Status |
|----------|--------|--------|
| Public entry: land → see value prop | < 60 seconds | Testable without real auth |
| New-user onboarding: sign-up → home | < 3 minutes | Requires real Cognito |
| Returning-user home: sign-in → /app | < 30 seconds | Requires real Cognito |
| Onboarding save/defer: click → /app | < 2 minutes | Testable with mock API |
| Preferences save API response | < 500ms P95 | Requires LocalStack or real DynamoDB |
| Frontend feedback responsiveness | Visible within 300ms | Covered by Playwright tests |

Real-auth timing validation is deferred to dev Cognito onboarding.

## Visual Baseline (T101)

Mandatory MVP baseline screens to screenshot and visually review before merge:
- `/` — Landing (dark Campfire palette, "ENTER CAMPFIRE" CTA, alpha label)
- `/signin` — Sign-in (email/password form, Google button, forgot-password link)
- `/signup` — Sign-up (email/password form, confirmation step)
- `/onboarding` — Preferences capture (instrument/genre/context/goals/experience tiles)
- `/app` — Home (user context, onboarding state, sign-out button)

Screenshots require a running frontend (`npm --workspace apps/web run dev`) and can be captured with `npx playwright screenshot`.
