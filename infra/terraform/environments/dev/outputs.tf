output "api_endpoint" {
  description = "API endpoint URL."
  value       = module.api_runtime.api_endpoint
}

output "api_health_url" {
  description = "Health endpoint URL."
  value       = "${module.api_runtime.api_endpoint}/health"
}

output "frontend_bucket_name" {
  description = "Frontend hosting bucket."
  value       = module.frontend_hosting.site_bucket_name
}

output "web_domain" {
  description = "Public web domain."
  value       = local.web_domain
}
