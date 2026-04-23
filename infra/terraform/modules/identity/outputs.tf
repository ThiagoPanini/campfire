output "issuer_url" {
  description = "Cognito issuer URL."
  value       = aws_cognito_user_pool.main.endpoint
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
