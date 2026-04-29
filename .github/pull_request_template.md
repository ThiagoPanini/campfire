## Validation

- [ ] Target branch is correct (`staging` for feature work, `main` only for staging promotion).
- [ ] `ci-status` is green.
- [ ] Failing job logs, if any, have been reviewed and fixed.
- [ ] No secrets, deploy hooks, tokens, or real `.env` values are included.

## Promotion Checklist

- [ ] Staging deployment completed successfully, when this PR promotes `staging` to `main`.
- [ ] `/healthz`, `/readyz`, and frontend probes are green for the target environment.
- [ ] Database migration path is understood for the target Render plan.
- [ ] Rollback path is known before production merge.
