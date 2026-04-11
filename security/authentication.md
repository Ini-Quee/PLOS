# JWT Authentication

## What It Is

PLOS uses JSON Web Token (JWT) authentication to verify user identity for every API request. When a user logs in with their email and password, the backend generates two tokens:

- **Access Token**: Short-lived (15 minutes), included in every API request header
- **Refresh Token**: Long-lived (7 days), stored in HTTP-only cookie, used to get new access tokens

The tokens contain the user's ID and are cryptographically signed with a secret key stored only on the server. This eliminates the need for server-side session storage and enables stateless authentication.

## CIA Triad Impact

- **Confidentiality**: Tokens are signed and can be verified without exposing user credentials. Stolen tokens expire quickly (15 minutes), limiting exposure window.
- **Integrity**: Tokens are cryptographically signed (HMAC SHA-256). Any tampering invalidates the signature.
- **Availability**: Stateless authentication means no session database required. Users can authenticate even if Redis is temporarily unavailable.

## What Attack It Prevents

**Token Replay Attacks**: Without short expiration times, stolen tokens could be reused indefinitely. The 15-minute access token window limits damage from token theft.

**Session Hijacking**: HTTP-only cookies prevent JavaScript access to refresh tokens, protecting against XSS-based token theft.

**Credential Stuffing**: Failed login attempts are rate-limited (5 attempts per 15 minutes), making brute-force attacks impractical.

## MITRE ATT&CK Reference

- **Technique ID**: T1528
- **Technique Name**: Steal Application Access Token
- **Tactic**: Credential Access
- **Link**: https://attack.mitre.org/techniques/T1528/

## OWASP Reference

- **Category**: A07:2021 — Identification and Authentication Failures
- **Link**: https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/

## Implementation

**Backend: Token Generation (`/backend/src/routes/auth.js`)**

```javascript
const jwt = require('jsonwebtoken');

// Generate access token (15 minutes)
const accessToken = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '15m', algorithm: 'HS256' }
);

// Generate refresh token (7 days)
const refreshToken = jwt.sign(
  { userId: user.id, tokenId: crypto.randomUUID() },
  process.env.JWT_REFRESH_SECRET,
  { expiresIn: '7d', algorithm: 'HS256' }
);
```

**Backend: Token Verification (`/backend/src/middleware/authenticate.js`)**

```javascript
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.userId, email: decoded.email };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

**Frontend: Token Storage (`/frontend/src/lib/auth.jsx`)**

```javascript
// Access token in memory only (not localStorage)
let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

// Refresh token in HTTP-only cookie (handled by browser)
```

## How to Test It

### Test 1: Valid Token
```bash
curl -H "Authorization: Bearer VALID_TOKEN" \
  http://localhost:3001/api/journal/entries

# Expected: 200 OK with data
```

### Test 2: Expired Token
```bash
# Wait 15 minutes or use an old token
curl -H "Authorization: Bearer EXPIRED_TOKEN" \
  http://localhost:3001/api/journal/entries

# Expected: 401 Unauthorized with "Token expired"
```

### Test 3: Invalid Token
```bash
curl -H "Authorization: Bearer invalid.token.here" \
  http://localhost:3001/api/journal/entries

# Expected: 401 Unauthorized with "Invalid token"
```

### Test 4: Missing Token
```bash
curl http://localhost:3001/api/journal/entries

# Expected: 401 Unauthorized with "Unauthorized"
```

### Test 5: Refresh Token Rotation
```bash
# 1. Login to get refresh token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}' \
  -c cookies.txt

# 2. Use refresh token to get new access token
curl -X POST http://localhost:3001/api/auth/refresh \
  -b cookies.txt

# Expected: New access token, old refresh token invalidated
```

## Evidence

### Screenshot: Token Expiration Response
```
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "Token expired"
}
```

### Screenshot: Rate Limit Response
```
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "error": "Too many login attempts. Please try again later."
}
```

### Log Entry: Failed Authentication
```
[2026-04-02T14:30:00Z] ERROR: Authentication failed
  - IP: 192.168.1.100
  - Endpoint: /api/auth/login
  - Reason: Invalid credentials
  - Attempt: 3/5 (rate limited after 5)
```

## References

- OWASP JWT Security Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html
- NIST SP 800-63: Digital Identity Guidelines: https://pages.nist.gov/800-63-3/
- IETF RFC 7519: JSON Web Token (JWT): https://tools.ietf.org/html/rfc7519
