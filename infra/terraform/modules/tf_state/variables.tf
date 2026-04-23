variable "bucket_name" {
  description = "Name of the Terraform state bucket."
  type        = string
}

variable "lock_table_name" {
  description = "Name of the DynamoDB table used for state locking."
  type        = string
}

variable "tags" {
  description = "Common tags applied to state resources."
  type        = map(string)
  default     = {}
}
