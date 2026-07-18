# Bucket S3 per i backup giornalieri (infra/backup.sh) + ruolo IAM assegnato
# all'istanza EC2 via instance profile, così il server può scrivere sul
# bucket senza credenziali statiche in .env.

data "aws_caller_identity" "current" {}

resource "aws_s3_bucket" "backups" {
  bucket = "${var.project_name}-backups-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_public_access_block" "backups" {
  bucket = aws_s3_bucket.backups.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    id     = "expire-after-30-days"
    status = "Enabled"

    filter {}

    expiration {
      days = 30
    }
  }
}

resource "aws_iam_role" "ec2_backup" {
  name = "${var.project_name}-ec2-backup"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "ec2_backup" {
  name = "${var.project_name}-rw-backups"
  role = aws_iam_role.ec2_backup.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # scrittura (backup.sh) e lettura oggetti (restore.sh)
        Effect   = "Allow"
        Action   = ["s3:PutObject", "s3:GetObject"]
        Resource = "${aws_s3_bucket.backups.arn}/*"
      },
      {
        # elenco oggetti: restore.sh cerca l'ultimo backup nel bucket
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = aws_s3_bucket.backups.arn
      },
    ]
  })
}

resource "aws_iam_instance_profile" "ec2_backup" {
  name = "${var.project_name}-ec2-backup"
  role = aws_iam_role.ec2_backup.name
}
