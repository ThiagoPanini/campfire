data "aws_route53_zone" "main" {
  name         = var.root_domain
  private_zone = false
}

resource "aws_acm_certificate" "site" {
  provider          = aws.us_east_1
  domain_name       = var.web_domain
  validation_method = "DNS"
  subject_alternative_names = [
    var.api_domain,
  ]

  tags = var.tags
}

resource "aws_route53_record" "certificate_validation" {
  for_each = {
    for option in aws_acm_certificate.site.domain_validation_options :
    option.domain_name => {
      name   = option.resource_record_name
      record = option.resource_record_value
      type   = option.resource_record_type
    }
  }

  zone_id = data.aws_route53_zone.main.zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 60
  records = [each.value.record]
}

resource "aws_acm_certificate_validation" "site" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.site.arn
  validation_record_fqdns = [for record in aws_route53_record.certificate_validation : record.fqdn]
}
