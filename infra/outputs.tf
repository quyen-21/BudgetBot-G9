output "postgres_db_endpoint" {
  description = "The connection endpoint for the PostgreSQL RDS instance"
  value       = aws_db_instance.postgres_db.endpoint
}

output "csv_upload_bucket_name" {
  description = "The name of the S3 bucket for CSV uploads"
  value       = aws_s3_bucket.csv_uploads.bucket
}

output "aws_region" {
  description = "AWS region used for the deployment"
  value       = var.aws_region
}

# --- IAM USER 1 OUTPUTS ---
output "admin_user_1_name" {
  description = "IAM Username for Admin 1"
  value       = aws_iam_user.admin_user_1.name
}

output "admin_user_1_access_key" {
  description = "Access Key ID for Admin 1"
  value       = aws_iam_access_key.admin_user_1_key.id
}

output "admin_user_1_secret_key" {
  description = "Secret Access Key for Admin 1 (Sensitive)"
  value       = aws_iam_access_key.admin_user_1_key.secret
  sensitive   = true
}

# --- IAM USER 2 OUTPUTS ---
output "admin_user_2_name" {
  description = "IAM Username for Admin 2"
  value       = aws_iam_user.admin_user_2.name
}

output "admin_user_2_access_key" {
  description = "Access Key ID for Admin 2"
  value       = aws_iam_access_key.admin_user_2_key.id
}

output "admin_user_2_secret_key" {
  description = "Secret Access Key for Admin 2 (Sensitive)"
  value       = aws_iam_access_key.admin_user_2_key.secret
  sensitive   = true
}

# --- FRONTEND OUTPUTS ---
output "frontend_bucket_name" {
  description = "S3 bucket name for the frontend static site"
  value       = aws_s3_bucket.frontend.bucket
}

output "frontend_website_endpoint" {
  description = "S3 static website endpoint to access the frontend"
  value       = aws_s3_bucket_website_configuration.frontend.website_endpoint
}
