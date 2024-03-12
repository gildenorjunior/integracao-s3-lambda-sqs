variable "bucket_name" {
  type        = string
  description = "Nome do bucket"
}

variable "region" {
  type        = string
  description = "Região AWS"
}

variable "tags" {
  type        = map(string)
  description = ""
  default = {
    "Name"    = "Meu bucket de teste"
    "Projeto" = "Projeto de testes"
  }
}

# sqs
variable "fila_sqs_name" {
  type        = string
  description = "Nome da fila SQS"
}

# lambda
variable "lambda_name" {
  type        = string
  description = "Nome da lambda"
}

variable "handler" {
  type        = string
  default     = "index.handler"
  description = "Handle"
}

variable "filename_lambda" {
  type        = string
  description = "File name lambda"
  default     = "/codigo-lambda.zip"
}

variable "memory_size" {
  type        = number
  default     = 512
  description = "Memory size"
}

variable "runtime" {
  type        = string
  default     = "nodejs18.x"
  description = "Runtime lambda"
}

variable "role_lambda_name" {
  type        = string
  description = "Role lambda name"
}

variable "policy_lambda_name" {
  type        = string
  description = "Policy lambda name"
}