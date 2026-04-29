# Contract: Render Deploy Hook Invocation

**Feature**: 005-cicd-pipeline
**Date**: 2026-04-29

Defines how GitHub Actions invokes a Render Deploy Hook, what counts as
success, and what MUST NOT happen on the wire or in logs.

---

## Inputs

| Name | Source | Required | Notes |
|---|---|---|---|
| `RENDER_<ENV>_<SVC>_DEPLOY_HOOK` | GitHub Environment **secret** | yes | A Render-issued HTTPS URL of the form `https://api.render.com/deploy/srv-XXXX?key=YYYY`. Treated as a secret because the `key` query param authorises the deploy. |

`<ENV>` ∈ {`STAGING`, `PROD`}. `<SVC>` ∈ {`API`, `WEB`}.

---

## Request

- **Method**: `POST`
- **URL**: the deploy hook URL, passed via process env (`HOOK_URL`).
- **Body**: empty.
- **Headers**: none beyond `curl` defaults.
- **Tool**: `curl --silent --show-error --fail-with-body --max-time 30 --output /dev/null --write-out '%{http_code}\n' "$HOOK_URL"`.

### Logging requirements (MUST)

- The URL MUST NOT appear in any log line. The script accepts the URL via env and never echoes `$HOOK_URL`.
- `set -x` MUST NOT be enabled in any step that has the hook in its environment.
- The HTTP response body MUST NOT be printed (it contains a deploy ID that is harmless, but `--fail-with-body` plus `--output /dev/null` keeps it out unless curl fails, in which case the body is shown to aid triage).

---

## Response

- **Success**: HTTP 200–299 from Render. Render responds with a small JSON object containing a deploy ID; the workflow does not parse it and does not depend on it.
- **Failure**: any non-2xx status, network error, or timeout.

### Failure semantics

- The calling step MUST exit non-zero on failure.
- The job summary MUST contain a single line of the form:
  ```
  Deploy hook for <env> <service> failed (HTTP <code>).
  ```
  where `<service>` is `api` or `web` (FR-033, FR-053, SC-011). The URL MUST NOT be included.
- The downstream `probe` job MUST NOT run if any deploy step failed.

---

## Idempotency and ordering

- Render deploy hooks are **idempotent in effect**: calling twice in quick succession produces one in-flight deploy and queues another. The workflow's concurrency group (`deploy-staging` / `deploy-production`) is the canonical guard against pile-ups.
- The API and Web hooks are called **sequentially** (API first, then Web). Rationale: if the API breaks, the Web deploy still happens — but the probe step will catch the API problem and fail the run before the promotion PR is updated. (We do not currently parallelise to keep job summaries linear and easy to read for a solo maintainer.)

---

## Test plan (contract verification)

A contract is a contract; we check the parts we control:

1. `scripts/ci/render-deploy.sh` MUST exit non-zero when given a URL that returns HTTP 500 (verified with a stub server in a unit test of the script, optional follow-up).
2. `scripts/ci/render-deploy.sh` MUST NOT print its `HOOK_URL` argument under any branch (verified by grepping the script for `echo.*HOOK_URL`).
3. The workflow step that calls the script MUST pass the URL via `env:`, not via the `run:` shell template — verified by `docs-and-repo-hygiene` job linting `.github/workflows/*.yml` for the pattern.
