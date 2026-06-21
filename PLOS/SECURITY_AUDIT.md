# PLOS Security Audit & Offline/Subscription Strategy

**Audited:** Full stack — backend (Node/Express/Postgres), web frontend (React/Vite), native app (Expo/React Native)
**Date:** June 2026

---

## PART 1 — CREDENTIAL STORAGE SEPARATION

### Where Everything Lives

| Data | Backend DB | Web Frontend | Native App |
|------|-----------|-------------|------------|
| **User account** (id, email, name, subscription_tier) | `users` table | `localStorage('user')` — plaintext JSON | `AsyncStorage('user_profile')` — plaintext JSON |
| **Password** | `users.password_hash` — bcrypt 12 rounds | `sessionStorage('plos_encryption_password')` — **PLAINTEXT RAW PASSWORD** | Never stored (good) |
| **Access token (JWT)** | Never stored (signed, stateless) | `localStorage('accessToken')` — plaintext | `SecureStore('access_token')` — Keychain/Keystore |
| **Refresh token** | `refresh_tokens.token_hash` — SHA-256 hash | `localStorage('refreshToken')` — **PLAINTEXT** | `SecureStore('refresh_token')` — Keychain/Keystore |
| **MFA TOTP secret** | `users.mfa_secret` — **PLAINTEXT** | Never exposed | Never exposed |
| **OAuth tokens (Google)** | `user_oauth_tokens` — AES-256-GCM encrypted | Never exposed | Never exposed |
| **Encryption password** (journal zero-knowledge) | Never stored (zero-knowledge) | `sessionStorage('plos_encryption_password')` — **PLAINTEXT** | Never stored (good) |

### Verdict: Accounts and Logins ARE Separated — Mostly

The `users` table holds account data (id, email, name, subscription_tier) and the password hash. Refresh tokens live in a separate `refresh_tokens` table linked by `user_id`. This is correct architecture.

**But there are serious problems with how credentials are stored on the client side.**

---

## PART 2 — SECURITY VULNERABILITIES

### CRITICAL

#### V1 — Plaintext Password in sessionStorage (Web)
**File:** `frontend/src/lib/auth.jsx:111`
```js
setEncryptionPassword(password);  // stores raw login password in sessionStorage
```
The user's actual login password is saved to sessionStorage under key `plos_encryption_password`. Any XSS on the domain exfiltrates the user's password — not just a token, the actual password.

**Fix:** Never store the raw password. Options:
- Prompt for a separate encryption passphrase (not the login password)
- Derive the encryption key client-side (PBKDF2) and store only the derived key in memory
- Use Web Crypto API to derive a non-extractable CryptoKey that never leaves the crypto boundary

#### V2 — Plaintext Refresh Token in localStorage (Web)
**File:** `frontend/src/lib/api.js:114`
```js
const refreshToken = localStorage.getItem('refreshToken');
```
The backend sets an httpOnly cookie (`auth.js:104-110`), but the frontend ignores it and reads from localStorage instead. Any XSS steals long-lived refresh tokens.

**Fix:** Remove localStorage storage. Use only the httpOnly cookie. The frontend should call `POST /api/auth/refresh` with `withCredentials: true` and no body.

#### V3 — Plaintext Access Token in localStorage (Web)
**File:** `frontend/src/lib/api.js:33`
```js
localStorage.setItem('accessToken', token);
```
Access tokens in localStorage are accessible to any XSS. Short-lived (15min default) but still a risk.

**Fix:** Store in memory only (the `let accessToken` variable is correct). Use the httpOnly cookie for refresh, derive new access tokens via refresh. If persistence across page reloads is needed, use a BFF (backend-for-frontend) pattern or accept the localStorage risk with short expiry.

### HIGH

#### V4 — MFA Secrets Stored in Plaintext in DB
**File:** `001_create_users.sql:6` — `mfa_secret VARCHAR(255)`
If an attacker gets DB read access, all TOTP seeds are exposed.

**Fix:** Encrypt `mfa_secret` with `TOKEN_ENC_KEY` before storage, same as OAuth tokens.

#### V5 — Demo Login Has No Rate Limiting
**File:** `backend/src/routes/demo.js:32`
The demo login endpoint has no rate limiter. An attacker can spam `POST /api/demo/login`.

**Fix:** Add `rateLimiter(10, 3600, 'demo_login')`.

#### V6 — Native App Uses HTTP with Hardcoded IP
**File:** `PLOS/services/api.ts:10`
```js
android: 'http://192.168.1.22:3000',
```
Tokens sent in cleartext on local network.

**Fix:** Move to `app.config.ts` + EAS env vars. Never ship HTTP.

### MEDIUM

#### V7 — Refresh Endpoint Missing Rate Limiter
**File:** `backend/src/routes/auth.js:273-276`
No `rateLimiter` on `/auth/refresh`. Brute-force possible.

#### V8 — MFA Verify Missing Rate Limiter
**File:** `backend/src/routes/auth.js:418`
No rate limit on TOTP verification. 1M possibilities, but still should be limited.

#### V9 — Journal Routes Missing Auth Middleware
**Files:** `journalPages.js:35,72,213` — `GET /`, `GET /today`, `GET /types` have no `authenticate` middleware. `req.user.id` will be undefined, causing crashes or data leaks.

#### V10 — Account Lockout Counter Never Resets
After lockout expires, `failed_login_attempts` stays high. Future lockouts trigger faster.

### LOW

#### V11 — CORS Allows null Origin
Intentional for native app but exploitable by desktop apps/extensions.

#### V12 — Account Enumeration via 409 Status
Registration returns `409` for duplicates (generic message is good, but status code reveals answer).

### POSITIVE FINDINGS

- Parameterized SQL everywhere — no SQL injection vectors
- Bcrypt with 12 rounds — strong password hashing
- OAuth tokens encrypted with AES-256-GCM at rest
- RLS enabled on sensitive tables
- Audit logging on mutations
- Zod input validation on most routes
- CSP headers via Helmet
- Account lockout after 10 failed attempts
- JWT_SECRET minimum 32-char enforcement at startup
- Fake bcrypt hash on login to prevent timing attacks
- Content filtering on Lumi (prompt injection/leakage protection)

---

## PART 3 — WHAT WORKS WITHOUT INTERNET

### Tier 1: Fully Offline (no server needed, ever)

| Feature | How | Notes |
|---------|-----|-------|
| **Voice output (TTS)** | Browser `SpeechSynthesis` API | Lumi can speak cached responses |
| **Journal encryption/decryption** | Web Crypto API / `react-native-quick-crypto` | AES-256-GCM + PBKDF2, pure client-side |
| **Alarm system** | `setTimeout` + Browser Notification API | Fires from cached schedule data |
| **Theme/appearance** | localStorage / AsyncStorage | Static config |
| **Season/atmosphere detection** | Timezone-based fallback | Works without geolocation API |
| **Password hashing** (native) | `react-native-quick-crypto` | Can verify locally if needed |
| **Offline write queue** | localStorage (web) | 6 endpoints: habit complete, journal save, budget entry, schedule complete |
| **Biometric lock** (native) | `expo-local-authentication` | Device-only, no server |

### Tier 2: Works Offline with Cached Data (read from cache, write queues)

| Feature | Read Source | Write Behavior | Cache Duration |
|---------|-----------|---------------|----------------|
| **Dashboard** | AsyncStorage/localStorage | N/A | Until next refresh |
| **Habits list** | AsyncStorage/localStorage | Complete/uncomplete queues | Until next refresh |
| **Tracker grids** | AsyncStorage/localStorage | Mark/unmark queues | Until next refresh |
| **Journal entries** (last 20) | AsyncStorage/localStorage | New entries queue | Until next refresh |
| **Budget summary** | AsyncStorage/localStorage | New entries queue | Until next refresh |
| **Schedule/today** | AsyncStorage/localStorage | Complete/uncomplete queues | Until next refresh |
| **User profile** | AsyncStorage/localStorage | Settings update queues | Until next refresh |
| **Savings goals** | AsyncStorage/localStorage | Deposits queue | Until next refresh |
| **Lumi memories** | AsyncStorage/localStorage | N/A (read-only cache) | Until next refresh |

**Current status:** The offline write queue exists for 6 endpoints. **But there is NO read cache.** If the server is down, every page shows empty/error. This is the biggest gap.

### Tier 3: Requires Internet (No Offline Fallback)

| Feature | Why | Could It Work Offline? |
|---------|-----|----------------------|
| **Lumi AI chat** | Groq API required | No — AI inference is server-side |
| **Voice transcription** | Whisper API required | No — requires server-side model |
| **Life audit** | AI-powered interview | No |
| **Monthly review** | AI-generated | No |
| **Journal AI analysis** | AI-powered | No |
| **Content import from Lumi** | AI parsing | No |
| **Gmail integration** | Google API | No |
| **OAuth flow** | Google consent | No |
| **Stripe billing** | Stripe API | No |
| **Push notifications** | Server-scheduled | Partial — local alarms work |
| **MFA setup/verify** | Server-side TOTP | No (but MFA itself is offline once set up) |
| **User registration** | Server required | No |

---

## PART 4 — WHAT WORKS WITHOUT SUBSCRIPTION

### Current Free Tier Limits (from `checkTier.js`)

```js
const FREE_LIMITS = {
  lumi_messages_per_day: 10000,     // currently relaxed for testing
  lumi_pro_messages_per_day: 10000, // currently relaxed for testing
  habits_max: 3,
  journal_types: ['personal'],       // only personal journal free
};
```

### Feature Gating Map

| Feature | Free | Pro | Gate Type |
|---------|------|-----|-----------|
| **Dashboard** | ✅ | ✅ | None |
| **Planner (schedule)** | ✅ | ✅ | None |
| **Habits** | ✅ (max 3) | ✅ (unlimited) | Soft limit — `attachTier` checks on create |
| **Trackers** | ✅ | ✅ | None |
| **Journal — personal** | ✅ | ✅ | None |
| **Journal — spiritual/goals/business/wellness/budget** | ❌ | ✅ | Soft limit — backend rejects on create |
| **Budget** | ✅ | ✅ | None |
| **Savings goals** | ✅ | ✅ | None |
| **Lumi chat** | ✅ (10k/day) | ✅ (10k/day) | Rate limit — currently same for both |
| **Lumi voice** | ✅ | ✅ | None |
| **Life audit** | ✅ | ✅ | None |
| **Content planner** | ✅ | ✅ | None |
| **Books/reading** | ✅ | ✅ | None |
| **Contacts** | ✅ | ✅ | None |
| **Projects** | ✅ | ✅ | None |
| **Jobs** | ✅ | ✅ | None |
| **Push notifications** | ✅ | ✅ | None |
| **MFA** | ✅ | ✅ | None |
| **App agent (Lumi actions)** | Feature-flagged | Feature-flagged | `LUMI_APP_AGENT_ENABLED=true` |
| **Gmail integration** ✅ | ✅ | None |

### What's Actually Gated

Only **3 things** are gated behind Pro:
1. **Unlimited habits** (free = 3 max)
2. **All journal types** (free = personal only)
3. **Lumi app agent** (feature-flagged, not subscription-gated yet)

**Everything else is free.** The billing system exists but the free tier is extremely generous. The `lumi_messages_per_day` limit is currently 10,000 for both tiers — effectively unlimited.

---

## PART 5 — RECOMMENDATIONS

### Security Fixes (Priority Order)

| # | Fix | Effort | Impact |
|---|-----|--------|--------|
| 1 | **Remove raw password from sessionStorage** — derive encryption key client-side, store only the key in memory | 2h | Eliminates #1 vulnerability |
| 2 | **Remove refresh token from localStorage** — use httpOnly cookie only | 1h | Eliminates token theft via XSS |
| 3 | **Encrypt MFA secrets in DB** — use `TOKEN_ENC_KEY` envelope encryption | 1h | Protects TOTP seeds at rest |
| 4 | **Add rate limiters** to `/auth/refresh`, `/auth/mfa/verify`, `/demo/login` | 30min | Prevents brute-force |
| 5 | **Add `authenticate` middleware** to journal routes missing it | 30min | Prevents data leaks |
| 6 | **Move native BASE_URL** to `app.config.ts` + EAS env | 30min | Eliminates hardcoded IP |
| 7 | **Reset failed_login_attempts** after lockout expires | 30min | Prevents permanent penalty |
| 8 | **Use `httpOnly` cookie for refresh on web** — remove body-based refresh | 1h | Proper CSRF protection |

### Offline Strategy (Make PLOS Useful Without Internet)

**The gap:** The app has an offline write queue but NO read cache. Without internet, every screen is empty.

**Fix — Implement a local-first data layer:**

| Layer | Implementation | What It Caches |
|-------|---------------|----------------|
| **Read cache** | AsyncStorage (native) + localStorage (web) | Last fetched data for each endpoint |
| **Write queue** | Already exists (6 endpoints) | Expand to all write endpoints |
| **Cache-first reads** | Check cache → show cached → fetch fresh → update cache | All GET endpoints |
| **Stale indicator** | Show "Last updated X ago" when using cache | User trust |
| **Background sync** | Service worker Background Sync API (web) + background fetch (native) | Queue flush on reconnect |

**What becomes fully usable offline:**

| Feature | Offline UX |
|---------|-----------|
| Dashboard | Shows cached data, stale indicator |
| Habits | View + complete (queue), streak counter works locally |
| Trackers | View + mark (queue), grid updates immediately |
| Journal | View cached entries, write new (queue), auto-save locally |
| Budget | View summary, log expense (queue) |
| Planner | View schedule, complete tasks (queue) |
| Savings | View goals, deposit (queue) |
| Settings | View + edit (queues) |

**What stays online-only:**

| Feature | Reason |
|---------|--------|
| Lumi AI chat | Requires Groq API |
| Voice transcription | Requires Whisper API |
| Life audit | AI-powered |
| Monthly review | AI-powered |
| Gmail integration | Google API |
| Billing | Stripe API |
| Registration | Server required |

### Subscription Strategy (Make PLOS Valuable Without Paying)

**Current state:** The free tier is already very generous. Only 3 habits and personal-only journal types are gated. Lumi messages are effectively unlimited.

**Recommendation: Don't gate features — gate intelligence.**

| Free Tier | Pro Tier |
|-----------|----------|
| **Unlimited habits** (remove the 3-habit limit) | Same |
| **All journal types** (remove the personal-only gate) | Same |
| **Unlimited Lumi chat** | Same |
| **Basic insights** (streak counts, simple stats) | **AI-powered insights** (monthly reviews, pattern detection, life audit) |
| **Local-only** (offline cache, no sync) | **Cloud sync** (cross-device, backup) |
| **Standard themes** | **Custom wallpapers, premium themes** |
| **Basic push notifications** | **Smart nudges** (AI-timed, personalized) |
| **Voice input/output** | **Priority Lumi response** (faster model) |

**Why:** Users shouldn't feel crippled on free. The "aha moment" is using the app daily — that's what converts. Gate the AI depth, not the basic utility.

### What Should Be Free Forever (Core Loop)

These features should NEVER be gated — they're the daily habit that makes users come back:

1. **Dashboard** — the command center
2. **Habits** (unlimited) — the streak engine
3. **Trackers** — the visual motivation
4. **Journal** (all types) — the reflection space
5. **Planner** — the daily structure
6. **Budget** — the financial awareness
7. **Basic Lumi chat** — the companion
8. **Offline access** — the reliability

### What Should Be Pro (Intelligence Layer)

1. **AI monthly reviews** — Lumi generates insights from your data
2. **Life audit** — full interview + schedule generation
3. **Pattern detection** — "You're most productive on Tuesdays"
4. **Smart nudges** — AI-timed notifications based on your patterns
5. **Cloud sync** — cross-device, backup, restore
6. **Priority AI** — faster model, longer context
7. **Custom themes** — premium wallpapers, accent customization
8. **Export** — PDF journals, financial reports

---

## PART 6 — IMPLEMENTATION CHECKLIST

### Immediate Security Fixes (do before any deploy)

- [ ] Remove `sessionStorage.setItem('plos_encryption_password', password)` from `auth.jsx`
- [ ] Implement client-side key derivation (PBKDF2) for journal encryption — store derived key in memory only
- [ ] Remove `localStorage.setItem('refreshToken')` from `api.js` — use httpOnly cookie
- [ ] Remove `localStorage.setItem('accessToken')` from `api.js` — keep in memory only
- [ ] Encrypt `mfa_secret` in `001_create_users.sql` migration (add new migration to encrypt existing)
- [ ] Add `rateLimiter(10, 900, 'refresh')` to `/auth/refresh`
- [ ] Add `rateLimiter(10, 900, 'mfa_verify')` to `/auth/mfa/verify`
- [ ] Add `rateLimiter(10, 3600, 'demo_login')` to `/demo/login`
- [ ] Add `authenticate` to `journalPages.js` routes: `GET /`, `GET /today`, `GET /types`
- [ ] Reset `failed_login_attempts` to 0 when lockout expires
- [ ] Move native `BASE_URL` to `app.config.ts`

### Offline-First (do for mobile launch)

- [ ] Implement read cache layer (AsyncStorage + localStorage)
- [ ] Cache-first read pattern for all GET endpoints
- [ ] Expand offline write queue to all write endpoints (~80 total)
- [ ] Show stale indicator ("Last updated Xh ago")
- [ ] Implement background sync (service worker + native background fetch)
- [ ] Handle offline auth (show cached user, skip token refresh)

### Subscription (do for revenue)

- [ ] Remove 3-habit limit for free tier
- [ ] Remove personal-only journal type restriction
- [ ] Gate AI features: monthly review, life audit, pattern detection
- [ ] Gate cloud sync (cross-device)
- [ ] Gate premium themes
- [ ] Implement usage tracking for AI features (daily limits)
- [ ] Build upgrade flow in native app (Stripe web view or RevenueCat)

---

## HONEST BOTTOM LINE

**Storage separation:** The backend correctly separates accounts (`users` table) from credentials (`refresh_tokens` table, bcrypt hashing). But the web frontend stores the raw login password in sessionStorage and refresh tokens in localStorage — undermining the backend's good design.

**Offline:** The app has 6 write-queued endpoints but zero read caching. Without internet, every screen is empty. The fix is straightforward: cache last-fetched data in AsyncStorage/localStorage and serve it first.

**Subscription:** The free tier is already generous enough that there's little incentive to upgrade. The recommendation is to keep the core daily loop free (habits, journal, planner, budget, basic Lumi) and gate the AI intelligence layer (reviews, audits, patterns, sync).

**The biggest risk:** The plaintext password in sessionStorage. One XSS vulnerability = every user's password exposed. Fix this before anything else.
