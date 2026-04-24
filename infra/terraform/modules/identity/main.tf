data "aws_region" "current" {}

resource "aws_cognito_user_pool" "main" {
  name = "${var.application_name}-${var.environment}-users"

  auto_verified_attributes = ["email"]
  username_attributes      = ["email"]
  mfa_configuration        = "OFF"

  admin_create_user_config {
    allow_admin_create_user_only = false
  }

  dynamic "lambda_config" {
    for_each = var.pre_sign_up_lambda_arn != "" ? [1] : []
    content {
      pre_sign_up = var.pre_sign_up_lambda_arn
    }
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  password_policy {
    minimum_length    = 14
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  schema {
    attribute_data_type = "String"
    mutable             = true
    name                = "email"
    required            = true
  }

  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
  }

  tags = var.tags
}

resource "aws_cognito_identity_provider" "google" {
  count = var.google_provider_enabled ? 1 : 0

  user_pool_id  = aws_cognito_user_pool.main.id
  provider_name = "Google"
  provider_type = "Google"

  provider_details = {
    authorize_scopes = "openid email profile"
    client_id        = var.google_oauth_client_id
    client_secret    = var.google_oauth_client_secret
  }

  attribute_mapping = {
    email          = "email"
    email_verified = "email_verified"
    name           = "name"
  }
}

resource "aws_cognito_user_pool_domain" "main" {
  domain       = var.user_pool_domain_prefix
  user_pool_id = aws_cognito_user_pool.main.id
}

resource "aws_cognito_user_pool_client" "web" {
  name                                 = "${var.application_name}-${var.environment}-web"
  user_pool_id                         = aws_cognito_user_pool.main.id
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  callback_urls                        = var.callback_urls
  logout_urls                          = var.logout_urls
  supported_identity_providers         = var.google_provider_enabled ? ["COGNITO", "Google"] : ["COGNITO"]
  generate_secret                      = false
  prevent_user_existence_errors        = "ENABLED"

  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }

  access_token_validity  = 60
  id_token_validity      = 60
  refresh_token_validity = 14

  depends_on = [aws_cognito_identity_provider.google]
}

resource "aws_lambda_permission" "cognito_pre_sign_up" {
  count = var.pre_sign_up_lambda_arn != "" ? 1 : 0

  statement_id  = "AllowCognitoPreSignUpInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.pre_sign_up_lambda_arn
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.main.arn
}

resource "aws_ssm_parameter" "cognito_metadata" {
  name = var.metadata_parameter_name
  type = "String"
  value = jsonencode(
    {
      user_pool_id     = aws_cognito_user_pool.main.id
      user_pool_client = aws_cognito_user_pool_client.web.id
      hosted_ui_domain = aws_cognito_user_pool_domain.main.domain
      callback_urls    = var.callback_urls
      logout_urls      = var.logout_urls
      google_enabled   = var.google_provider_enabled
    }
  )

  tags = var.tags
}
