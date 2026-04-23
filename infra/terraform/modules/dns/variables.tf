variable "api_domain" {
  description = "Public API domain name."
  type        = string
}

variable "root_domain" {
  description = "Root Route53 domain."
  type        = string
}

variable "tags" {
  description = "Common tags applied to DNS resources."
  type        = map(string)
  default     = {}
}

variable "web_domain" {
  description = "Public web domain name."
  type        = string
}
