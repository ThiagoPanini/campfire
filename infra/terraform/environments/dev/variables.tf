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

variable "google_oauth_client_id" {
  description = "Google OAuth client id used when Google federation is enabled."
  type        = string
  default     = ""
}

variable "google_oauth_client_secret" {
  description = "Google OAuth client secret supplied from managed secret storage for dev validation."
  type        = string
  default     = ""
  sensitive   = true
}

variable "google_provider_enabled" {
  description = "Whether the dev environment configures Google federation."
  type        = bool
  default     = false
}

variable "local_callback_urls" {
  description = "Additional local callback URLs allowed for dev auth validation."
  type        = list(string)
  default     = ["http://127.0.0.1:5173/auth/callback", "http://localhost:5173/auth/callback"]
}

variable "local_logout_urls" {
  description = "Additional local logout URLs allowed for dev auth validation."
  type        = list(string)
  default     = ["http://127.0.0.1:5173/", "http://localhost:5173/"]
}

variable "root_domain" {
  description = "Root public domain."
  type        = string
}

variable "user_pool_domain_prefix" {
  description = "Unique Cognito Hosted UI prefix."
  type        = string
}
