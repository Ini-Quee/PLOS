# Azure Infrastructure Outputs

output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.plos.name
}

output "postgresql_fqdn" {
  description = "PostgreSQL server FQDN"
  value       = azurerm_postgresql_flexible_server.plos.fqdn
  sensitive   = true
}

output "redis_hostname" {
  description = "Redis cache hostname"
  value       = azurerm_redis_cache.plos.hostname
}

output "vm_public_ip" {
  description = "Public IP of the VM"
  value       = azurerm_public_ip.plos.ip_address
}

output "key_vault_name" {
  description = "Name of the Key Vault"
  value       = azurerm_key_vault.plos.name
}

output "managed_identity_id" {
  description = "Managed Identity ID"
  value       = azurerm_user_assigned_identity.plos.id
}
