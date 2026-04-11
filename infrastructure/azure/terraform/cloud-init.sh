#!/bin/bash
# Cloud-init script for PLOS VM
# Sets up Node.js, PM2, and configures environment

set -e

# Update system
apt-get update
apt-get upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install PM2 globally
npm install -g pm2

# Install PostgreSQL client (for migrations)
apt-get install -y postgresql-client

# Create app directory
mkdir -p /opt/plos

# Create environment file
cat > /opt/plos/.env <<EOF
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://${db_user}:${db_password}@${db_host}:5432/${db_name}?sslmode=require
REDIS_URL=redis://:${redis_key}@${redis_host}:6380
JWT_SECRET=CHANGE_ME_VIA_KEY_VAULT
JWT_REFRESH_SECRET=CHANGE_ME_VIA_KEY_VAULT
FRONTEND_URL=https://plos.example.com
GMAIL_USER=CHANGE_ME
GMAIL_APP_PASSWORD=CHANGE_ME_VIA_KEY_VAULT
EOF

# Set proper permissions
chown -R plosadmin:plosadmin /opt/plos
chmod 600 /opt/plos/.env

echo "Cloud-init complete. Ready for deployment."
