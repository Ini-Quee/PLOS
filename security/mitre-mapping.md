# MITRE ATT&CK Mapping

## Overview

This document maps PLOS security controls to MITRE ATT&CK techniques.

---

## Initial Access

| Technique | ID | PLOS Control | Status |
|-----------|-----|--------------|--------|
| Valid Accounts | T1078 | MFA required for sensitive accounts | ✅ |
| Valid Accounts: Cloud Accounts | T1078.004 | Row Level Security prevents cross-account access | ✅ |
| Exploit Public-Facing Application | T1190 | Input validation, parameterized queries | ✅ |
| Phishing | T1566 | MFA prevents single-factor compromise | ✅ |
| Phishing: Spearphishing Link | T1566.002 | Security awareness in onboarding | ⚠️ |

---

## Execution

| Technique | ID | PLOS Control | Status |
|-----------|-----|--------------|--------|
| Command Injection | T1059 | Input validation, parameterized queries | ✅ |
| Exploitation for Client Execution | T1203 | CSP headers prevent inline scripts | ✅ |
| User Execution: Malicious Link | T1204.001 | URL validation on links | ⚠️ |
| Inter-Process Communication | T1559 | Process isolation not applicable (web app) | N/A |

---

## Persistence

| Technique | ID | PLOS Control | Status |
|-----------|-----|--------------|--------|
| Account Manipulation | T1098 | Audit logging detects account changes | ✅ |
| Create Account | T1136 | No self-registration of admin accounts | ✅ |
| Account Access Removal | T1531 | Audit logging, MFA required for deletion | ✅ |

---

## Privilege Escalation

| Technique | ID | PLOS Control | Status |
|-----------|-----|--------------|--------|
| Abuse Elevation Control Mechanism | T1548 | No privilege escalation paths by design | ✅ |
| Access Token Manipulation | T1134 | Short-lived tokens (15 min), refresh rotation | ✅ |
| Account Manipulation | T1098 | RLS prevents horizontal escalation | ✅ |

---

## Defense Evasion

| Technique | ID | PLOS Control | Status |
|-----------|-----|--------------|--------|
| Indicator Removal | T1070 | Immutable audit logs | ✅ |
| Impair Defenses | T1562 | No admin access to disable security | ✅ |
| Obfuscated Files or Information | T1027 | Not applicable (open source) | N/A |

---

## Credential Access

| Technique | ID | PLOS Control | Status |
|-----------|-----|--------------|--------|
| Brute Force | T1110 | Rate limiting (5 attempts/15 min) | ✅ |
| Brute Force: Password Guessing | T1110.001 | MFA prevents single-factor access | ✅ |
| Brute Force: Password Cracking | T1110.002 | bcrypt with salt, high work factor | ✅ |
| Steal Application Access Token | T1528 | HTTP-only cookies, short expiry | ✅ |
| Steal Web Session Cookie | T1539 | SameSite=Strict, HTTP-only | ✅ |
| Unsecured Credentials | T1552 | No plaintext password storage | ✅ |

---

## Discovery

| Technique | ID | PLOS Control | Status |
|-----------|-----|--------------|--------|
| Account Discovery | T1087 | Rate limiting prevents enumeration | ✅ |
| File and Directory Discovery | T1083 | No directory listing enabled | ✅ |
| Network Service Scanning | T1046 | No exposed sensitive ports | ✅ |
| System Network Configuration | T1016 | Minimal information disclosure | ✅ |

---

## Collection

| Technique | ID | PLOS Control | Status |
|-----------|-----|--------------|--------|
| Data from Local System | T1005 | Encryption prevents data access | ✅ |
| Data from Information Repositories | T1213 | RLS prevents unauthorized access | ✅ |
| Email Collection | T1114 | Gmail SMTP uses user's own credentials | ✅ |
| Input Capture | T1056 | No keylogging possible (client-side) | N/A |

---

## Command and Control

| Technique | ID | PLOS Control | Status |
|-----------|-----|--------------|--------|
| Application Layer Protocol | T1071 | HTTPS only | ✅ |
| Encrypted Channel | T1573 | TLS 1.3 required | ✅ |
| Web Protocols | T1071.001 | WebSocket if used is authenticated | ✅ |

---

## Exfiltration

| Technique | ID | PLOS Control | Status |
|-----------|-----|--------------|--------|
| Exfiltration Over Web Service | T1567 | Encryption at rest prevents decryption | ✅ |
| Exfiltration Over Alternative Protocol | T1048 | No alternative protocols exposed | ✅ |

---

## Impact

| Technique | ID | PLOS Control | Status |
|-----------|-----|--------------|--------|
| Account Access Removal | T1531 | MFA required for account deletion | ✅ |
| Data Destruction | T1485 | Soft deletes only, backups exist | ✅ |
| Data Encrypted for Impact | T1486 | Not applicable (user data encrypted anyway) | N/A |
| Defacement | T1491 | No public user-generated content pages | ✅ |

---

## MITRE ATT&CK Coverage Summary

| Tactic | Techniques Covered | Coverage % |
|--------|-----------------|------------|
| Initial Access | 5/5 | 100% |
| Execution | 3/4 | 75% |
| Persistence | 3/3 | 100% |
| Privilege Escalation | 3/3 | 100% |
| Defense Evasion | 2/3 | 67% |
| Credential Access | 6/6 | 100% |
| Discovery | 4/4 | 100% |
| Collection | 3/4 | 75% |
| Command and Control | 3/3 | 100% |
| Exfiltration | 2/2 | 100% |
| Impact | 3/4 | 75% |
| **Overall** | **37/41** | **90%** |

---

## References

- MITRE ATT&CK Framework: https://attack.mitre.org/
- MITRE ATT&CK Navigator: https://mitre-attack.github.io/attack-navigator/
- ATT&CK for Cloud: https://attack.mitre.org/matrices/enterprise/cloud/
