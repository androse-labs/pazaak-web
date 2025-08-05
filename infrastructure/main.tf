locals {
  s3_origin_id = "S3-${aws_s3_bucket.androse_pazaak_bucket.bucket}"
}

# Static site bucket
resource "aws_s3_bucket" "androse_pazaak_bucket" {
  bucket        = "androse-pazaak-bucket"
  force_destroy = true

  tags = {
    Name        = "pazaak.androse.dev"
    Environment = "dev"
  }
}

resource "aws_s3_bucket_public_access_block" "media_bucket_public_access_block" {
  bucket = aws_s3_bucket.androse_pazaak_bucket.bucket

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "bucket_cors" {
  bucket = aws_s3_bucket.androse_pazaak_bucket.bucket

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_policy" "bucket_policy" {
  bucket = aws_s3_bucket.androse_pazaak_bucket.bucket
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid : "AllowCloudFrontServicePrincipal",
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.androse_pazaak_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.androse_dev_cf.arn
          }
        }
      },
    ]
  })
}

# Existing Route 53 hosted zone for androse.dev
data "aws_route53_zone" "androse_pf_zone" {
  name = "androse.dev"
}

data "aws_acm_certificate" "androse_pf_cert" {
  domain   = "pazaak.androse.dev"
  provider = aws.virginia
  statuses = ["ISSUED"]
}

# Alias record for the CloudFront distribution
resource "aws_route53_record" "androse_pazaak_cf" {
  zone_id = data.aws_route53_zone.androse_pf_zone.zone_id
  name    = "pazaak.androse.dev"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.androse_dev_cf.domain_name
    zone_id                = aws_cloudfront_distribution.androse_dev_cf.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_cloudfront_distribution" "androse_dev_cf" {
  origin {
    domain_name              = aws_s3_bucket.androse_pazaak_bucket.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.cloudfront_oac.id
    origin_id                = local.s3_origin_id
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Some comment"
  default_root_object = "index.html"

  custom_error_response {
    error_code            = 403
    response_code         = 404
    response_page_path    = "/error.html"
    error_caching_min_ttl = 10
  }

  aliases = ["pazaak.androse.dev"]

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = local.s3_origin_id

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "allow-all"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = {
    Environment = "dev"
  }

  viewer_certificate {
    acm_certificate_arn      = data.aws_acm_certificate.androse_pf_cert.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}

resource "aws_cloudfront_origin_access_control" "cloudfront_oac" {
  name                              = "pazaak-androse-dev-oac"
  description                       = "OAC for pazaak.androse.dev"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

output "website_endpoint" {
  value = aws_cloudfront_distribution.androse_dev_cf.domain_name
}
