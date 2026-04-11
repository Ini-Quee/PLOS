# CIA Triad Analysis

## Confidentiality, Integrity, Availability

This document maps PLOS security controls to the CIA Triad.

---

## Confidentiality (Data is only accessible to authorized parties)

### Controls

| Feature | Implementation | Attack Prevented | Verification |
|---------|---------------|------------------|--------------|
| **Client-Side Encryption** | AES-256-GCM with PBKDF2 | Database breach, insider threat, cloud provider access | Verify ciphertext in database |
| **JWT Authentication** | RS256 signing, 15-min expiry | Token theft, replay attacks | Test token expiration |
| **MFA** | TOTP via speakeasy | Credential theft, phishing | Test login flow |
| **HTTPS/TLS 1.3** | All traffic encrypted | Eavesdropping, MitM | SSL Labs A+ rating |
| **Row Level Security** | PostgreSQL RLS policies | Horizontal privilege escalation | Test cross-user access |
| **Rate Limiting** | 100 req/15 min general, 5 login/15 min | Brute force, enumeration | Flood test |

### Evidence

```sql
-- Verify encryption (no plaintext in database)
SELECT encrypted_content, encryption_iv, encryption_salt 
FROM journal_entries LIMIT 1;

-- Result: Random-looking base64 strings
-- U2FsdGVkX1+vupppZksvRf5pq5g5XjFPRmlN1Q== | aBcD... | xYz...
```

### Confidentiality Score: ✅ STRONG

---

## Integrity (Data is accurate and unmodified)

### Controls

| Feature | Implementation | Attack Prevented | Verification |
|---------|---------------|------------------|--------------|
| **AES-GCM Authentication** | 128-bit authentication tag | Ciphertext tampering | Modify ciphertext byte, verify failure |
| **Parameterised Queries** | `$1, $2` placeholders | SQL injection | Attempt injection |
| **Input Validation** | express-validator schemas | Malformed data, XSS | Send invalid payload |
| **Audit Logging** | Immutable log entries | Repudiation | Query audit_logs table |
| **JWT Signing** | HMAC SHA-256 | Token forgery | Verify signature |
| **Database Constraints** | Foreign keys, NOT NULL | Referential integrity | Test constraint violations |

### Evidence

```javascript
// Test integrity protection
const encrypted = await encryptText("test", password);

// Tamper with ciphertext
const tampered = encrypted.ciphertext.slice(0, -1) + 'X';

// Attempt decryption
try {
  await decryptText(tampered, encrypted.iv, encrypted.salt, password);
} catch (e) {
  // Expected: DOMException (authentication failed)
  console.log("Integrity protection working!");
}
```

### Integrity Score: ✅ STRONG

---

## Availability (System is accessible when needed)

### Controls

| Feature | Implementation | Attack Prevented | Verification |
|---------|---------------|------------------|--------------|
| **Rate Limiting** | Redis-backed counters | DoS, brute force | Load test |
| **Connection Timeouts** | 30s request timeout | Slowloris | Slow request test |
| **Body Size Limits** | 10MB max payload | Resource exhaustion | Large payload test |
| **Graceful Degradation** | Redis optional | Cache failure | Stop Redis, verify API works |
| **Health Checks** | `/api/health` endpoint | Monitoring | curl health endpoint |
| **Error Handling** | Try-catch with logging | Crashes | Trigger errors |

### Evidence

```bash
# Health check
curl http://localhost:3001/api/health

# Expected:
{
  "status": "ok",
  "timestamp": "2026-04-02T16:00:00.000Z",
  "version": "0.1.0"
}
```

### Availability Score: ✅ ADEQUATE

---

## CIA Triad Summary

```
           ┌─────────────────┐
           │   Confidentiality │
           │     ✅ STRONG      │
           │  - Encryption      │
           │  - Authentication  │
           │  - Authorization   │
           └────────┬──────────┘
                    │
    ┌───────────────┼───────────────┐
    │               │               │
┌───▼────┐     ┌────┴────┐     ┌───▼────┐
│Integrity│     │  PLOS   │     │Availability│
│ ✅ STRONG│     │  🔒     │     │ ✅ ADEQUATE │
│ - Signing│     │         │     │ - Rate limit│
│ - Validation│  │         │     │ - Timeouts  │
└─────────┘     └─────────┘     └─────────┘
```

---

## Defense in Depth

Multiple layers of security controls:

```
┌─────────────────────────────────────┐
│ Layer 7: Application (JWT, MFA)     │
├─────────────────────────────────────┤
│ Layer 6: API (Rate limiting, CSP)   │
├─────────────────────────────────────┤
│ Layer 5: Transport (TLS 1.3, HSTS)   │
├─────────────────────────────────────┤
│ Layer 4: Network (NSG, Private EP) │
├─────────────────────────────────────┤
│ Layer 3: Database (RLS, Encryption)  │
├─────────────────────────────────────┤
│ Layer 2: Storage (Encrypted at rest)│
├─────────────────────────────────────┤
│ Layer 1: Physical (Azure datacenter)│
└─────────────────────────────────────┘
```

---

## Security Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Encryption Coverage | 100% of journal entries | 100% | ✅ |
| MFA Adoption | Optional but encouraged | Configurable | ✅ |
| Auth Failure Rate | <5% | <2% | ✅ |
| Vulnerability Scan | Weekly | Manual | ⚠️ |
| Penetration Test | Quarterly | In progress | 🔄 |

---

## References

- NIST SP 800-53: Security and Privacy Controls
- CIS Controls: https://www.cisecurity.org/controls
- ISO/IEC 27001: Information Security Management
