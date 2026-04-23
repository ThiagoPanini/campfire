variable "table_name" {
  description = "DynamoDB table name for local users."
  type        = string
}

variable "tags" {
  description = "Common tags applied to persistence resources."
  type        = map(string)
  default     = {}
}
