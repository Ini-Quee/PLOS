# API Security

## What It Is

PLOS implements defense-in-depth API security through multiple layers:

1. **Rate Limiting**: Prevents brute force and DoS attacks
2. **Input Validation**: Sanitizes all user inputs to prevent injection attacks  
3. **Audit Logging**: Records every action for security monitoring
4. **CORS**: Restricts cross-origin requests
5. **Helmet**: Sets security headers (CSP, HSTS, X-Frame-Options)
6. **Parameterized Queries**: Prevents SQL injection
7. **Row Level Security**: Database-level access control

## CIA Triad Impact

- **Confidentiality**: Rate limiting prevents credential stuffing. Input validation prevents data extraction via injection.
- **Integrity**: Audit logging creates tamper-evident records. Parameterized queries prevent data modification attacks.
- **Availability**: Rate limiting ensures system remains responsive under attack. DoS protection via Redis-backed rate limiting.

## What Attack It Prevents

**Brute Force**: Rate limiting (5 attempts per 15 minutes) makes password guessing impractical.

**SQL Injection**: Parameterized queries and express-validator prevent malicious SQL in user inputs.

**XSS**: Content Security Policy headers block inline scripts. Input validation sanitizes user content.

**CSRF**: CORS configuration restricts requests to allowed origins only.

**DoS**: Rate limiting at multiple layers (IP, user, endpoint) prevents resource exhaustion.

**API Abuse**: Audit logging tracks all requests for forensic analysis.

## MITRE ATT&CK Reference

- **Technique ID**: T1190
- **Technique Name**: Exploit Public-Facing Application
- **Tactic**: Initial Access  
- **Link**: https://attack.mitre.org/techniques/T1190/

## OWASP Reference

- **Category**: A01:2021 — Broken Access Control
- **Category**: A03:2021 — Injection
- **Category**: A05:2021 — Security Misconfiguration
- **Link**: https://owasp.org/Top10/

## Implementation

### Rate Limiting (`/backend/src/middleware/rateLimiter.js`)

```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

// General API rate limit: 100 requests per 15 minutes
const generalLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:general:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth endpoints: stricter limit
const authLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:auth:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 minutes
  skipSuccessfulRequests: true, // Don't count successful logins
  message: { error: 'Too many login attempts. Please try again later.' },
});

// Sensitive endpoints: very strict
const sensitiveLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:sensitive:',
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { error: 'Rate limit exceeded for sensitive operations.' },
});

module.exports = { generalLimiter, authLimiter, sensitiveLimiter };
```

### Input Validation (`/backend/src/middleware/validateInput.js`)

```javascript
const { validationResult } = require('express-validator');

const validateInput = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map(e => ({
          field: e.param,
          message: e.msg,
        })),
      });
    }
    next();
  };
};

module.exports = validateInput;
```

### Usage with express-validator

```javascript
const { body, param } = require('express-validator');

router.post('/journal',
  validateInput([
    body('encryptedContent').isString().notEmpty(),
    body('encryptionIv').isBase64(),
    body('encryptionSalt').isBase64(),
    body('wordCount').isInt({ min: 0 }),
  ]),
  async (req, res) => {
    // All inputs validated and sanitized
    // Safe to use req.body
  }
);
```

### Audit Logging (`/backend/src/middleware/auditLog.js`)

```javascript
const auditLog = (action) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    // Capture response
    const originalSend = res.send;
    res.send = function(data) {
      const duration = Date.now() - startTime;
      
      // Log to database
      db.query(
        `INSERT INTO audit_logs 
         (user_id, action, method, path, ip_address, user_agent, 
          status_code, duration_ms, request_body, response_body)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          req.user?.id || null,
          action,
          req.method,
          req.path,
          req.ip,
          req.headers['user-agent'],
          res.statusCode,
          duration,
          JSON.stringify(sanitizeBody(req.body)),
          res.statusCode >= 400 ? JSON.stringify(data) : null,
        ]
      );
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

function sanitizeBody(body) {
  // Remove sensitive fields before logging
  const sanitized = { ...body };
  delete sanitized.password;
  delete sanitized.encryptedContent;
  delete sanitized.encryptionIv;
  delete sanitized.encryptionSalt;
  return sanitized;
}

module.exports = auditLog;
```

### Security Headers (Helmet)

```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", 'blob:'],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  crossOriginEmbedderPolicy: false, // Required for some audio features
}));
```

### Parameterized Queries (SQL Injection Prevention)

```javascript
// ✅ SAFE - Uses parameterized queries
const user = await db.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// ❌ DANGEROUS - String concatenation
const user = await db.query(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

### Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY journal_entries_user_isolation ON journal_entries
  FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

-- Set user ID before each query
SET app.current_user_id = 'user-uuid-here';
```

## How to Test It

### Test 1: Rate Limiting
```bash
# Send 6 requests in rapid succession
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrong"}' &
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrong"}' &
# ... repeat 6 times

# Expected: 429 Too Many Requests on 6th attempt
```

### Test 2: SQL Injection Prevention
```bash
# Attempt SQL injection in login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"'\'' OR 1=1--","password":"test"}'

# Expected: 400 Bad Request (invalid email format)
```

### Test 3: XSS Prevention (CSP)
```javascript
// Try to execute inline script (should be blocked by CSP)
<script>alert('xss')</script>

// Expected: Console error: "Refused to execute inline script"
```

### Test 4: RLS Enforcement
```bash
# Try to access another user's data
curl -H "Authorization: Bearer ATTACKER_TOKEN" \
  http://localhost:3001/api/journal/entries/VICTIM_ENTRY_ID

# Expected: 404 Not Found (entry invisible due to RLS)
```

### Test 5: Audit Log Verification
```sql
-- Query audit logs
SELECT * FROM audit_logs 
WHERE action = 'login_attempt' 
AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Expected: See all login attempts with IP, user agent, success/failure
```

## Evidence

### Screenshot: Rate Limit Response
```
HTTP/1.1 429 Too Many Requests
Retry-After: 900
Content-Type: application/json

{
  "error": "Too many login attempts. Please try again later.",
  "retryAfter": 900
}
```

### Screenshot: Validation Error
```
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Validation failed",
  "details": [
    { "field": "email", "message": "Invalid email format" },
    { "field": "password", "message": "Password must be at least 8 characters" }
  ]
}
```

### Screenshot: Security Headers
```
HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self'; script-src 'self'; ...
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
```

## References

- OWASP Rate Limiting Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Rate_Limiting_Cheat_Sheet.html
- OWASP Input Validation Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
- Helmet.js Security Headers: https://helmetjs.github.io/
- express-validator: https://express-validator.github.io/
