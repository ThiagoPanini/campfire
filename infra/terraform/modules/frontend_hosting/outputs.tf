output "distribution_domain_name" {
  description = "CloudFront distribution domain name."
  value       = aws_cloudfront_distribution.site.domain_name
}

output "distribution_id" {
  description = "CloudFront distribution identifier."
  value       = aws_cloudfront_distribution.site.id
}

output "distribution_hosted_zone_id" {
  description = "CloudFront hosted zone id for Route53 alias records."
  value       = aws_cloudfront_distribution.site.hosted_zone_id
}

output "site_bucket_name" {
  description = "Frontend asset bucket name."
  value       = aws_s3_bucket.site.bucket
}
