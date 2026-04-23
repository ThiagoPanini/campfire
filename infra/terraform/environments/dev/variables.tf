variable "application_name" {
  description = "Application name used in resource naming."
  type        = string
  default     = "campfire"
}

variable "aws_region" {
  description = "Primary AWS region."
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment."
  type        = string
  default     = "dev"
}

variable "lambda_zip_path" {
  description = "Path to the packaged Lambda artifact."
  type        = string
  default     = "../../../dist/campfire-api.zip"
}

variable "root_domain" {
  description = "Root public domain."
  type        = string
}

variable "user_pool_domain_prefix" {
  description = "Unique Cognito Hosted UI prefix."
  type        = string
}
