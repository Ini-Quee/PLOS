# Azure Infrastructure for PLOS
# Per AGENTS.md Part 7 — Security Portfolio

terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
  
  backend "azurerm" {
    resource_group_name  = "plos-terraform-state"
    storage_account_name = "plosterraformstate"
    container_name       = "tfstate"
    key                  = "plos.terraform.tfstate"
  }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy = false
    }
  }
}

# Resource Group
resource "azurerm_resource_group" "plos" {
  name     = var.resource_group_name
  location = var.location
  
  tags = {
    environment = var.environment
    project     = "plos"
    managed_by  = "terraform"
  }
}

# Virtual Network
resource "azurerm_virtual_network" "plos" {
  name                = "plos-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.plos.location
  resource_group_name = azurerm_resource_group.plos.name
}

# Subnets
resource "azurerm_subnet" "web" {
  name                 = "web-subnet"
  resource_group_name  = azurerm_resource_group.plos.name
  virtual_network_name = azurerm_virtual_network.plos.name
  address_prefixes     = ["10.0.1.0/24"]
}

resource "azurerm_subnet" "database" {
  name                 = "database-subnet"
  resource_group_name  = azurerm_resource_group.plos.name
  virtual_network_name = azurerm_virtual_network.plos.name
  address_prefixes     = ["10.0.2.0/24"]
  
  service_endpoints = ["Microsoft.Sql"]
}

resource "azurerm_subnet" "redis" {
  name                 = "redis-subnet"
  resource_group_name  = azurerm_resource_group.plos.name
  virtual_network_name = azurerm_virtual_network.plos.name
  address_prefixes     = ["10.0.3.0/24"]
}

# Network Security Group - Web
resource "azurerm_network_security_group" "web" {
  name                = "plos-web-nsg"
  location            = azurerm_resource_group.plos.location
  resource_group_name = azurerm_resource_group.plos.name
  
  security_rule {
    name                       = "AllowHTTPS"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
  
  security_rule {
    name                       = "AllowHTTP"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
  
  security_rule {
    name                       = "DenySSH"
    priority                   = 200
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

# Network Security Group - Database
resource "azurerm_network_security_group" "database" {
  name                = "plos-database-nsg"
  location            = azurerm_resource_group.plos.location
  resource_group_name = azurerm_resource_group.plos.name
  
  security_rule {
    name                       = "AllowWebSubnet"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "5432"
    source_address_prefix      = "10.0.1.0/24"
    destination_address_prefix = "*"
  }
  
  security_rule {
    name                       = "DenyInternet"
    priority                   = 200
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "Internet"
    destination_address_prefix = "*"
  }
}

# PostgreSQL Server
resource "azurerm_postgresql_flexible_server" "plos" {
  name                = "plos-postgresql-${var.environment}"
  resource_group_name = azurerm_resource_group.plos.name
  location            = azurerm_resource_group.plos.location
  
  sku_name   = "B_Standard_B1ms"
  version    = "14"
  storage_mb = 32768
  
  administrator_login    = var.db_admin_username
  administrator_password = var.db_admin_password
  
  zone = "1"
  
  high_availability {
    mode = "Disabled"
  }
  
  delegated_subnet_id = azurerm_subnet.database.id
  private_dns_zone_id = azurerm_private_dns_zone.postgres.id
  
  tags = {
    environment = var.environment
  }
}

# Private DNS Zone for PostgreSQL
resource "azurerm_private_dns_zone" "postgres" {
  name                = "private.postgres.database.azure.com"
  resource_group_name = azurerm_resource_group.plos.name
}

resource "azurerm_private_dns_zone_virtual_network_link" "postgres" {
  name                  = "postgres-dns-link"
  resource_group_name   = azurerm_resource_group.plos.name
  private_dns_zone_name = azurerm_private_dns_zone.postgres.name
  virtual_network_id    = azurerm_virtual_network.plos.id
}

# PostgreSQL Database
resource "azurerm_postgresql_flexible_server_database" "plos" {
  name      = "plos"
  server_id = azurerm_postgresql_flexible_server.plos.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

# PostgreSQL Firewall Rule (restrict to web subnet)
resource "azurerm_postgresql_flexible_server_firewall_rule" "web" {
  name             = "allow-web-subnet"
  server_id        = azurerm_postgresql_flexible_server.plos.id
  start_ip_address = "10.0.1.0"
  end_ip_address   = "10.0.1.255"
}

# Redis Cache (Azure Cache for Redis)
resource "azurerm_redis_cache" "plos" {
  name                = "plos-redis-${var.environment}"
  location            = azurerm_resource_group.plos.location
  resource_group_name = azurerm_resource_group.plos.name
  
  capacity = 0
  family   = "C"
  sku_name = "Standard"
  
  minimum_tls_version = "1.2"
  
  subnet_id = azurerm_subnet.redis.id
  
  redis_configuration {
    maxmemory_policy = "allkeys-lru"
  }
  
  tags = {
    environment = var.environment
  }
}

# Virtual Machine (for backend)
resource "azurerm_linux_virtual_machine" "plos" {
  name                = "plos-api-${var.environment}"
  resource_group_name = azurerm_resource_group.plos.name
  location            = azurerm_resource_group.plos.location
  size                = "Standard_B1s"
  
  admin_username = var.vm_admin_username
  
  network_interface_ids = [
    azurerm_network_interface.plos.id
  ]
  
  admin_ssh_key {
    username   = var.vm_admin_username
    public_key = file("~/.ssh/id_rsa.pub")
  }
  
  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }
  
  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts"
    version   = "latest"
  }
  
  custom_data = base64encode(templatefile("${path.module}/cloud-init.sh", {
    db_host     = azurerm_postgresql_flexible_server.plos.fqdn
    db_name     = "plos"
    db_user     = var.db_admin_username
    db_password = var.db_admin_password
    redis_host  = azurerm_redis_cache.plos.hostname
    redis_key   = azurerm_redis_cache.plos.primary_access_key
  }))
  
  tags = {
    environment = var.environment
  }
}

# Network Interface
resource "azurerm_network_interface" "plos" {
  name                = "plos-nic"
  location            = azurerm_resource_group.plos.location
  resource_group_name = azurerm_resource_group.plos.name
  
  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.web.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.plos.id
  }
}

# Public IP
resource "azurerm_public_ip" "plos" {
  name                = "plos-public-ip"
  resource_group_name = azurerm_resource_group.plos.name
  location            = azurerm_resource_group.plos.location
  allocation_method   = "Dynamic"
  sku                 = "Basic"
}

# Key Vault
resource "azurerm_key_vault" "plos" {
  name                = "plos-kv-${var.environment}"
  location            = azurerm_resource_group.plos.location
  resource_group_name = azurerm_resource_group.plos.name
  
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  soft_delete_retention_days = 7
  purge_protection_enabled   = true
  sku_name                   = "standard"
  
  network_acls {
    default_action             = "Deny"
    bypass                     = "AzureServices"
    ip_rules                   = []
    virtual_network_subnet_ids = [azurerm_subnet.web.id]
  }
}

# Store secrets in Key Vault
resource "azurerm_key_vault_secret" "db_password" {
  name         = "db-admin-password"
  value        = var.db_admin_password
  key_vault_id = azurerm_key_vault.plos.id
}

resource "azurerm_key_vault_secret" "jwt_secret" {
  name         = "jwt-secret"
  value        = var.jwt_secret
  key_vault_id = azurerm_key_vault.plos.id
}

resource "azurerm_key_vault_secret" "jwt_refresh_secret" {
  name         = "jwt-refresh-secret"
  value        = var.jwt_refresh_secret
  key_vault_id = azurerm_key_vault.plos.id
}

resource "azurerm_key_vault_secret" "gmail_app_password" {
  name         = "gmail-app-password"
  value        = var.gmail_app_password
  key_vault_id = azurerm_key_vault.plos.id
}

# Managed Identity
resource "azurerm_user_assigned_identity" "plos" {
  name                = "plos-identity"
  resource_group_name = azurerm_resource_group.plos.name
  location            = azurerm_resource_group.plos.location
}

# Key Vault Access Policy for Managed Identity
resource "azurerm_key_vault_access_policy" "plos" {
  key_vault_id = azurerm_key_vault.plos.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = azurerm_user_assigned_identity.plos.principal_id
  
  secret_permissions = ["Get", "List"]
}

data "azurerm_client_config" "current" {}
