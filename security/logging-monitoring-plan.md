# Logging and Monitoring Plan

Goal: capture enough security telemetry to investigate account takeover, API abuse, suspicious integrations, and production failures without logging sensitive user content or secrets.

## Current Logging

- Morgan HTTP request logging
- Database-backed audit logging for authentication events
- Global audit logging for API mutation requests
- Failed login tracking on the `users` table
- Request IDs returned with unhandled server errors

## Log Categories

| Category | Events to Capture | Required Fields | Status |
| --- | --- | --- | --- |
| Authentication logs | Register, login, logout, token refresh, MFA setup, MFA verify | user ID when available, email hash or normalized email where safe, IP, user agent, status, timestamp | Partially implemented |
| Failed login logs | Invalid password, locked account, invalid MFA | user/email reference, IP, user agent, failure reason category, timestamp | Partially implemented |
| API request logs | Request method, path, status, response time | request ID, IP, user agent, route, status code | Partially implemented |
| Audit logs | Create, update, delete, sensitive workflow actions | user ID, action, resource, status, body keys, timestamp | Implemented |
| Admin action logs | User disable, role change, data export, billing adjustment | admin user ID, target user ID, action, reason, timestamp | Planned |
| Suspicious activity logs | Rate-limit hits, token reuse, impossible travel, repeated MFA failure | user ID if known, IP, event type, severity, timestamp | Planned |

## Events That Should Trigger Alerts

| Alert | Signal | Severity |
| --- | --- | --- |
| Credential stuffing | Many failed logins from one IP or across many accounts | High |
| Account takeover attempt | Successful login after many failures | High |
| Refresh token reuse | Revoked refresh token used again | High |
| API abuse | Repeated 429 responses or unusual volume | Medium |
| AI endpoint abuse | Sudden increase in Lumi requests | Medium |
| Database availability issue | Health check reports degraded database | High |
| Server error spike | Elevated 5xx rate | Medium |
| Suspicious admin action | Any future admin action outside expected workflow | High |

## Azure Monitoring Plan

- Send application logs to Azure Log Analytics.
- Enable Azure Monitor alerts for HTTP 5xx, latency, CPU, memory, and restart count.
- Enable diagnostic logs for App Service or Container Apps.
- Enable PostgreSQL logs for connection failures and slow queries.
- Use Defender for Cloud recommendations to identify exposed resources.
- Build a small SOC-style workbook for failed logins, lockouts, token refresh failures, and rate-limit hits.

## Sensitive Data Logging Rules

Never log:

- Passwords
- Refresh tokens
- JWTs
- MFA secrets
- OAuth access or refresh tokens
- Full journal content
- API keys
- Raw Authorization headers

Safe to log:

- Request ID
- User ID
- Route name
- Status code
- Body key names
- Event type
- Timestamp
- IP address and user agent when needed for security investigation

## Week 2 Implementation Ideas

- Add a structured logger such as Pino.
- Add explicit logs for rate-limit hits.
- Add explicit logs for refresh-token reuse.
- Add alert query examples for Log Analytics.
- Add a security dashboard screenshot after deployment.
