# Terraform Identity Module Validation

## Purpose

Manual validation checklist for the Cognito identity module (`infra/terraform/modules/identity/`). Run before merging any changes that affect authentication configuration.

## Validation Commands

```bash
# Format check
terraform -chdir=infra/terraform/environments/dev fmt -check -recursive

# Validate (requires initialized providers)
terraform -chdir=infra/terraform/environments/dev init -backend=false
terraform -chdir=infra/terraform/environments/dev validate
```

## Checklist

### Cognito Public Sign-Up

- [ ] `allow_admin_create_user_only = false` — public self-service sign-up is enabled
- [ ] `auto_verified_attributes = ["email"]` — email must be verified before first sign-in
- [ ] `email_verification_message` and `email_verification_subject` are configured

### Google OAuth Provider

- [ ] `google` identity provider is declared in `aws_cognito_identity_provider`
- [ ] Google client ID is read from SSM Parameter Store, not hardcoded
- [ ] Google client secret is read from SSM Parameter Store or Secrets Manager, not hardcoded
- [ ] `supported_identity_providers` includes both `COGNITO` and `Google`

### Password Policy

- [ ] Minimum length ≥ 8
- [ ] Password recovery via `cognito:forgot_password` flow is enabled
- [ ] `account_recovery_setting` includes `verified_email_address`

### No Committed Secrets

- [ ] No plaintext credentials appear in `.tf` or `.tfvars` files
- [ ] All secret references use `data.aws_ssm_parameter` or `data.aws_secretsmanager_secret_version`
- [ ] `.gitignore` covers `*.tfvars`, `terraform.tfstate*`, and `.terraform/`

### Callback / Logout URLs

- [ ] `callback_urls` includes both local (`http://localhost:5173`) and deployed app URLs
- [ ] `logout_urls` includes both local and deployed app URLs
- [ ] No production URLs are committed as variables — they come from environment variables or SSM

## Results

| Check | Status | Notes |
|-------|--------|-------|
| Public sign-up enabled | Pending | — |
| Email verification | Pending | — |
| Google provider wired | Pending | — |
| Secrets from SSM only | Pending | — |
| Password recovery | Pending | — |
| Callback URLs correct | Pending | — |

Update this table after each `terraform validate` run or Terraform plan review.
