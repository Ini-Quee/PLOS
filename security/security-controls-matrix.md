# Security Controls Matrix

| Control | Risk | Mitigation | Status |
| --- | --- | --- | --- |
| Bcrypt password hashing | Plaintext password compromise | Store password hashes using bcrypt cost factor 12 | Implemented |
| Strong password policy | Weak user passwords | Require length, uppercase, lowercase, number, and special character | Implemented |
| Login rate limiting | Credential stuffing | Limit login attempts per IP window | Implemented |
| Account lockout | Password brute force | Temporarily lock account after repeated failures | Implemented |
| MFA with TOTP | Account takeover | Require second factor where enabled | Implemented |
| JWT validation | Forged access tokens | Verify token signatures and expiration | Implemented |
| Short-lived access tokens | Token theft | Limit access-token lifetime | Implemented |
| Refresh token hashing | Database token theft | Store only SHA-256 hash of refresh tokens | Implemented |
| Refresh token rotation | Session replay | Revoke old refresh token and issue a new one on refresh | Implemented |
| Reuse detection | Stolen refresh token reuse | Revoke all user refresh tokens if a revoked token is reused | Implemented |
| HTTP-only cookies | XSS token theft | Store refresh token in an HTTP-only cookie | Implemented |
| Secure cookie flag | Network token theft | Use secure cookies in production | Implemented |
| Helmet security headers | Browser attack surface | Set common HTTP security headers and CSP | Implemented |
| CORS allowlist | Cross-origin API abuse | Allow only configured frontend origins | Implemented |
| Disable `x-powered-by` | Reconnaissance | Hide Express framework header | Planned |
| Request ID correlation | Incident triage | Attach request IDs to responses and server errors | Planned |
| Input validation | Injection and invalid data | Validate request bodies with Zod or express-validator | Partially implemented |
| Parameterized SQL | SQL injection | Use parameter placeholders in database queries | Implemented |
| API rate limiting | DoS and abuse | Redis-backed limits with memory fallback | Partially implemented |
| File upload limits | Memory exhaustion | Limit in-memory uploads to a documented maximum size | Planned |
| Audit logging | Repudiation | Log sensitive actions and mutations | Implemented |
| Secret exclusion from Git | Secret leakage | Ignore `.env` and provide `.env.example` | Implemented |
| Environment validation | Unsafe startup | Fail fast when required env vars are missing; expand strength checks for production | Partially implemented |
| Azure Key Vault | Production secret exposure | Store secrets outside app settings and source code | Planned |
| Managed Identity | Static cloud credentials | Use identity-based access to Key Vault and Azure resources | Planned |
| Log Analytics | Weak detection | Centralize logs and write alerts | Planned |
| Defender for Cloud | Cloud misconfiguration | Review security recommendations | Planned |
| GitHub secret scanning | Leaked secrets in commits | Enable repository secret scanning | Planned |
| Dependency scanning | Vulnerable packages | Add Dependabot or dependency review | Planned |
| SAST | Code-level vulnerabilities | Add CodeQL or equivalent scanner | Planned |
