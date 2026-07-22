# PLOS Backend Azure Deployment Readiness

## Summary

The PLOS backend is an Express API that can run on Azure App Service using the existing `npm start` command from the `backend` directory. It requires PostgreSQL and secure app settings. Redis, email, OAuth, push, Stripe, and OpenAI voice features are optional and degrade or disable when their environment variables are absent.

## Runtime

- Runtime: Node.js, CommonJS
- Azure target: Node.js 22 LTS
- Package manager: npm
- Lockfile: `backend/package-lock.json`
- Install command: `npm ci`
- Start command: `npm start`
- App entry: `backend/server.js`
- Port: `process.env.PORT || 3000`

## Build Process

There is no backend transpile/build step. Azure App Service should install dependencies and start the API:

```bash
npm ci
npm start
```

If deploying from the repository root, configure the App Service deployment working directory to `backend`, or deploy the `backend` directory as the app package.

## Required Environment Variables

- `NODE_ENV=production`
- `PORT` supplied by Azure App Service
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_ACCESS_EXPIRY`
- `TOKEN_ENC_KEY`
- `FRONTEND_URL`
- `AI_PROVIDER=gemini`
- `GEMINI_API_KEY`

## Optional Environment Variables

- `REDIS_URL`
- `GROQ_API_KEY`
- `OPENAI_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_EMAIL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE_ID`
- `LOG_LEVEL`

## Database Requirements

- PostgreSQL reachable via `DATABASE_URL`
- App starts by running SQL migrations in `backend/src/db/migrations`
- Connection string should include Azure PostgreSQL SSL settings, for example `sslmode=require`
- The app expects to create/read/update its own tables via the configured database user

## Storage Requirements

- No persistent local file uploads are required by the backend
- Lumi voice uploads use in-memory `multer` storage
- Static assets are not served by the backend
- Web push icons are referenced by URL paths used by the frontend/PWA

## AI Provider Configuration

- Active provider: Gemini by default
- Required for Lumi: `AI_PROVIDER=gemini` and `GEMINI_API_KEY`
- Rollback provider: set `AI_PROVIDER=groq` and provide `GROQ_API_KEY`
- Health checks report provider/configured status without exposing secrets

## Background Jobs

The API process starts `backend/src/workers/cronWorker.js` as a child process.

Jobs:

- Weekly partner habit emails: Monday 08:00
- Push notification reminders: every minute

The jobs are idempotency-guarded in PostgreSQL. On a scaled-out App Service plan, every instance may start its own worker, so keep one instance on the free/evaluation deployment or move this worker to a separate Azure WebJob/Container App before scaling.

## Health Checks

Endpoints:

- `GET /health`
- `GET /api/health`

Response includes:

- application status
- database connectivity
- AI provider/configured status
- Redis availability
- timestamp
- runtime environment

Recommended Azure App Service health check path: `/health`.

## Azure Services

Recommended minimum:

- Azure App Service for the Node.js backend
- Azure Database for PostgreSQL Flexible Server

Optional:

- Azure Cache for Redis if Redis-backed rate limiting/session fallback is desired
- Azure Key Vault for secret storage after the first deployment is stable
- Azure Monitor/Application Insights for logs and availability monitoring
- Azure Storage only if future persistent file uploads or diagnostic dumps are enabled

## App Service Configuration

Use the values in `backend/azure-app-service.example.json` as the deployment checklist.

Suggested App Service settings:

- Runtime stack: Node 22 LTS
- Startup command: `npm start`
- Health check path: `/health`
- HTTPS only: enabled
- App settings: configure secrets in Azure App Service Configuration, not in source control

## Readiness Status

- `PORT` support: ready
- `NODE_ENV=production`: ready
- Secure environment variables: ready via App Service app settings
- Production logging: ready, structured JSON logger is present
- Graceful startup: ready, env validation, Redis init, migrations, and server start are sequenced
- Graceful shutdown: ready, SIGTERM/SIGINT close HTTP server, Redis, PostgreSQL, and cron child process
- Health check: ready

## Risks

- Startup migrations mean a broken migration prevents deployment startup.
- Free App Service plans are best for evaluation, not production availability.
- The cron worker runs inside each API instance, so scale-out should be treated carefully.
- Azure PostgreSQL firewall/network rules must allow App Service to connect.
