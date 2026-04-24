variable "application_name" {
  description = "Application name for Cognito resources."
  type        = string
}

variable "callback_urls" {
  description = "Allowed Hosted UI callback URLs."
  type        = list(string)
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
}

variable "google_oauth_client_id" {
  description = "Google OAuth client id for Cognito federation. Leave empty when Google is disabled."
  type        = string
  default     = ""
}

variable "google_oauth_client_secret" {
  description = "Google OAuth client secret supplied from managed secret storage."
  type        = string
  default     = ""
  sensitive   = true
}

variable "google_provider_enabled" {
  description = "Whether to configure Google as a Cognito identity provider."
  type        = bool
  default     = false
}

variable "logout_urls" {
  description = "Allowed Hosted UI logout redirect URLs."
  type        = list(string)
}

variable "metadata_parameter_name" {
  description = "SSM parameter name storing Cognito metadata."
  type        = string
}

variable "tags" {
  description = "Common tags applied to identity resources."
  type        = map(string)
  default     = {}
}

variable "user_pool_domain_prefix" {
  description = "Unique Cognito Hosted UI domain prefix."
  type        = string
}

variable "pre_sign_up_lambda_arn" {
  description = "ARN of the Lambda function wired as the Cognito pre-sign-up trigger for account linking. Leave empty to skip the trigger."
  type        = string
  default     = ""
}
