variable "application_name" {
  description = "Application name for resource naming."
  type        = string
}

variable "bucket_name" {
  description = "S3 bucket name for frontend assets."
  type        = string
}

variable "certificate_arn" {
  description = "ACM certificate ARN used by CloudFront."
  type        = string
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
}

variable "tags" {
  description = "Common tags applied to frontend hosting resources."
  type        = map(string)
  default     = {}
}

variable "web_domain" {
  description = "Public web domain alias."
  type        = string
}
