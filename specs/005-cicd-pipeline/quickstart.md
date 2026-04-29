# Quickstart: CI/CD Pipeline for Campfire

**Feature**: 005-cicd-pipeline
**Date**: 2026-04-29
**Audience**: solo maintainer (or AI agent) configuring this pipeline from scratch.

This is a fast path. The full operational runbook lives at
`docs/backend/ops/cicd.mdx` and is the long-term source of truth (FR-050).

---

## Prerequisites

- Render account with the **staging** services already provisioned:
  - `campfire-api-staging` (Web Service, root dir `apps/api`)
  - `campfire-web-staging` (Static Site, build from repo root, publish dir `apps/web/dist`)
  - `campfire-db-staging` (PostgreSQL)
- GitHub repository admin rights (to configure secrets, environments, and branch protection).
- Both `staging` and `main` branches exist on the remote.

Production services do **not** need to exist yet. The production workflow will
fail closed at the pre-flight step until they do.

---

## 1. Disable Render auto-deploy on every service (required)

For each Render service (`campfire-api-staging`, `campfire-web-staging`):

1. Render dashboard → service → **Settings** → **Build & Deploy**.
2. **Auto-Deploy**: set to **No**.

This is non-negotiable: with auto-deploy on, Render would deploy on every push
regardless of CI status (FR-002 spirit, US-1, SC-005).

---

## 2. Create Deploy Hooks on every Render service

For each service:

1. Render dashboard → service → **Settings** → **Deploy Hook**.
2. Copy the hook URL — treat it as a secret. It looks like:
   `https://api.render.com/deploy/srv-XXXX?key=YYYY`.

Record:
- API staging hook → save as GitHub secret `RENDER_STAGING_API_DEPLOY_HOOK`.
- Web staging hook → save as GitHub secret `RENDER_STAGING_WEB_DEPLOY_HOOK`.

(Production hooks are saved later, when production is provisioned.)

---

## 3. Create the GitHub Environments

GitHub repo → **Settings** → **Environments**.

### `staging`

- **Deployment branches**: Selected branches → only `staging`.
- **Required reviewers**: 0.
- **Environment secrets**:
  - `RENDER_STAGING_API_DEPLOY_HOOK`
  - `RENDER_STAGING_WEB_DEPLOY_HOOK`
- **Environment variables**:
  - `STAGING_API_URL` (e.g. `https://campfire-api-staging.onrender.com`)
  - `STAGING_WEB_URL` (e.g. `https://campfire-web-staging.onrender.com`)

### `production`

Create it now even though you have no production yet — the workflow needs it
to exist as a target.

- **Deployment branches**: Selected branches → only `main`.
- **Required reviewers**: 1 (you).
- **Wait timer**: optional, leave at 0.
- **Environment secrets**: leave empty for now (the pre-flight step will
  fail closed with a clear message until you set them).
- **Environment variables**: leave empty for now.

---

## 4. Configure branch protection

GitHub repo → **Settings** → **Branches** → **Add rule**.

### `staging`

- ✅ Require a pull request before merging
- ✅ Require status checks to pass before merging
  - Required check: **`ci-status`**
- ✅ Do not allow bypassing the above settings
- ✅ Restrict who can push to matching branches → leave empty (no direct pushes)
- ❌ Allow force pushes
- ❌ Allow deletions

### `main`

Everything in `staging`, plus:

- ✅ Require approvals: 1
- ✅ Require branches to be up to date before merging
- ✅ Require linear history (recommended)
- ✅ Restrict matching branches in pull request source: select `staging` only.

---

## 5. Open the first PR into `staging`

The workflows under `.github/workflows/` are already in this branch. The
first PR into `staging` should:

1. Pass CI (the six jobs + `ci-status`). If it does not, the failure messages
   will name the failing area.
2. Be merged. The merge triggers `deploy-staging.yml`:
   - `branch-guard` (passes — we're on `staging`).
   - `deploy-api`, `deploy-web` (Render hooks fire).
   - `probe` (verifies `/healthz`, `/readyz`, frontend root).
   - `promotion-pr` (opens PR `staging → main`).

If any step fails, fix it before continuing. Common first-run failures:
- Probe times out → the Render service is still building; re-run the
  `probe` job after Render reports "live", or increase `PROBE_MAX_ATTEMPTS`.
- Promotion PR step says "no permissions" → confirm the job's
  `permissions: { contents: write, pull-requests: write }` is in place.

---

## 6. Provisioning production (later)

When you are ready:

1. Create the Render services:
   - `campfire-api-prod` (Web Service, root dir `apps/api`,
     start command `uv run uvicorn campfire_api.main:app --host 0.0.0.0 --port $PORT`,
     pre-deploy command `uv run alembic upgrade head` if on a paid plan).
   - `campfire-web-prod` (Static Site, publish dir `apps/web/dist`).
   - `campfire-db-prod` (PostgreSQL).
2. Disable auto-deploy on both services.
3. Create deploy hooks; record:
   - `RENDER_PROD_API_DEPLOY_HOOK`
   - `RENDER_PROD_WEB_DEPLOY_HOOK`
4. Add to the `production` GitHub Environment as **secrets**.
5. Add `PROD_API_URL` and `PROD_WEB_URL` as environment **variables**.
6. Merge the next `staging → main` promotion PR. The production workflow
   will:
   - Pass `branch-guard` and `preflight`.
   - Wait for your approval (Environment protection rule).
   - Deploy and probe.

Until step 4–5 are done, every merge into `main` produces a clean failure at
`preflight` listing exactly which secret/variable names are missing.

---

## 7. Smoke tests (verification of the four P1 user stories)

| User Story | How to verify |
|---|---|
| US-1 — PR validation | Open a PR with a deliberate `tsc` error → CI fails on `frontend-checks`; PR is unmergeable. |
| US-2 — Staging auto-deploy | Merge a trivial change into `staging` → `deploy-staging` runs end-to-end; probes green; promotion PR opened. |
| US-4 — Gated production deploy | After production is provisioned, merge the promotion PR → `deploy-production` runs, waits at the environment gate, succeeds after approval. |
| US-5 — Production not provisioned | Before step 6, merge a PR into `main` → `deploy-production` fails at `preflight` with a list of missing names; no Render hook is contacted. |

---

## 8. Where to look when something breaks

- A job failed: read the job's last `::error::` line — it names the failing area (FR-053).
- A probe failed: the step summary lists which URL and the last HTTP code.
- A deploy hook failed: the step summary names the service and environment (`Deploy hook for staging api failed (HTTP 502).`).
- A secret is missing: `preflight` lists the missing names. Add them in the right GitHub Environment, re-run the workflow.
- The promotion PR keeps duplicating: confirm only one branch name is used by the create-pull-request action; the existing PR should be updated, not replaced.

For deeper investigation see `docs/backend/ops/cicd.mdx#troubleshooting`.
