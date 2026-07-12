# Spegnimento/accensione automatico dell'istanza EC2 (00:00-07:00 Europe/Rome)
# per ridurre le ore fatturate. Codice della Lambda: infra/ec2-scheduler/handler.py
# (condiviso, non duplicato qui). L'Elastic IP resta associato all'istanza anche
# da ferma; `restart: unless-stopped` nei servizi Docker fa ripartire tutto da
# solo al riavvio mattutino della VM.

data "archive_file" "ec2_scheduler" {
  type        = "zip"
  source_file = "${path.module}/../ec2-scheduler/handler.py"
  output_path = "${path.module}/.build/ec2-scheduler.zip"
}

resource "aws_iam_role" "ec2_scheduler" {
  name = "${var.project_name}-ec2-scheduler"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "ec2_scheduler" {
  name = "${var.project_name}-ec2-start-stop"
  role = aws_iam_role.ec2_scheduler.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["ec2:StartInstances", "ec2:StopInstances"]
        Resource = "arn:aws:ec2:${var.aws_region}:*:instance/${aws_instance.this.id}"
      },
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "arn:aws:logs:${var.aws_region}:*:log-group:/aws/lambda/${var.project_name}-ec2-scheduler:*"
      }
    ]
  })
}

resource "aws_lambda_function" "ec2_scheduler" {
  function_name    = "${var.project_name}-ec2-scheduler"
  role             = aws_iam_role.ec2_scheduler.arn
  handler          = "handler.handler"
  runtime          = "python3.12"
  timeout          = 10
  filename         = data.archive_file.ec2_scheduler.output_path
  source_code_hash = data.archive_file.ec2_scheduler.output_base64sha256

  environment {
    variables = {
      INSTANCE_ID = aws_instance.this.id
    }
  }
}

resource "aws_iam_role" "scheduler_invoke" {
  name = "${var.project_name}-scheduler-invoke"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "scheduler.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "scheduler_invoke" {
  name = "${var.project_name}-invoke-lambda"
  role = aws_iam_role.scheduler_invoke.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "lambda:InvokeFunction"
      Resource = aws_lambda_function.ec2_scheduler.arn
    }]
  })
}

resource "aws_scheduler_schedule" "stop_nightly" {
  name       = "${var.project_name}-stop"
  group_name = "default"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression          = "cron(0 0 * * ? *)"
  schedule_expression_timezone = "Europe/Rome"

  target {
    arn      = aws_lambda_function.ec2_scheduler.arn
    role_arn = aws_iam_role.scheduler_invoke.arn
    input    = jsonencode({ action = "stop" })
  }
}

resource "aws_scheduler_schedule" "start_morning" {
  name       = "${var.project_name}-start"
  group_name = "default"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression          = "cron(0 7 * * ? *)"
  schedule_expression_timezone = "Europe/Rome"

  target {
    arn      = aws_lambda_function.ec2_scheduler.arn
    role_arn = aws_iam_role.scheduler_invoke.arn
    input    = jsonencode({ action = "start" })
  }
}
