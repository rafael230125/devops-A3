variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-west-1"
}

variable "image" {
  description = "Container image to deploy (e.g. user/repo:tag)"
  type        = string
}

variable "cluster_name" {
  description = "ECS cluster name"
  type        = string
  default     = "devops-a3-cluster1"
}

variable "name_prefix" {
  description = "Base prefix for all resource names (e.g. strapi-a3)"
  type        = string
  default     = "strapi-a3"
}

variable "version_suffix" {
  description = "Optional version suffix for service (e.g. -v2). Leave blank for none."
  type        = string
  default     = ""
}

variable "environment" {
  description = "Deployment environment tag (e.g. dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "enable_tags" {
  description = "Enable adding standard tags to resources"
  type        = bool
  default     = true
}

locals {
  service_name   = "${var.name_prefix}-service${var.version_suffix}"
  lb_name        = "${var.name_prefix}-alb"
  tg_name        = "${var.name_prefix}-tg"
  task_family    = "${var.name_prefix}-task"
  container_name = var.name_prefix
  common_tags = var.enable_tags ? {
    Project     = var.name_prefix
    Environment = var.environment
    Version     = var.version_suffix == "" ? "v1" : replace(var.version_suffix, "-", "")
  } : {}
}
