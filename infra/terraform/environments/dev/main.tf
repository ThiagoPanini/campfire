locals {
  api_domain = "api.${var.root_domain}"
  common_tags = {
    Application = var.application_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
  identity_parameter_name = "/${var.application_name}/${var.environment}/identity/metadata"
  local_users_table_name  = "${var.application_name}-${var.environment}-local-users"
  web_bucket_name         = "${var.application_name}-${var.environment}-web"
  web_domain              = "app.${var.root_domain}"
}

module "dns" {
  source = "../../modules/dns"

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  api_domain  = local.api_domain
  root_domain = var.root_domain
  tags        = local.common_tags
  web_domain  = local.web_domain
}

module "frontend_hosting" {
  source = "../../modules/frontend_hosting"

  application_name = var.application_name
  bucket_name      = local.web_bucket_name
  certificate_arn  = module.dns.certificate_arn
  environment      = var.environment
  tags             = local.common_tags
  web_domain       = local.web_domain
}

module "identity" {
  source = "../../modules/identity"

  application_name           = var.application_name
  callback_urls              = concat(["https://${local.web_domain}/auth/callback"], var.local_callback_urls)
  environment                = var.environment
  google_oauth_client_id     = var.google_oauth_client_id
  google_oauth_client_secret = var.google_oauth_client_secret
  google_provider_enabled    = var.google_provider_enabled
  logout_urls                = concat(["https://${local.web_domain}/"], var.local_logout_urls)
  metadata_parameter_name    = local.identity_parameter_name
  tags                       = local.common_tags
  user_pool_domain_prefix    = var.user_pool_domain_prefix
}

module "persistence" {
  source = "../../modules/persistence"

  table_name = local.local_users_table_name
  tags       = local.common_tags
}

module "observability" {
  source = "../../modules/observability"

  application_name     = var.application_name
  environment          = var.environment
  lambda_function_name = "${var.application_name}-${var.environment}-api"
  tags                 = local.common_tags
}

module "api_runtime" {
  source = "../../modules/api_runtime"

  api_domain                      = local.api_domain
  application_name                = var.application_name
  aws_region                      = var.aws_region
  certificate_arn                 = module.dns.certificate_arn
  environment                     = var.environment
  identity_metadata_parameter_arn = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter${local.identity_parameter_name}"
  lambda_zip_path                 = var.lambda_zip_path
  local_users_table_arn            = module.persistence.local_users_table_arn
  local_users_table_name           = module.persistence.local_users_table_name
  log_group_arn                    = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:${module.observability.api_log_group_name}"
  normalized_email_index_name      = module.persistence.normalized_email_index_name
  provider_identity_index_name     = module.persistence.provider_identity_index_name
  google_provider_enabled          = var.google_provider_enabled
  tags                             = local.common_tags
  user_pool_client_id              = module.identity.user_pool_client_id
  user_pool_domain                 = module.identity.user_pool_domain
  user_pool_id                     = module.identity.user_pool_id
  web_domain                       = local.web_domain
}

data "aws_caller_identity" "current" {}

resource "aws_route53_record" "web_alias" {
  zone_id = module.dns.route53_zone_id
  name    = local.web_domain
  type    = "A"

  alias {
    evaluate_target_health = false
    name                   = module.frontend_hosting.distribution_domain_name
    zone_id                = module.frontend_hosting.distribution_hosted_zone_id
  }
}

resource "aws_route53_record" "api_alias" {
  zone_id = module.dns.route53_zone_id
  name    = local.api_domain
  type    = "A"

  alias {
    evaluate_target_health = false
    name                   = module.api_runtime.custom_domain_target
    zone_id                = module.api_runtime.custom_domain_hosted_zone_id
  }
}
