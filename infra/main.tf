terraform {
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 0.15"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

# Vercel Project
resource "vercel_project" "learning_accelerator" {
  name      = "learning-accelerator"
  framework = "nextjs"
  
  environment = [
    {
      key    = "NEXT_PUBLIC_SUPABASE_URL"
      value  = var.supabase_url
      target = ["production", "preview"]
    },
    {
      key    = "NEXT_PUBLIC_SUPABASE_ANON_KEY"
      value  = var.supabase_anon_key
      target = ["production", "preview"]
    }
  ]
}

# S3 Backup Bucket
resource "aws_s3_bucket" "backups" {
  bucket = "la-backups-${random_id.bucket_suffix.hex}"
}

resource "aws_s3_bucket_versioning" "backups" {
  bucket = aws_s3_bucket.backups.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    id     = "delete_old_backups"
    status = "Enabled"

    expiration {
      days = 30
    }
  }
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# Cloudflare DNS
resource "cloudflare_record" "app" {
  zone_id = var.cloudflare_zone_id
  name    = "app"
  value   = vercel_project.learning_accelerator.domains[0]
  type    = "CNAME"
  proxied = true
}

resource "cloudflare_record" "api" {
  zone_id = var.cloudflare_zone_id
  name    = "api"
  value   = "${var.fly_app_name}.fly.dev"
  type    = "CNAME"
  proxied = true
}

# Variables
variable "supabase_url" {
  description = "Supabase project URL"
  type        = string
}

variable "supabase_anon_key" {
  description = "Supabase anonymous key"
  type        = string
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID"
  type        = string
}

variable "fly_app_name" {
  description = "Fly.io app name"
  type        = string
  default     = "learning-accelerator-api"
}

# Outputs
output "vercel_url" {
  value = vercel_project.learning_accelerator.domains[0]
}

output "s3_bucket_arn" {
  value = aws_s3_bucket.backups.arn
}

output "fly_app_url" {
  value = "https://${var.fly_app_name}.fly.dev"
}