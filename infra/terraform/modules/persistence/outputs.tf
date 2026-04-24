output "local_users_table_arn" {
  description = "ARN of the local users DynamoDB table."
  value       = aws_dynamodb_table.local_users.arn
}

output "local_users_table_name" {
  description = "Name of the local users DynamoDB table."
  value       = aws_dynamodb_table.local_users.name
}

output "normalized_email_index_name" {
  description = "DynamoDB GSI name for normalized email lookup."
  value       = "gsi1"
}

output "provider_identity_index_name" {
  description = "DynamoDB GSI name for provider identity lookup."
  value       = "gsi2"
}
