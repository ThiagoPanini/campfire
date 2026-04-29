# Contract: Post-Deployment Probe

**Feature**: 005-cicd-pipeline
**Date**: 2026-04-29

Defines the HTTP probe protocol used after every successful deploy hook to
verify that the deployed service is actually healthy.

---

## Probed endpoints

| Service | URL template | Expected | Source of base URL |
|---|---|---|---|
| API liveness | `${BASE_API_URL}/healthz` | HTTP 2xx, body content irrelevant | `STAGING_API_URL` / `PROD_API_URL` |
| API readiness | `${BASE_API_URL}/readyz` | HTTP 2xx, body content irrelevant | `STAGING_API_URL` / `PROD_API_URL` |
| Frontend root | `${BASE_WEB_URL}/` | HTTP 2xx | `STAGING_WEB_URL` / `PROD_WEB_URL` |

The API endpoints are FastAPI handlers that already exist in `apps/api`. The
frontend root is a Render Static Site URL.

---

## Probe algorithm

`scripts/ci/probe-url.sh URL` (one URL per invocation) performs:

```text
attempts = ${PROBE_MAX_ATTEMPTS:-12}
sleep   = ${PROBE_SLEEP_SECONDS:-5}
timeout = ${PROBE_REQUEST_TIMEOUT:-5}

for i in 1..attempts:
    code = curl --silent --output /dev/null \
                --max-time ${timeout} \
                --write-out '%{http_code}' \
                URL
    if 200 <= code <= 299:
        echo "healthy after ${i} attempt(s) (HTTP ${code})"
        exit 0
    sleep ${sleep}

echo "::error::probe failed for ${URL} after ${attempts} attempts (last HTTP ${code})"
exit 1
```

- Defaults give a 60-second budget per URL (12 × 5 s).
- All values are configurable via env so the runbook can tune for slower Render cold-starts without editing the workflow YAML.

---

## Job-level orchestration

A single `probe` job runs all three probes **in sequence** (API liveness →
API readiness → Frontend root). Each probe writes one line to
`$GITHUB_STEP_SUMMARY`:

```
✅ /healthz — healthy after 1 attempt (HTTP 200)
✅ /readyz  — healthy after 1 attempt (HTTP 200)
❌ web      — probe failed after 12 attempts (last HTTP 503)
```

The job exits non-zero if any probe fails. Sequential order means the
summary always tells the maintainer which layer broke first (FR-053).

---

## Boundaries (MUST NOT)

- Probes MUST NOT retry past the configured attempt budget (edge case "probe transient flake" must still terminate).
- The probe script MUST NOT echo any value of any environment variable other than the URL it was given (which is a public URL, recorded as a GitHub Variable, not a secret).
- The probe script MUST NOT call `curl -v` (verbose mode prints headers that could include cookies in unusual misconfigurations).

---

## Success criteria mapping

- **SC-007**: Every deploy is followed by all three probes (this contract).
- **SC-012**: A failing probe fails the run; no false greens (`exit 1` propagation).
- **FR-034 / FR-045**: Bounded retries with timeout (the algorithm).
- **Edge case "deploy hook returns success but service is unhealthy"**: caught here, not at the deploy step.
