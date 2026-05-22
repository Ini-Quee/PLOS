# Incident Response Playbook

Purpose: provide simple, realistic response steps for a portfolio-stage cloud application.

## Severity Levels

| Severity | Description | Examples |
| --- | --- | --- |
| Critical | Confirmed compromise or public exposure | Database exposed, secrets leaked, active account takeover |
| High | Strong signal of attack | Refresh-token reuse, credential stuffing, suspicious OAuth activity |
| Medium | Abuse or misconfiguration | Repeated rate limits, unusual API spikes, failed deployment hardening check |
| Low | Needs review | Single suspicious login, dependency warning |

## Credential Compromise Response

1. Confirm the indicator: leaked secret, unusual login, token reuse, or user report.
2. Revoke active refresh tokens for the impacted user.
3. Force password reset and require MFA enrollment if not enabled.
4. Review audit logs for account changes, data exports, OAuth activity, and suspicious writes.
5. Rotate any exposed API keys or database credentials.
6. If cloud credentials are involved, disable the credential and review Azure sign-in and activity logs.
7. Document timeline, impact, actions taken, and follow-up controls.

## Suspicious Login Response

1. Review failed login count, IP address, user agent, and timestamp.
2. Check whether a successful login followed repeated failures.
3. Temporarily lock the account if activity appears malicious.
4. Ask the user to reset password and enable MFA.
5. Search for related attempts from the same IP or user agent.
6. Add detection logic for repeated login failures and impossible travel after Azure logging is enabled.

## Database Exposure Response

1. Remove public access immediately by closing firewall rules or private endpoint exposure.
2. Rotate `DATABASE_URL` credentials.
3. Review database logs for unknown connections, exports, or unusual queries.
4. Review application audit logs for suspicious access before and during exposure.
5. Validate whether sensitive fields were encrypted.
6. Restore from a clean backup if tampering is suspected.
7. Create a post-incident action item to enforce private networking and least-privilege database users.

## API Abuse Response

1. Identify abused endpoint, source IPs, user IDs, and request volume.
2. Confirm whether traffic hit rate limits or bypassed expected controls.
3. Temporarily lower rate limits or block abusive IPs at the platform edge if needed.
4. Review affected data writes and rollback malicious changes where possible.
5. Add route-specific validation or rate limiting if missing.
6. Create an alert for repeat abuse patterns.

## Evidence to Preserve

- Request IDs
- Audit log rows
- HTTP access logs
- Failed login records
- Token refresh failures
- Rate-limit events
- Azure resource activity logs after deployment
- Deployment history and recent commits

## Communication Template

```text
Incident:
Detected at:
Severity:
Affected users/resources:
Current status:
Immediate containment:
Evidence reviewed:
Next action:
Owner:
```
