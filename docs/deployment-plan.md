# Deployment Plan

Goal: prepare PLOS for a secure Azure deployment that demonstrates practical cloud security and DevSecOps skills.

## Target Deployment

Recommended Week 2 target:

- Frontend: Azure Static Web Apps or Azure App Service static hosting
- Backend: Azure App Service for Node.js or Azure Container Apps
- Database: Azure Database for PostgreSQL
- Secrets: Azure Key Vault
- Logs: Azure Monitor and Log Analytics
- Optional cache: Azure Cache for Redis

## Secure Deployment Checklist

| Area | Recommendation | Status |
| --- | --- | --- |
| Secrets | Store production secrets in Azure Key Vault | Planned |
| Identity | Use Managed Identity for backend access to Key Vault | Planned |
| Database | Disable broad public access where possible | Planned |
| HTTPS | Enforce HTTPS-only frontend and API traffic | Planned |
| CORS | Set `FRONTEND_URL` to the production frontend origin only | Prepared |
| Headers | Keep Helmet enabled in production | Implemented |
| Logs | Forward API logs to Log Analytics | Planned |
| Monitoring | Alert on 5xx spikes, failed login spikes, and token reuse | Planned |
| Backups | Enable PostgreSQL automated backups | Planned |
| CI/CD | Add lint, dependency scan, secret scan, and SAST | Planned |

## GitHub Actions Recommendations

Start with a simple CI workflow:

- Install backend dependencies
- Install frontend dependencies
- Run frontend linting
- Run backend tests
- Run `npm audit` or GitHub dependency review
- Run CodeQL for JavaScript
- Enable GitHub secret scanning and push protection

Suggested future workflow names:

- `ci.yml`
- `codeql.yml`
- `dependency-review.yml`

## Environment Variables

Production environment variables should not be stored in GitHub Actions plaintext secrets unless needed for deployment. Prefer:

- GitHub Actions OIDC to Azure
- Azure Managed Identity for runtime secrets
- Azure Key Vault references for app settings

Required backend variables:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_ACCESS_EXPIRY`
- `FRONTEND_URL`

Optional service variables:

- `REDIS_URL`
- `GROQ_API_KEY`
- `GEMINI_API_KEY`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

## Deployment Phases

### Phase 1: Local Hardening

- Confirm backend starts with validated env vars
- Confirm frontend calls API through configured base URL
- Confirm `.env` is ignored
- Confirm health endpoint works

### Phase 2: Azure Baseline

- Create resource group
- Deploy frontend hosting
- Deploy backend hosting
- Deploy PostgreSQL
- Configure HTTPS
- Configure CORS to production frontend only

### Phase 3: Security Services

- Add Key Vault
- Add Managed Identity
- Add Log Analytics workspace
- Enable Defender for Cloud
- Configure diagnostic logs

### Phase 4: CI/CD

- Add GitHub Actions CI
- Add CodeQL
- Add dependency scanning
- Add secret scanning and branch protection
- Add deployment workflow after CI passes

## Do Not Overbuild Yet

Avoid adding Kubernetes, service mesh, complex event buses, or enterprise SIEM integrations until the basic secure deployment is working and well documented.
