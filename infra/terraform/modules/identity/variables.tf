variable "application_name" {
  description = "Application name for Cognito resources."
  type        = string
}

variable "callback_url" {
  description = "Hosted UI callback URL."
  type        = string
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
}

variable "logout_url" {
  description = "Hosted UI logout redirect URL."
  type        = string
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
