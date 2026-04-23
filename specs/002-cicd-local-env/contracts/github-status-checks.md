# Contract: GitHub required status checks

Branch protection on `main` requires a single aggregating check so that pipeline
structure can evolve without administrative edits to branch protection. The summary
job's conclusion is the contract.

## Required checks

| Check name | Workflow | Blocking? |
|---|---|---|
| `pr / summary` | `.github/workflows/pr.yml` | Yes |
| `docs / build` | `.github/workflows/reusable-docs.yml` (called from `pr.yml`) | Yes (enforced via `summary`) |

No individual gate job is directly required. The `summary` job depends on every
gate job and succeeds only if all non-skipped dependencies succeeded.

## Summary job contract

- Fails if any called reusable workflow concludes with `failure` or `cancelled`.
- Succeeds if every called workflow concludes with `success` or `skipped` (skipped = the
  path filter determined the job was unnecessary for this PR).
- Never succeeds if `always-run` cross-cutting checks (`security.secrets`,
  `security.workflow`) are skipped — those gate jobs never set `if:` based on path.

## Output

The summary job appends a status table to the PR (via a sticky comment) listing every
gate with its conclusion and duration, and a pointer to the job logs. This satisfies
FR-012 (actionable failure output).

## Merge queue compatibility

`on: merge_group` is declared in `pr.yml` so that the same summary contract applies on
the merge-queue commit, not only on the PR head. Required checks are configured for the
`merge_group` event, per GitHub's merge-queue requirements.

## Pull requests from forks

Jobs that require secrets or OIDC (`reusable-deploy.yml`, `reusable-backend.yml`'s
integration job if it ever needs real AWS creds) set `if: github.event.pull_request.head.repo.full_name == github.repository`.
Fork PRs receive a visible skipped status with a reviewer comment explaining that a
maintainer must re-run the relevant workflow via `workflow_dispatch` after review.
