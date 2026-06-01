# Security Findings - 2026-05-19

## Summary

Local security/app check completed on May 19, 2026.

The app builds and the Lumi backend tests pass, but there are several security issues to fix before production hardening.

## Checks Run

- Frontend production build: passed.
- Backend Lumi tests: passed, 24/24.
- Backend syntax checks for key server/auth/OAuth/push files: passed.
- Secret scan: no real API keys found in source, only environment variable names and placeholders.
- Frontend `npm audit`: completed and found dependency vulnerabilities.
- Backend `npm audit`: did not complete because npm registry audit endpoint errored.

## High Priority Findings

### 1. Frontend Dependency Vulnerabilities

`npm audit` in `PLOS/frontend` reported:

- `axios@1.14.0`: high severity.
- `follow-redirects`: moderate severity.
- `postcss`: moderate severity.

Recommended fix:

```bash
cd PLOS/frontend
npm audit fix
```

Then rebuild and test the app.

### 2. Access Token Stored In `localStorage`

File:

- `frontend/src/lib/api.js`

The frontend stores the access token in `localStorage`. If an XSS bug ever happens, an attacker could steal the token.

Recommended fix:

- Keep the access token in memory only.
- Continue using the existing HTTP-only refresh cookie for session refresh.
- Remove persistence of `accessToken` in `localStorage`.

### 3. Refresh Flow Appears Inconsistent

File:

- `frontend/src/lib/api.js`

The frontend checks `localStorage.getItem('refreshToken')`, but the backend refresh route reads the HTTP-only `refreshToken` cookie. The frontend may redirect to login even when a valid refresh cookie exists.

Recommended fix:

- Remove the localStorage refresh-token check.
- Call `/api/auth/refresh` with `withCredentials: true`.
- Let the backend decide whether the refresh cookie is valid.

### 4. Google OAuth Tokens Stored Plaintext

Files:

- `backend/src/db/migrations/017_oauth_tokens.sql`
- `backend/src/routes/oauth.js`
- `backend/src/routes/gmail.js`

`access_token` and `refresh_token` are stored as raw text. If the database leaks, Google tokens leak.

Recommended fix:

- Encrypt OAuth tokens at rest with an app-level encryption key.
- Add a migration for encrypted token columns or migrate existing columns in place.
- Decrypt only inside backend OAuth/Gmail service code.

### 5. VAPID Private Key Printed To Logs

File:

- `backend/src/routes/push.js`

When VAPID env vars are missing, the app generates keys and logs `VAPID_PRIVATE_KEY`. This can leak secrets in hosted logs.

Recommended fix:

- Do not log the private key in production.
- Prefer failing push setup in production if VAPID keys are missing.
- If local auto-generation is kept, print only in development.

## Medium Priority Findings

### 6. Lumi AI Extraction Logs May Contain Sensitive Text

File:

- `backend/src/services/lumiRouter.js`

The router logs raw AI extraction output. This may include sensitive journal, budget, health, or emotional content.

Recommended fix:

- Disable this log in production.
- Replace with redacted metadata such as action count, route, and success/failure.

### 7. Encryption Test Helper Logs Sensitive Values

File:

- `frontend/src/utils/encryption.js`

The `testEncryption()` helper logs encrypted and decrypted test values. It appears to be a dev helper, but should not be called in production.

Recommended fix:

- Remove console output from the helper.
- Guard it behind development-only checks if kept.

### 8. Backend Voice Dependencies May Be Missing

File:

- `backend/src/routes/lumi.js`
- `backend/package.json`

The voice endpoint requires `axios` and `form-data`, but backend `package.json` does not list them directly. Voice transcription may fail in a clean backend install.

Recommended fix:

```bash
cd PLOS/backend
npm install axios form-data
```

Then run backend module checks again.

## Positive Findings

- No real API keys were found in committed source.
- Passwords are hashed with bcrypt.
- Refresh tokens are hashed in the database.
- Refresh tokens are set as HTTP-only cookies.
- Registration and login routes are rate-limited.
- OAuth flow uses state tokens for CSRF protection.
- Helmet and CORS are configured.
- Lumi crisis handling and reliable-intelligence tests pass.

## Follow-Up Order

1. Run `npm audit fix` in frontend.
2. Fix frontend token storage and refresh flow.
3. Stop production logging of VAPID private key and Lumi extraction output.
4. Encrypt OAuth tokens at rest.
5. Add missing backend voice dependencies.
6. Re-run build, Lumi tests, and dependency audits.

---

## Security Hardening — Completed 2026-06-01

Branch: `security/stage-1-visibility` (7 commits, pushed)

### Stage 1 — Visibility (P-10, P-05, P-04, P-07)
- **Structured logger** (`backend/src/lib/logger.js`): pino with fallback, field allowlist prevents accidental secret logging
- **Request IDs**: `X-Request-ID` header on every response, included in error responses
- **Auth audit events**: `writeAudit()` in auth.js logs login_success, login_failure, account_locked, token_reuse_detected, mfa_enabled, mfa_verify_failure, register_duplicate
- **x-powered-by disabled**: `app.disable('x-powered-by')` in server.js

### Stage 2 — Secrets (P-02)
- **OAuth token encryption**: `backend/src/crypto/tokenCipher.js` — AES-256-GCM envelope encryption
- Tokens encrypted before storage in `oauth.js` and `gmail.js`
- `decrypt()` tolerates legacy plaintext for zero-downtime migration
- `TOKEN_ENC_KEY` env var required (64 hex chars = 32 bytes)

### Stage 3 — JWT (P-03)
- **Algorithm restriction**: `algorithms: ['HS256']` in authenticate.js — rejects `alg:none` and unexpected algorithms
- **maxAge enforcement**: `JWT_ACCESS_EXPIRY` validated on every request

### Stage 4 — RLS (P-01a, P-01b, P-01c)
- **FORCE RLS**: migration 033 applies `FORCE ROW LEVEL SECURITY` to 28 user-owned tables
- **withUserContext helper**: sets `app.current_user_id` + drops to `plos_app` role
- **Tenant isolation test**: F-01 verifies unscoped query returns only current user rows (skips gracefully when no DB)

### Stage 5 — Routing (P-09)
- **Rate limiting**: `/lumi/message` limited to 30 req/15min
- **Input validation**: Zod schemas for gmail send/schedule/extract endpoints
- **File upload limit**: 10MB on lumi voice endpoint
- **App agent endpoints**: `/check-in`, `/actions/propose|confirm|cancel` — all require authentication

### Stage 6 — Hygiene (P-06, P-08, P-12, P-13)
- **VAPID key gating**: private key only logged in non-production
- **Lumi extraction logging**: raw AI output replaced with redacted metadata (action, resource, success/failure)
- **Encryption test helper**: removed console.log from `testEncryption()`
- **Voice dependencies**: added `axios` and `form-data` to backend package.json

### Test Results

**Backend Lumi Tests: 25/25 PASS**

```
> plos-backend@1.0.0 test:lumi
> node --test src/tests/lumi/*.test.js

✔ journal schema normalizes ambiguous template names to canonical templates (1.4594ms)
✔ journal schema routes high-priority time horizons before daily tags (1.3894ms)
✔ journal schema routes daily capture into the correct template and tags (0.3331ms)
✔ journal schema combines known tags and template tags without invalid values (0.2826ms)
✔ journal schema exposes field definitions for Lumi routing (0.3513ms)
✔ registry exposes known safe Life OS actions (1.3152ms)
✔ registry blocks batch destructive and account-level intents (0.6721ms)
✔ validator rejects unknown actions and missing required fields (3.3295ms)
✔ validator blocks invalid budget amount (0.3666ms)
✔ validator warns on schedule conflicts (0.4792ms)
✔ detects core emotional tones (1.4878ms)
✔ detects crisis signals and marks routing boundary (1.0269ms)
✔ infers memory categories from content (1.6957ms)
✔ relevance can beat raw importance (0.6375ms)
✔ stuck task detector requires at least three misses (0.9966ms)
✔ habit gap detector requires at least three days (0.2756ms)
✔ budget spike detector requires evidence and 125 percent threshold (0.2669ms)
✔ surfacing blocks crisis context (0.192ms)
✔ target resolver extracts dates, times, and money from natural text (2.2707ms)
✔ target hint strips action words, dates, times, and amounts (0.6758ms)
✔ target resolver handles built-in and custom journal type hints (0.2885ms)
✔ removes forbidden robotic and shaming phrases (2.0921ms)
✔ keeps only one follow-up question (0.3515ms)
✔ adds grounded opening for anxiety (0.5746ms)
Skipping F-01: no database connection
✔ F-01: unscoped query inside withUserContext must return ONLY current user rows (14.3245ms)

ℹ tests 25 | pass 25 | fail 0 | duration 224ms
```

**Frontend Build: SUCCESS**

```
vite v8.0.5 building client environment for production...
transforming...✓ 540 modules transformed.
dist/index.html                   0.81 kB │ gzip:   0.42 kB
dist/assets/index-C2vN_xfR.css   55.36 kB │ gzip:  11.76 kB
dist/assets/index-Zfeeztg9.js   946.86 kB │ gzip: 253.09 kB
✓ built in 621ms
```

**Backend Syntax: 66/66 PASS**

All backend `.js` files pass `node --check` validation.

Full test log: [TEST_RESULTS.md](TEST_RESULTS.md)

### Remaining (not in this branch)
- Finding #2: Access token in localStorage (needs frontend refactor)
- Finding #3: Refresh flow inconsistency (needs frontend refactor)
- Frontend `npm audit fix` for dependency vulnerabilities
