variable "api_domain" {
  description = "Public API domain."
  type        = string
}

variable "application_name" {
  description = "Application name used for API resource naming."
  type        = string
}

variable "aws_region" {
  description = "AWS region for the API runtime."
  type        = string
}

variable "certificate_arn" {
  description = "ACM certificate ARN for the API custom domain."
  type        = string
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
}

variable "identity_metadata_parameter_arn" {
  description = "ARN of the SSM parameter containing Cognito metadata."
  type        = string
}

variable "lambda_zip_path" {
  description = "Path to the packaged Lambda zip artifact."
  type        = string
}

variable "local_users_table_arn" {
  description = "ARN of the local users DynamoDB table."
  type        = string
}

variable "local_users_table_name" {
  description = "Name of the local users DynamoDB table."
  type        = string
}

variable "log_group_arn" {
  description = "CloudWatch log group ARN used for API logs."
  type        = string
}

variable "tags" {
  description = "Common tags applied to API runtime resources."
  type        = map(string)
  default     = {}
}

variable "user_pool_client_id" {
  description = "Cognito app client identifier."
  type        = string
}

variable "user_pool_domain" {
  description = "Cognito Hosted UI domain prefix."
  type        = string
}

variable "user_pool_id" {
  description = "Cognito user pool identifier."
  type        = string
}

variable "web_domain" {
  description = "Public web domain."
  type        = string
}

variable "google_provider_enabled" {
  description = "Whether Google is enabled as a Cognito identity provider."
  type        = bool
  default     = false
}

variable "normalized_email_index_name" {
  description = "DynamoDB GSI name for normalized email lookups."
  type        = string
  default     = "gsi1"
}

variable "provider_identity_index_name" {
  description = "DynamoDB GSI name for provider identity lookups."
  type        = string
  default     = "gsi2"
}
