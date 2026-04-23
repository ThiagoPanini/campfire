output "certificate_arn" {
  description = "Validated ACM certificate ARN for the web and API domains."
  value       = aws_acm_certificate_validation.site.certificate_arn
}

output "route53_zone_id" {
  description = "Route53 hosted zone identifier."
  value       = data.aws_route53_zone.main.zone_id
}
