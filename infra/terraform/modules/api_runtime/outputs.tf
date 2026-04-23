output "api_endpoint" {
  description = "Default HTTP API endpoint."
  value       = aws_apigatewayv2_api.http.api_endpoint
}

output "custom_domain_hosted_zone_id" {
  description = "Hosted zone id for the API custom domain target."
  value       = aws_apigatewayv2_domain_name.api.domain_name_configuration[0].hosted_zone_id
}

output "custom_domain_target" {
  description = "Regional domain target for the API custom domain."
  value       = aws_apigatewayv2_domain_name.api.domain_name_configuration[0].target_domain_name
}

output "execution_arn" {
  description = "HTTP API execution ARN."
  value       = aws_apigatewayv2_api.http.execution_arn
}

output "lambda_function_name" {
  description = "API Lambda function name."
  value       = aws_lambda_function.api.function_name
}
