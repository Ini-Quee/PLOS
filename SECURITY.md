# Authentication Security Architecture

## Overview

PLOS implements a custom authentication system designed with a **security-first approach**, aligning with modern enterprise standards while remaining maintainable for a single developer.

All components prioritise:

* Confidentiality of credentials
* Integrity of authentication flows
* Detection of suspicious activity
* Resistance to common attack vectors

---

## Threat Model

### Threats Addressed

| Threat                | MITRE ATT&CK ID | Mitigation                               |
| --------------------- | --------------- | ---------------------------------------- |
| Credential Stuffing   | T1110.004       | Rate limiting (5 attempts / 15 min)      |
| Brute Force Login     | T1110.001       | Account lockout after 10 failed attempts |
| Password Cracking     | T1110.002       | bcrypt hashing (cost factor 12)          |
| Stolen Access Tokens  | T1528           | 15-minute expiry                         |
| Stolen Refresh Tokens | T1550.001       | Rotation + hashing                       |
| Session Hijacking     | T1563           | HttpOnly + SameSite cookies              |
| MFA Bypass            | T1556.006       | TOTP verification                        |
| SQL Injection         | T1190           | Parameterised queries                    |
| XSS                   | T1059.007       | Helmet + CSP                             |
| CSRF                  | T1656           | SameSite cookies + CORS                  |
| User Enumeration      | T1589.002       | Constant-time responses                  |
| Account Takeover      | T1078           | MFA + audit logging                      |

---

## Security Controls

### 1. Password Hashing (bcrypt)

Passwords are hashed using bcrypt with a cost factor of 12 before storage.

```javascript
const hash = await bcrypt.hash(password, 12);
```

**Why this matters:**

* Prevents plaintext password storage
* Resistant to brute-force attacks
* Adaptive cost increases security over time

**OWASP:** A02 – Cryptographic Failures

---

### 2. Short-Lived Access Tokens

JWT access tokens expire after 15 minutes.

```javascript
jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
```

**Why this matters:**

* Limits impact of token theft
* Aligns with AWS best practices

---

### 3. Refresh Token Rotation

Refresh tokens:

* Are single-use
* Are hashed (SHA-256)
* Are rotated on every use

If reuse is detected:

* All sessions are revoked

**Why this matters:**

* Prevents replay attacks
* Detects token theft

---

### 4. Multi-Factor Authentication (TOTP)

Time-based One-Time Passwords using authenticator apps.

```javascript
const totp = new TOTP({
  secret,
  digits: 6,
  period: 30,
});
```

**Why this matters:**

* Protects against credential compromise
* Requires possession of user device

---

### 5. Rate Limiting (Redis)

* 5 attempts per 15 minutes per IP
* Enforced using Redis atomic counters

**Why this matters:**

* Blocks credential stuffing
* Slows brute-force attacks

---

### 6. Account Lockout

* 10 failed attempts → 30-minute lock

**Why this matters:**

* Prevents distributed brute-force attacks
* Works even if attacker rotates IPs

---

### 7. Audit Logging

All authentication events are logged:

* User ID
* Action (login, logout, MFA setup)
* IP address
* User agent
* Status (success/failure)

**Why this matters:**

* Enables incident investigation
* Supports compliance (SOC 2, PCI DSS)

---

### 8. Timing Attack Prevention

For invalid emails:

```javascript
await bcrypt.hash(password, 12);
```

**Why this matters:**

* Prevents attackers from discovering valid accounts
* Ensures consistent response timing

---

## Testing Checklist

* [x] Register with valid credentials
* [x] Register with weak password → rejected
* [x] Duplicate email → rejected
* [x] Login success / failure scenarios
* [x] Account lockout after repeated failures
* [x] MFA setup and verification
* [x] MFA required on login after enablement
* [x] Token refresh flow
* [x] Logout revokes refresh token
* [x] Protected routes enforce authentication

---

## Summary

This authentication system demonstrates:

* Secure credential handling (bcrypt)
* Token-based authentication (JWT)
* Defense-in-depth (MFA, rate limiting, lockout)
* Attack detection (audit logs, token replay detection)

It reflects real-world security engineering practices and aligns with OWASP Top 10 and MITRE ATT&CK mitigation strategies.
