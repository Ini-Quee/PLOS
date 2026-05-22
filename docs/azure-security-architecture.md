# Azure Security Architecture

This document describes the planned secure Azure architecture for PLOS.

## Target Architecture

```text
Internet
  |
  v
Azure Front Door or Static Web Apps
  |
  v
React Frontend
  |
  | HTTPS API calls
  v
Azure App Service or Container Apps
  |
  | Managed Identity
  v
Azure Key Vault
  |
  v
Azure Database for PostgreSQL

Monitoring path:
App logs + platform logs -> Azure Monitor -> Log Analytics -> Alerts
```

## Core Azure Controls

| Control | Purpose | Recommendation |
| --- | --- | --- |
| Azure Key Vault | Protect secrets | Store database connection strings, JWT secret, AI API keys, Stripe keys, OAuth secrets |
| Managed Identity | Avoid static cloud credentials | Give backend identity read access to required Key Vault secrets only |
| Azure Monitor | Operational visibility | Capture app metrics, platform metrics, and availability data |
| Log Analytics | Security investigation | Centralize auth logs, audit logs, API errors, and rate-limit events |
| NSG rules | Network restriction | Allow only required inbound/outbound traffic where virtual networking is used |
| Defender for Cloud | Misconfiguration detection | Review recommendations for App Service, PostgreSQL, Key Vault, and storage |
| HTTPS enforcement | Transport security | Require HTTPS-only frontend and backend traffic |
| Secure storage | Prevent public exposure | Disable public blob access unless explicitly needed |

## Network Security

Recommended starter approach:

- Keep frontend public.
- Keep API public but protected by HTTPS, CORS allowlisting, authentication, rate limiting, and monitoring.
- Restrict database access to Azure services or a private network path where possible.
- Avoid exposing PostgreSQL broadly to the internet.
- Add IP restrictions only when they do not break expected application traffic.

## Identity and Secret Flow

1. Backend runs with a Managed Identity.
2. Managed Identity has read-only access to specific Key Vault secrets.
3. App loads runtime secrets from Key Vault-backed configuration.
4. Developers do not copy production secrets into local `.env` files.
5. Secret rotation is tracked in deployment notes.

## Logging and Detection

Send these logs to Log Analytics:

- Backend application logs
- HTTP access logs
- Failed login events
- Token refresh failures
- Rate-limit events
- Audit log summaries
- PostgreSQL connection errors
- App Service platform logs

Recommended alerts:

- Failed login spike
- Account lockout spike
- Refresh-token reuse
- API 5xx spike
- High request volume on Lumi endpoints
- Database connection failure
- Key Vault access denied spike

## Secure Storage

If storage is added later:

- Disable anonymous public access by default.
- Use private containers.
- Use short-lived SAS tokens only when needed.
- Log storage access.
- Do not store user secrets or tokens in static assets.

## Deployment Security Notes

- Production `FRONTEND_URL` should contain only trusted frontend origins.
- `JWT_SECRET` must be long, random, and stored in Key Vault.
- Database backups should be enabled before real user data is stored.
- Test accounts should use non-sensitive data.
- Demo mode should never share production secrets or real user data.
