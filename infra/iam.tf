# -----------------------------------------------------------------------------
# IAM USERS (Administrator Access)
# CẢNH BÁO: Cấp quyền AdministratorAccess mang rủi ro bảo mật cao. 
# Chỉ nên dùng cho môi trường phát triển (Hackathon) hoặc cấp cho người cực kỳ tin tưởng.
# -----------------------------------------------------------------------------

# --- IAM User 1 ---
resource "aws_iam_user" "admin_user_1" {
  name = "botui-admin-1"
  path = "/"
}

resource "aws_iam_access_key" "admin_user_1_key" {
  user = aws_iam_user.admin_user_1.name
}

resource "aws_iam_user_policy_attachment" "admin_user_1_policy" {
  user       = aws_iam_user.admin_user_1.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

# --- IAM User 2 ---
resource "aws_iam_user" "admin_user_2" {
  name = "botui-admin-2"
  path = "/"
}

resource "aws_iam_access_key" "admin_user_2_key" {
  user = aws_iam_user.admin_user_2.name
}

resource "aws_iam_user_policy_attachment" "admin_user_2_policy" {
  user       = aws_iam_user.admin_user_2.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}
