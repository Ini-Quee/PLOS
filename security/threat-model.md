# PLOS Threat Model

Methodology: STRIDE

Scope: React frontend, Express API, PostgreSQL database, authentication flows, AI API usage, planned Azure deployment.

## Assets

- User accounts and profile data
- Password hashes
- JWT access tokens
- Refresh tokens
- Journal, habit, budget, schedule, and goal data
- OAuth tokens for third-party integrations
- AI provider API keys
- PostgreSQL connection string
- Audit logs

## Trust Boundaries

- Browser to backend API
- Backend API to PostgreSQL
- Backend API to Redis
- Backend API to external AI providers
- Backend API to Google and Stripe integrations
- Future Azure runtime to Key Vault, Monitor, and managed database services

## STRIDE Review

| STRIDE Category | Threat | Risk | Current or Recommended Mitigation | Status |
| --- | --- | --- | --- | --- |
| Spoofing | Credential stuffing against login | Account takeover | Login rate limiting, MFA support, account lockout after repeated failures | Implemented |
| Spoofing | Fake or replayed JWT | Unauthorized API access | JWT signature validation, short access-token expiry, server-side refresh-token storage | Implemented |
| Spoofing | Session hijacking through stolen refresh token | Persistent account access | HTTP-only cookie, secure cookie in production, refresh-token hashing, rotation, reuse revocation | Implemented |
| Tampering | User modifies another user's records | Data integrity loss | Authenticated routes, parameterized SQL, ownership checks in route queries, PostgreSQL RLS review recommended | Partially implemented |
| Tampering | Request body manipulation | Invalid or malicious data writes | Zod and express-validator middleware patterns; expand validation across all routes | Partially implemented |
| Repudiation | User denies sensitive action | Weak investigation trail | Authentication and mutation audit logging with user, IP, user agent, status, and details | Implemented |
| Repudiation | Missing admin action history | Investigation gaps | Define admin-only actions before adding admin features; log all admin changes | Planned |
| Information Disclosure | Secrets committed to Git | API key or database compromise | `.env` ignored, `.env.example` provided, Key Vault planned | Partially implemented |
| Information Disclosure | Verbose errors expose internals | Reconnaissance aid | Generic client errors and server-side error logging with request ID | Implemented |
| Information Disclosure | Cloud database exposed publicly | Data breach | Private networking, firewall rules, least-privilege DB access, Defender for Cloud | Planned |
| Denial of Service | API abuse or AI endpoint abuse | Cost increase and availability loss | Route rate limits, subscription/tier limits for Lumi messages, Redis rate-limit backend | Partially implemented |
| Denial of Service | Large uploads exhaust memory | API instability | Multer file-size limits for memory uploads | Implemented |
| Elevation of Privilege | User changes JWT claims | Privilege escalation | JWT server-side verification; no trusted client-side role claims | Implemented |
| Elevation of Privilege | Over-permissive cloud identity | Cloud resource compromise | Managed Identity with least privilege and Key Vault access policies | Planned |

## Focused Threats

### Authentication Threats

Primary risks include password guessing, credential stuffing, MFA bypass attempts, stolen tokens, and user enumeration. PLOS currently uses bcrypt password hashing, generic login errors, rate limiting, account lockout, short-lived JWTs, refresh-token rotation, and MFA support.

### API Abuse

Sensitive routes can be abused for brute force, data scraping, or AI cost exhaustion. Authentication routes and selected write-heavy routes are rate limited. Lumi messages now have an IP-based limiter in addition to product-tier message limits. Week 2 should add consistent rate limits to all expensive or write-heavy routes.

### Session Hijacking

Refresh tokens are delivered through an HTTP-only cookie and stored server-side only as hashes. Refreshing rotates the token and revokes the previous token. Reuse of a revoked token revokes all refresh tokens for the user.

### Credential Stuffing

Login and registration endpoints are rate limited. Accounts lock temporarily after repeated failed login attempts. MFA helps reduce the impact of password reuse.

### Cloud Exposure Risks

Future Azure deployment must avoid public database exposure, unrestricted inbound API access, public storage containers, overly broad managed identities, and logging of sensitive data.

### Insecure Secrets Management

Current local development uses `.env` files excluded from Git. Production should move secrets to Azure Key Vault, access them through Managed Identity, and rotate database/API credentials on a documented schedule.

## Highest Priority Risks

| Priority | Risk | Reason |
| --- | --- | --- |
| High | Secret exposure | Cloud and API credentials would allow direct compromise |
| High | Account takeover | Personal data and integrations make authentication critical |
| Medium | API abuse | AI and write endpoints can create cost and availability impact |
| Medium | Cloud misconfiguration | A public database or permissive identity can bypass app controls |
| Medium | Incomplete validation coverage | Some routes still need stronger schema validation |

## Week 2 Recommendations

- Add route inventory with authentication, validation, and rate-limit status
- Add GitHub Actions for secret scanning and dependency scanning
- Add PostgreSQL least-privilege user documentation
- Add Azure network diagram
- Add alert rules for failed login spikes and token reuse
