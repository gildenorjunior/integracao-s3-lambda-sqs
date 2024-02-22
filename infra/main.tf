provider "aws" {
  region = var.region
}

# Bucket S3
resource "aws_s3_bucket" "bucketS3" {
  bucket = var.bucket_name

  tags = var.tags
}

# Fila SQS
resource "aws_sqs_queue" "fila_sqs" {
  name                       = var.fila_sqs_name
  delay_seconds              = 90
  max_message_size           = 2048
  message_retention_seconds  = 86400
  visibility_timeout_seconds = 300
}

# Lambda
resource "aws_lambda_function" "lambda" {
  function_name = var.lambda_name
  architectures = ["x86_64"]
  role          = aws_iam_role.iam_lambda.arn
  handler       = var.handler
  runtime       = var.runtime
  filename      = var.filename_lambda
  memory_size   = var.memory_size
}

# trigger com s3
resource "aws_s3_bucket_notification" "s3_trigger" {
  bucket = aws_s3_bucket.bucketS3.id
  lambda_function {
    lambda_function_arn = aws_lambda_function.lambda.arn
    events              = ["s3:ObjectCreated:*", "s3:ObjectRemoved:*"]

  }
}
resource "aws_lambda_permission" "aws_lambda_permissao_evento_s3" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = "arn:aws:s3:::${aws_s3_bucket.bucketS3.id}"
}

# Role e policy para lambda
data "aws_iam_policy_document" "assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "iam_lambda" {
  name               = var.role_lambda_name
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

data "aws_iam_policy_document" "lambda_policy_document" {
  statement {
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "logs:CreateLogStream",
      "logs:CreateLogGroup",
      "logs:PutLogEvents",
      "sqs:SendMessage"
    ]
    resources = [
      "arn:aws:logs:*:*:*",
      "arn:aws:s3:::*/*",
      "arn:aws:sqs:*:*:integracao-fila.fifo"
    ]
  }
}

resource "aws_iam_policy" "lambda_policy" {
  name   = var.policy_lambda_name
  policy = data.aws_iam_policy_document.lambda_policy_document.json
}

resource "aws_iam_policy_attachment" "attachment-policy-lambda" {
  name       = "attachment-policy-lambda"
  roles      = [aws_iam_role.iam_lambda.name]
  policy_arn = aws_iam_policy.lambda_policy.arn
}