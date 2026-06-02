# OWASP Top 10 Review

This review maps PLOS to OWASP Top 10 risks using the current codebase and realistic next steps.

| OWASP Category | PLOS Risk | Current Control | Recommendation | Status |
| --- | --- | --- | --- | --- |
| A01 Broken Access Control | A user could attempt to access another user's records by changing IDs | JWT authentication middleware; route-level user scoping exists in many routes | Complete route inventory and verify every query scopes by `req.user.id` | Partially implemented |
| A02 Cryptographic Failures | Sensitive journal or OAuth data could be exposed if stored incorrectly | Bcrypt password hashing; encryption utilities; OAuth token storage exists | Document exactly which fields are encrypted at rest; avoid logging secrets or tokens | Partially implemented |
| A03 Injection | SQL injection through request parameters | Parameterized SQL queries are used throughout reviewed backend code | Keep using parameterized queries; add validation schemas to remaining routes | Implemented / ongoing |
| A04 Insecure Design | Security controls could be added inconsistently | Threat model, controls matrix, logging plan, incident playbook | Add security acceptance criteria for new features | In progress |
| A05 Security Misconfiguration | Overly broad CORS, exposed headers, missing production env validation | Helmet and CORS allowlist are implemented | Add production env checks, disable framework fingerprinting, and add deployment checklist | Partially implemented |
| A06 Vulnerable and Outdated Components | Dependencies may develop CVEs | npm lockfiles exist | Add Dependabot or GitHub dependency review; run `npm audit` during CI | Planned |
| A07 Identification and Authentication Failures | Password attacks, token theft, session replay | Bcrypt, MFA, rate limits, account lockout, refresh token rotation | Add alerting on failed login spikes and refresh-token reuse | Implemented / planned monitoring |
| A08 Software and Data Integrity Failures | Unreviewed code or dependencies reach production | No CI security gate currently documented | Add GitHub Actions linting, tests, dependency scan, and branch protection | Planned |
| A09 Security Logging and Monitoring Failures | Suspicious activity may not be detected quickly | Audit logs and HTTP logs exist | Centralize logs in Azure Log Analytics and define alerts | Partially implemented |
| A10 Server-Side Request Forgery | Future integrations could fetch attacker-controlled URLs | Current reviewed flows do not expose general URL fetching | Validate and allowlist outbound integration targets before adding URL fetch features | Not currently applicable |

## Key Mitigation Recommendations

- Keep access tokens short-lived and never store them in localStorage unless the risk is explicitly accepted.
- Continue storing refresh tokens as hashes, not plaintext.
- Expand validation coverage route by route instead of attempting a large rewrite.
- Add SAST and dependency scanning before Azure deployment.
- Use Azure Key Vault for production secrets.
- Log security-relevant events without storing passwords, tokens, MFA secrets, or full request bodies.
- Add alerting for brute force, token reuse, high 5xx rates, and unusual AI endpoint volume.

## Recruiter-Ready Summary

PLOS demonstrates practical OWASP thinking through authentication controls, input validation, secure headers, rate limiting, audit logging, and clear cloud security recommendations. Remaining work is intentionally documented as roadmap items rather than overstated as completed.
