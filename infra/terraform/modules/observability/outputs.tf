output "api_log_group_name" {
  description = "CloudWatch log group name for the API Lambda."
  value       = aws_cloudwatch_log_group.api.name
}

output "lambda_error_alarm_arn" {
  description = "Alarm ARN for Lambda errors."
  value       = aws_cloudwatch_metric_alarm.lambda_errors.arn
}
