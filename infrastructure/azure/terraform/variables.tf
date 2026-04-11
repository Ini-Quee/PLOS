# Azure Infrastructure Variables

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
  default     = "plos-production"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "eastus"
}

variable "environment" {
  description = "Environment (production, staging, development)"
  type        = string
  default     = "production"
}

variable "db_admin_username" {
  description = "PostgreSQL admin username"
  type        = string
  sensitive   = true
}

variable "db_admin_password" {
  description = "PostgreSQL admin password"
  type        = string
  sensitive   = true
}

variable "vm_admin_username" {
  description = "VM admin username"
  type        = string
  default     = "plosadmin"
}

variable "jwt_secret" {
  description = "JWT signing secret"
  type        = string
  sensitive   = true
}

variable "jwt_refresh_secret" {
  description = "JWT refresh token secret"
  type        = string
  sensitive   = true
}

variable "gmail_app_password" {
  description = "Gmail app password for email service"
  type        = string
  sensitive   = true
}
