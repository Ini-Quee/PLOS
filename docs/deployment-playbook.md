# PLOS Deployment & Troubleshooting Playbook
**Version 2 - Azure App Service / GitHub Actions / OIDC**
Author: Erica Innocent Effiong

---

## Executive Summary

This document records the deployment, failure, and investigation history for
PLOS's Microsoft Azure deployment. It is written so that someone with no
prior context - a future teammate, a hiring manager, or future-me - can
understand what was attempted, what was confirmed, what is still an open
hypothesis, and how to reuse the same diagnostic method on a future
deployment or platform.

This is a working engineering record, not a success story. Where a root
cause is confirmed, it says so. Where it is not, it says that too.

**Current status:** GitHub Actions OIDC authentication was successfully
diagnosed, and the pipeline later reached Azure's deployment service. Azure
App Service was reachable, Oryx completed with 0 errors and 0 warnings, and
the deployment still failed at the Kudu/OneDeploy stage with HTTP 400. The
root cause remains inconclusive. Azure RBAC is an unconfirmed hypothesis,
not a finding, and the application was not successfully proven deployed
through Azure. See Section 9, Open Items.

---

## Evidence Classification

Use these labels throughout the investigation:

- **CONFIRMED:** A conclusion directly supported by observed command output,
  logs, or successful reproduction.
- **RULED OUT:** A hypothesis for which the investigation produced
  sufficient evidence against it.
- **HYPOTHESIS:** A plausible explanation that has not yet been
  experimentally confirmed.
- **INCONCLUSIVE:** The available evidence is insufficient to determine the
  cause.

Do not promote a hypothesis to root cause unless the evidence includes a
controlled change followed by a successful reproduction or recovery that
establishes causality.

---

## 1. Application Overview

PLOS (Personal Life Operating System) is an AI-powered application with a
Node.js/Express backend and a web frontend.

**Backend stack:** Node.js 22, Express, PostgreSQL via Supabase, JWT
authentication, an AI provider integration, deployed via GitHub Actions to
Microsoft Azure App Service.

**Target environment:**
```text
App Service:     iniq
Resource Group:  plos-rg
Region:          South Africa North
Runtime:         Node 22 (Linux)
Plan:            Basic (B1)
```

---

## 2. Intended Deployment Architecture

```text
Developer
   |
   v
GitHub Repository
   |
   v
GitHub Actions -- OIDC authentication --> Microsoft Entra ID
   |                                            |
   |<---------- Azure authorization ------------|
   v
Azure App Service
   |
   v
Node.js / Express Backend
   |
   +--> Supabase / PostgreSQL
   +--> AI Provider
```

**Required environment variables:**
`DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRY`,
`JWT_REFRESH_EXPIRY`, `TOKEN_ENC_KEY`, `FRONTEND_URL`, `AI_PROVIDER`,
`GEMINI_API_KEY`, `NODE_ENV`

**Security rule:** none of the above are ever committed, screenshotted, or
pasted into logs/documentation in plaintext. Diagnostic commands redact
values by convention:
```bash
az webapp config appsettings list --resource-group plos-rg --name iniq \
  --query "[].{Name:name,Value:'<REDACTED>'}" --output table
```

---

## 3. Incident Log

### Incident 1 - GitHub Actions could not authenticate to Azure
**Symptom:** `AADSTS700213: No matching federated identity record found
for presented assertion subject`

**Investigation:** Compared the GitHub OIDC subject claim against the
federated credential registered in Microsoft Entra ID.

**Root cause - confirmed:** The federated credential trusted
`ref:refs/heads/feature/lumi-local-router`; the workflow run presented
`ref:refs/heads/main`. Branch is part of the OIDC subject claim, and a
credential scoped to one branch does not trust another.

**Fix:** Aligned the federated credential's branch scope with the branch
actually triggering the workflow.

**Evidence classification:** CONFIRMED for the original OIDC authentication
failure and its resolution. RULED OUT only as the cause of the later
Kudu/OneDeploy HTTP 400, because the later deployment authenticated and
reached Kudu.

**Screenshot placement:** OIDC subject-mismatch error - this is the
single most useful screenshot in the whole record; it makes an
identity-federation failure visible rather than asserted.

### Incident 2 - Deployment reached Azure, then failed
**Symptom:**
```text
Deployment Failed. deployer = OneDeploy
Error: Deployment Failed, Package deployment using ZIP Deploy failed.
```

**Investigation:** Confirmed via `az webapp config show` that the App
Service existed, was running, on Linux, Node 22. This supported Azure App
Service reachability and ruled out a simple infrastructure-down
explanation. Checked `SCM_DO_BUILD_DURING_DEPLOYMENT` (true) and
`WEBSITE_RUN_FROM_PACKAGE` (not set); neither was anomalous based on the
observed configuration. Deployment logs confirmed Oryx completed the build
with 0 errors and 0 warnings, so the observed failure was after the build
stage, not during it.

**Status:** Narrowed to the deployment/finalization stage. The Kudu/
OneDeploy 400 was confirmed, but the root cause was not isolated at this
point in the investigation. Reaching Kudu and seeing Oryx complete does not
prove deployment finalization, application startup, or application health.
See Incident 4 and Incident 5.

**Screenshot placement:** App Service config output; Oryx "0 errors / 0
warnings" log line.

### Incident 3 - Isolating the failure with a minimal reproduction
**Method:** Built a bare-minimum Node.js smoke-test app (`package.json` +
`server.js` returning `{"status": "ok"}`), deployed to a separate App
Service (`iniq-test`), to answer one question: *can this Azure environment
deploy anything at all, independent of PLOS's own code?*

**Result:** The smoke test initially encountered the same GitHub OIDC
branch-scoping issue as Incident 1. After moving the workflow to the trusted
branch, investigation continued, but a successful smoke-test deployment was
not established in the repository evidence available here. Therefore the
smoke test did not conclusively isolate the PLOS application as the cause of
the remaining deployment failure.

**Evidence classification:** CONFIRMED for the existence of the minimal
smoke-test app and workflow. INCONCLUSIVE for whether the smoke test
authenticated successfully, deployed successfully, started successfully, and
returned the expected response. Do not claim "platform viable" unless all
four of those stages are proven by logs or screenshots.

**Why this matters for the record:** this is a reusable debugging
technique - removing complexity until the failure disappears, then adding
it back deliberately - but the technique only supports a platform-vs-app
conclusion after the minimal app completes the full success path.

### Incident 4 - Azure CLI deployment, enriched diagnostics
**Change:** Replaced the `azure/webapps-deploy@v3` GitHub Action with a
direct `az webapp deploy` call, to deploy an explicitly-inspected ZIP and
get richer error output.

**Result:**
```text
Kudu Status : 400
Last Step   : HTTP request sent to deployment API
```

The request reached Kudu's deployment API and was rejected there - after
authentication, after the observed build completed, at the deployment-
finalization layer.

**Status: open.** The exact cause of the Kudu 400 has not been
conclusively isolated. This failure does not by itself prove RBAC, storage,
Kudu platform behavior, package structure, application startup, database
connectivity, or application health.

### Incident 5 - Azure RBAC (hypothesis, unconfirmed)
**Observation:** Authentication (OIDC) and authorization (RBAC) are
separate Azure failure domains with different error signatures. A
workflow can authenticate successfully and still lack the Azure role
assignment required to deploy to a specific App Service.

**Status: open - not confirmed.** RBAC was investigated as a leading
hypothesis, but the hypothesis was not confirmed. No successful post-RBAC
deployment was obtained, so there is insufficient evidence to attribute the
Kudu 400 to RBAC. This entry should be updated the moment that verification
happens, one way or the other.

---

## 4. False Leads

Investigated items are kept here because eliminating or narrowing them was
part of the diagnostic path, not wasted effort. The distinction matters:
"not observed" is not the same as "ruled out."

### Confirmed Not The Cause

| Candidate cause | Finding | Status |
|---|---|---|
| OIDC branch mismatch as the cause of the later Kudu 400 | The later deployment authenticated and reached Kudu/OneDeploy | RULED OUT for the later Kudu 400 only |
| Oryx build stage | Completed with 0 errors, 0 warnings | RULED OUT for the observed later failure |

### Insufficient Evidence / Not Confirmed

| Candidate cause | Finding | Status |
|---|---|---|
| Azure RBAC | Plausible because authentication and authorization are separate, but no successful post-RBAC deployment established causality | HYPOTHESIS / INCONCLUSIVE |
| Storage or deployment finalization problem | Kudu/OneDeploy returned HTTP 400 at the finalization layer, but no storage-specific failure was proven | HYPOTHESIS / INCONCLUSIVE |
| Kudu platform issue | The request reached Kudu, but that does not prove the Kudu platform itself was defective | HYPOTHESIS / INCONCLUSIVE |
| ZIP root structure | Simulated package had a correct root layout, but the evidence does not conclusively prove package layout was unrelated to the later Kudu 400 | INCONCLUSIVE |
| Node.js 22 compatibility | Application was structurally intended for Node 22, but no confirmed healthy Azure startup was obtained | INCONCLUSIVE |
| `node_modules` in package | Removed by workflow before packaging, reducing likelihood as a GitHub Actions packaging issue | INCONCLUSIVE for the Kudu 400 |
| `.env` in package | Not intentionally packaged | INCONCLUSIVE for the Kudu 400 |
| `WEBSITE_RUN_FROM_PACKAGE` | Not set at time of investigation | INCONCLUSIVE for the Kudu 400 |
| Local WSL disk space | Local filesystem evidence does not establish Azure filesystem or deployment storage behavior | Not valid evidence either way |
| Application startup failure | Deployment never reached a confirmed healthy application state | HYPOTHESIS / INCONCLUSIVE |
| Database failure | Could affect health after startup, but was not proven during this deployment-finalization failure | HYPOTHESIS / INCONCLUSIVE |

---

## 5. Diagnostic Decision Tree

```text
Deployment failure
 |
 +-- GitHub -> Azure authentication fails?
 |      Check OIDC: issuer / audience / subject / branch.
 |      Passing this stage does not prove authorization.
 |
 +-- Authentication OK, authorization fails?
 |      Check RBAC: role / scope / resource actions.
 |      Passing this stage requires successful deployment or Azure evidence,
 |      not just a role assignment guess.
 |
 +-- Package does not reach Azure?
 |      Check ZIP validity / artifact upload / deployment API request.
 |      Passing this stage does not prove build success.
 |
 +-- Build fails?
 |      Check Node version / package.json / dependencies / Oryx logs.
 |      Passing this stage does not prove deployment finalization.
 |
 +-- Deployment finalization fails?
 |      Check Kudu / OneDeploy / storage / locks / conflicts / HTTP status.
 |      Passing this stage does not prove application startup.
 |
 +-- App does not start post-deploy?
 |      Check env vars / DB / migrations / Redis / PORT / startup command.
 |      Passing this stage does not prove application health.
 |
 +-- App starts but is unhealthy?
        Check health endpoint / auth flow / DB connectivity / provider config.
```

A deployment is not "done" at a successful upload. It is done when the
application starts, the health endpoint responds, and auth plus DB
connectivity are verified. Deploy success, app startup, and app health are
separate checks.

---

## 6. Lessons Learned

1. **Authentication is not authorization.** A successful Azure login says
   nothing about whether that identity can act on a specific resource.
2. **Packaging is not deployment.** Inspect the exact artifact being
   deployed; never assume "what was built" equals "what shipped."
3. **Build success is not deployment success.** Oryx completing cleanly
   ruled out the build stage, not the deployment stage.
4. **Deployment success is not application health.** A shipped package can
   still fail to start.
5. **Local environment evidence is not remote environment evidence.** A
   command run in local WSL says nothing about the Azure container's
   filesystem or storage.
6. **Minimal reproductions isolate variables.** The smoke test is a strong
   technique for separating "is the platform broken" from "is PLOS's code
   broken," but only after the smoke test completes authentication,
   deployment, startup, and expected-response verification.
7. **Unresolved beats unsupported.** An unresolved root cause is preferable
   to an unsupported root-cause claim. The purpose of incident
   investigation is to establish what the evidence supports, not to force a
   definitive explanation.

---

## 7. Security Rules Applied

- Real values for `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`,
  `TOKEN_ENC_KEY`, `GEMINI_API_KEY`, and any Azure/Supabase credentials are
  never committed, screenshotted, or logged in plaintext.
- Diagnostic command output is redacted (`Value:'<REDACTED>'`) before
  being shared or documented.
- `.env` is never committed.
- This playbook does not claim that PLOS has passed penetration testing,
  IDOR/BOLA testing, SQL injection testing, XSS testing, or a complete
  security audit unless separate repository evidence for those specific
  tests is reviewed and cited.

---

## 8. Screenshot Placement Guide

| Screenshot | Section |
|---|---|
| OIDC subject mismatch (`AADSTS700213`) | Section 3, Incident 1 |
| App Service config (`az webapp config show`) | Section 3, Incident 2 |
| Oryx build log - 0 errors / 0 warnings | Section 3, Incident 2 |
| Enriched CLI error - Kudu Status 400 | Section 3, Incident 4 |
| Smoke-test workflow / result | Section 3, Incident 3 |

Before publishing any of these: redact usernames, subscription IDs,
publishing credentials, tokens, and database URLs.

For the smoke-test screenshot to support a platform-viability conclusion,
it must show or be paired with evidence of successful Azure authentication,
successful deployment, successful app startup, and the expected
`{"status": "ok"}` response.

---

## 9. Open Items

- **Root cause of the Kudu OneDeploy 400** - INCONCLUSIVE. RBAC is an
  unconfirmed hypothesis, not a confirmed finding.
- Minimum Azure RBAC role required for deployment, if RBAC remains under
  investigation; verify with a successful deployment before calling it
  causal.
- Successful smoke-test deployment on the trusted branch, including
  authenticated deploy, startup, and expected response.
- Post-deployment application health checks for PLOS: endpoint, DB, auth.
- Security review of the public staging environment once one exists.

*Note: Azure deployment is currently a secondary/portfolio track. The
active path to getting PLOS in front of testers is a Vercel/Render
deployment; this document will be updated if/when the Azure RBAC
hypothesis is confirmed or replaced.*
