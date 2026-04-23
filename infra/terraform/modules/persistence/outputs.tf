output "local_users_table_arn" {
  description = "ARN of the local users DynamoDB table."
  value       = aws_dynamodb_table.local_users.arn
}

output "local_users_table_name" {
  description = "Name of the local users DynamoDB table."
  value       = aws_dynamodb_table.local_users.name
}
