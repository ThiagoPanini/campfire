output "issuer_url" {
  description = "Cognito issuer URL."
  value       = aws_cognito_user_pool.main.endpoint
}

output "callback_urls" {
  description = "Configured OAuth callback URLs."
  value       = aws_cognito_user_pool_client.web.callback_urls
}

output "google_provider_enabled" {
  description = "Whether Google federation is configured."
  value       = var.google_provider_enabled
}

output "hosted_ui_base_url" {
  description = "Base URL for the Cognito Hosted UI domain."
  value       = "https://${aws_cognito_user_pool_domain.main.domain}.auth.${data.aws_region.current.name}.amazoncognito.com"
}

output "logout_urls" {
  description = "Configured OAuth logout URLs."
  value       = aws_cognito_user_pool_client.web.logout_urls
}

output "user_pool_client_id" {
  description = "Cognito app client id."
  value       = aws_cognito_user_pool_client.web.id
}

output "user_pool_domain" {
  description = "Hosted UI domain prefix."
  value       = aws_cognito_user_pool_domain.main.domain
}

output "user_pool_id" {
  description = "Cognito user pool id."
  value       = aws_cognito_user_pool.main.id
}
