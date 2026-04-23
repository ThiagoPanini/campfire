resource "aws_cognito_user_pool" "main" {
  name = "${var.application_name}-${var.environment}-users"

  auto_verified_attributes = ["email"]

  admin_create_user_config {
    allow_admin_create_user_only = true
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
  callback_urls                        = [var.callback_url]
  logout_urls                          = [var.logout_url]
  supported_identity_providers         = ["COGNITO"]
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
}

resource "aws_ssm_parameter" "cognito_metadata" {
  name = var.metadata_parameter_name
  type = "String"
  value = jsonencode(
    {
      user_pool_id     = aws_cognito_user_pool.main.id
      user_pool_client = aws_cognito_user_pool_client.web.id
      hosted_ui_domain = aws_cognito_user_pool_domain.main.domain
    }
  )

  tags = var.tags
}
