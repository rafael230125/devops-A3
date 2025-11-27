variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-2"
}

variable "image" {
  description = "Container image to deploy (e.g. user/repo:tag)"
  type        = string
}

variable "cluster_name" {
  description = "ECS cluster name"
  type        = string
  default     = "devops-a3-cluster3"
}
