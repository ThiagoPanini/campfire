variable "application_name" {
  description = "Application name used in alarm naming."
  type        = string
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
}

variable "lambda_function_name" {
  description = "Name of the Lambda function being observed."
  type        = string
}

variable "tags" {
  description = "Common tags applied to observability resources."
  type        = map(string)
  default     = {}
}
