terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # TODO: Chuyển sang Remote State khi S3 Bucket được cấp quyền/tạo
  # Bỏ comment block dưới đây và thay thế YOUR_BUCKET_NAME
  /*
  backend "s3" {
    bucket         = "YOUR_BUCKET_NAME"
    key            = "botui-ai-money-coach/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    # dynamodb_table = "terraform-lock-table" # Mở comment nếu dùng DynamoDB để lock state
  }
  */
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# -----------------------------------------------------------------------------
# RELATIONAL DATABASE (PostgreSQL - Thay thế DynamoDB theo chuẩn kiến trúc cũ)
# -----------------------------------------------------------------------------
resource "aws_db_instance" "postgres_db" {
  identifier           = "${var.project_name}-${var.environment}-db"
  engine               = "postgres"
  engine_version       = "15.4" # Hoặc phiên bản Postgres bạn đang dùng
  instance_class       = "db.t4g.micro" # Tier miễn phí/giá rẻ cho Hackathon
  allocated_storage    = 20
  storage_type         = "gp3"
  
  db_name              = "botuidb"
  username             = "postgres"
  # Mật khẩu nên được quản lý qua AWS Secrets Manager hoặc biến môi trường trong thực tế,
  # Đặt tạm mật khẩu tĩnh để khởi tạo nhanh (hãy đổi sau):
  password             = "Botui!SuperSecretPassword2026"
  
  skip_final_snapshot  = true # Bỏ qua snapshot khi xoá DB (chỉ dùng cho Dev/Hackathon)
  publicly_accessible  = false # Khuyến cáo bảo mật: Không mở public
}

# -----------------------------------------------------------------------------
# NETWORK (VPC, Subnets, Security Groups) - Đang chờ triển khai (Placeholder)
# Theo cấu trúc Lean Relational: DB sẽ nằm trong Private Subnet, Lambda trong Public Subnet
# -----------------------------------------------------------------------------
# resource "aws_vpc" "main" { ... }
# resource "aws_subnet" "private" { ... }
# resource "aws_security_group" "db_sg" { ... }

# -----------------------------------------------------------------------------
# BACKEND (API Gateway, Lambda FastAPI) - Đang chờ triển khai (Placeholder)
# -----------------------------------------------------------------------------
# resource "aws_api_gateway_rest_api" "botui_api" { ... }
# resource "aws_lambda_function" "fastapi_backend" { ... }

# -----------------------------------------------------------------------------
# FRONTEND (Amplify Next.js) - Đang chờ triển khai (Placeholder)
# -----------------------------------------------------------------------------
# resource "aws_amplify_app" "botui_frontend" { ... }

# -----------------------------------------------------------------------------
# SSM PARAMETER STORE (Quản lý mật khẩu an toàn) - Đang chờ triển khai (Placeholder)
# -----------------------------------------------------------------------------
# resource "aws_ssm_parameter" "db_password" { ... }

# -----------------------------------------------------------------------------
# S3 BUCKET CHO CSV UPLOAD
# -----------------------------------------------------------------------------
resource "aws_s3_bucket" "csv_uploads" {
  bucket_prefix = "${var.project_name}-${var.environment}-uploads-"
  force_destroy = true
}

resource "aws_s3_bucket_lifecycle_configuration" "csv_uploads_lifecycle" {
  bucket = aws_s3_bucket.csv_uploads.id

  rule {
    id     = "auto-delete-csv-after-7-days"
    status = "Enabled"

    expiration {
      days = 7
    }
  }
}

# LƯU Ý: Đã tạm ẩn các tài nguyên liên quan tới Amazon Bedrock (IAM Role, Policies) 
# theo yêu cầu (chưa xin được quyền).
