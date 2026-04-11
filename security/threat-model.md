# Threat Model

## STRIDE Analysis for PLOS

STRIDE is a threat modeling methodology that identifies six categories of security threats:
- **S**poofing
- **T**ampering
- **R**epudiation
- **I**nformation Disclosure
- **D**enial of Service
- **E**levation of Privilege

---

## 1. Spoofing (Authentication Threats)

### Threats
- **Credential Stuffing**: Attacker uses leaked credentials from other breaches
- **Session Hijacking**: Attacker steals session token/cookie
- **Phishing**: User tricked into entering credentials on fake site

### Mitigations
| Threat | Mitigation | Status |
|--------|-----------|--------|
| Credential Stuffing | Rate limiting (5 attempts/15 min) | ✅ |
| Credential Stuffing | MFA (TOTP) | ✅ |
| Session Hijacking | HTTP-only cookies for refresh tokens | ✅ |
| Session Hijacking | Short-lived access tokens (15 min) | ✅ |
| Phishing | MFA prevents single-factor compromise | ✅ |

---

## 2. Tampering (Integrity Threats)

### Threats
- **Data Modification**: Attacker modifies journal entries
- **SQL Injection**: Malicious SQL in user input
- **Man-in-the-Middle**: Intercepts and modifies traffic

### Mitigations
| Threat | Mitigation | Status |
|--------|-----------|--------|
| Data Modification | Row Level Security (RLS) | ✅ |
| Data Modification | Ownership validation on updates | ✅ |
| SQL Injection | Parameterized queries | ✅ |
| SQL Injection | express-validator input sanitization | ✅ |
| MitM | TLS 1.3 for all connections | ✅ |
| MitM | HSTS headers | ✅ |

---

## 3. Repudiation (Non-repudiation Threats)

### Threats
- **Denial of Actions**: User denies performing action
- **Audit Log Tampering**: Attacker modifies audit logs

### Mitigations
| Threat | Mitigation | Status |
|--------|-----------|--------|
| Denial of Actions | Comprehensive audit logging | ✅ |
| Denial of Actions | Immutable log entries | ✅ |
| Audit Tampering | Database-level append-only logs | ✅ |
| Audit Tampering | Include IP, user agent, timestamp | ✅ |

**Audit Log Schema**:
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID,
  action VARCHAR(100),      -- e.g., 'login', 'journal_create'
  method VARCHAR(10),       -- HTTP method
  path TEXT,                -- API endpoint
  ip_address INET,          -- Source IP
  user_agent TEXT,          -- Browser info
  status_code INTEGER,      -- HTTP response
  duration_ms INTEGER,      -- Request duration
  request_body JSONB,       -- Sanitized request
  created_at TIMESTAMP      -- Immutable timestamp
);
```

---

## 4. Information Disclosure (Confidentiality Threats)

### Threats
- **Data Breach**: Database compromised, entries exposed
- **Insider Threat**: Developer/admin reads user data
- **Cloud Provider Access**: Hosting provider sees data
- **Network Eavesdropping**: Unencrypted traffic intercepted

### Mitigations
| Threat | Mitigation | Status |
|--------|-----------|--------|
| Data Breach | Client-side encryption (AES-256-GCM) | ✅ |
| Data Breach | Zero-knowledge architecture | ✅ |
| Insider Threat | Encryption keys never on server | ✅ |
| Cloud Provider | Same as insider threat | ✅ |
| Eavesdropping | TLS 1.3 for all traffic | ✅ |
| Eavesdropping | HSTS with preload | ✅ |

**Encryption Flow**:
```
User Password → PBKDF2 → Encryption Key
Plaintext Journal → AES-256-GCM → Ciphertext
Ciphertext → Server Storage (no plaintext!)
```

---

## 5. Denial of Service (Availability Threats)

### Threats
- **Resource Exhaustion**: Too many requests crash server
- **Slowloris**: Slow connections consume resources
- **Large Payload**: Oversized requests cause OOM

### Mitigations
| Threat | Mitigation | Status |
|--------|-----------|--------|
| Resource Exhaustion | Rate limiting (100 req/15 min) | ✅ |
| Resource Exhaustion | Redis-backed rate limiting | ✅ |
| Slowloris | Connection timeouts | ✅ |
| Slowloris | Request timeouts | ✅ |
| Large Payload | Body size limit (10MB) | ✅ |
| Large Payload | Request validation | ✅ |

---

## 6. Elevation of Privilege (Authorization Threats)

### Threats
- **Broken Access Control**: User accesses another's data
- **Privilege Escalation**: User gains admin access
- **IDOR**: Insecure Direct Object Reference

### Mitigations
| Threat | Mitigation | Status |
|--------|-----------|--------|
| Broken Access Control | JWT authentication required | ✅ |
| Broken Access Control | Row Level Security (RLS) | ✅ |
| Broken Access Control | Ownership validation | ✅ |
| Privilege Escalation | No admin roles in current design | ✅ |
| IDOR | UUIDs for all resources (not sequential IDs) | ✅ |
| IDOR | Authorization checks on every request | ✅ |

---

## Data Flow Diagram

```
┌─────────────┐     HTTPS      ┌─────────────┐
│   Browser   │ ◄────────────► │   Nginx     │
│ (Encryption)│                │   (Reverse   │
│             │                │    Proxy)   │
└─────────────┘                └──────┬──────┘
                                        │
                                        │ HTTPS
                                        ▼
                               ┌─────────────────┐
                               │  Express API     │
                               │  - Rate Limit    │
                               │  - Validation    │
                               │  - Auth          │
                               └────────┬────────┘
                                        │
                                        │ SQL
                                        ▼
                               ┌─────────────────┐
                               │  PostgreSQL      │
                               │  - RLS Enabled   │
                               │  - Encrypted     │
                               └─────────────────┘
```

---

## Attack Scenarios

### Scenario 1: Database Breach
**Attack**: Attacker gains full database access
**Impact**: Journal entries encrypted, unrecoverable without passwords
**Evidence**: Only ciphertext in database

### Scenario 2: Stolen Refresh Token
**Attack**: XSS steals HTTP-only cookie (theoretically impossible)
**Impact**: Attacker gets 7-day session
**Mitigation**: Short-lived access tokens limit damage window

### Scenario 3: SQL Injection
**Attack**: Malicious input in journal entry
**Mitigation**: Parameterized queries + validation
**Test**: Attempt `'; DROP TABLE users; --`
**Result**: 400 Bad Request

### Scenario 4: Privilege Escalation
**Attack**: User modifies JWT to change user_id
**Impact**: None - RLS enforces database-level access
**Test**: Modify token payload
**Result**: Database blocks unauthorized queries

---

## Risk Assessment Matrix

| Threat | Likelihood | Impact | Risk | Status |
|--------|-----------|--------|------|--------|
| Data Breach | Low | High | Medium | ✅ Mitigated (encryption) |
| Credential Stuffing | High | Medium | High | ✅ Mitigated (rate limit + MFA) |
| SQL Injection | Low | Critical | Medium | ✅ Mitigated (parameterized) |
| XSS | Medium | Medium | Medium | ✅ Mitigated (CSP + validation) |
| Privilege Escalation | Low | High | Medium | ✅ Mitigated (RLS) |
| DoS | Medium | Low | Low | ✅ Mitigated (rate limiting) |

---

## References

- OWASP Threat Modeling: https://owasp.org/www-community/Application_Threat_Modeling
- STRIDE: https://docs.microsoft.com/en-us/previous-versions/commerce-server/ee823878(v=cs.20)
- PASTA Threat Modeling: https://versprite.com/blog/pasta-threat-modeling/
