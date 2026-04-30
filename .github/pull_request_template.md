## Validation

- [ ] Target branch is correct (`develop` for feature work, `main` only for develop promotion).
- [ ] `ci-status` is green.
- [ ] Failing job logs, if any, have been reviewed and fixed.
- [ ] No secrets, deploy hooks, tokens, or real `.env` values are included.

## Promotion Checklist

- [ ] Develop deployment completed successfully, when this PR promotes `develop` to `main`.
- [ ] `/healthz`, `/readyz`, and frontend probes are green for the target environment.
- [ ] Database migration path is understood for the target Render plan.
- [ ] Rollback path is known before production merge.
