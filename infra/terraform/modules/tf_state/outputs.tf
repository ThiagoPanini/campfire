output "lock_table_name" {
  description = "Terraform state lock table name."
  value       = aws_dynamodb_table.lock.name
}

output "state_bucket_name" {
  description = "Terraform state bucket name."
  value       = aws_s3_bucket.state.bucket
}
