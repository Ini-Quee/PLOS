# Deploying PLOS Backend to Azure App Service

This guide replaces the Railway backend deployment path with Azure App Service for the Node.js API.

## Recommended Architecture

| Component | Azure service | Notes |
| --- | --- | --- |
| Backend API | Azure App Service, Linux, Node 22 LTS | Deploy the `backend/` directory as the app root. |
| PostgreSQL | Azure Database for PostgreSQL Flexible Server | Use SSL, private networking or firewall rules, and a least-privilege app user. |
| Redis | Azure Cache for Redis or Upstash | Optional. The app falls back when Redis is unavailable. |
| Secrets | App Service Configuration first, Key Vault later | Key Vault references are recommended after initial deployment is stable. |
| Logs/metrics | App Service logs plus Application Insights | Enable before production traffic. |
| Cron jobs | Azure WebJobs or Container Apps Job | Do not run cron inside scaled-out App Service instances. |

## Backend Compatibility Review

The backend is mostly compatible with Azure App Service:

- `backend/package.json` has `"start": "node server.js"`.
- `backend/server.js` listens on `process.env.PORT || 3000`, which supports Azure's injected port.
- `NODE_ENV=production` enables proxy trust and secure cookies.
- The backend has no build step; Azure only needs `npm ci` and `npm start`.
- Health endpoints exist at both `GET /health` and `GET /api/health`.
- Startup order is `validateEnv()`, Redis init, database migrations, then HTTP listen.

Use this App Service configuration:

```text
Runtime stack: Node 22 LTS on Linux
Startup command: npm start
App root: backend
Health check path: /health
HTTPS only: On
Always On: On
ARR affinity: Off unless a feature later requires sticky sessions
Minimum instances before production: 1
```

If Azure deploys from the repository root, configure the deployment workflow to package only `backend/`, or run all commands with `backend` as the working directory. Do not deploy the repository root as the Node app because the root `package.json` is not the backend app.

## App Settings

Set these in Azure Portal -> App Service -> Configuration -> Application settings, or with `az webapp config appsettings set`.

### Required to Start

| Setting | Example | Notes |
| --- | --- | --- |
| `NODE_ENV` | `production` | Required for production behavior. |
| `DATABASE_URL` | `postgres://user:pass@host.postgres.database.azure.com:5432/plos?sslmode=require` | Must point to Azure PostgreSQL and require SSL. |
| `JWT_SECRET` | 64+ random hex chars | Must be at least 32 characters. |
| `JWT_ACCESS_EXPIRY` | `15m` | Used by JWT signing and verification. |
| `TOKEN_ENC_KEY` | 64 hex chars | Generate from 32 random bytes. Used for OAuth token encryption. |
| `FRONTEND_URL` | `https://your-frontend.example.com` | Required in production for CORS and redirects. Comma-separated origins are supported. |

Azure supplies `PORT`; do not hard-code it unless troubleshooting.

### Required for Expected Product Behavior

At least one AI provider key should be present, otherwise `/health` returns `degraded` and Lumi features are disabled or fail.

| Setting | Example | Notes |
| --- | --- | --- |
| `AI_PROVIDER` | `gemini` | Use `gemini` or `groq`. If omitted, the code auto-selects based on available keys. |
| `GEMINI_API_KEY` | secret | Required when `AI_PROVIDER=gemini`. |
| `GROQ_API_KEY` | secret | Required when `AI_PROVIDER=groq`. |
| `DEMO_EMAIL` | `demo@plos.app` | Strongly recommended; otherwise code defaults to a public demo email. |
| `DEMO_PASSWORD` | secret | Strongly recommended; otherwise code defaults to an unsafe demo password. |

### Optional Feature Settings

| Setting | Feature |
| --- | --- |
| `REDIS_URL` | Redis-backed rate limiting/cache. Use `rediss://` for TLS endpoints. |
| `OPENAI_API_KEY` | Voice transcription endpoint. |
| `GOOGLE_CLIENT_ID` | Google OAuth/Gmail integration. |
| `GOOGLE_CLIENT_SECRET` | Google OAuth/Gmail integration. |
| `GOOGLE_REDIRECT_URI` | `https://your-api.azurewebsites.net/api/oauth/google/callback`. |
| `GMAIL_USER` | Outgoing email for contacts and partner habit emails. |
| `GMAIL_APP_PASSWORD` | Outgoing Gmail app password. |
| `VAPID_PUBLIC_KEY` | Web push notifications. Set persistently in production. |
| `VAPID_PRIVATE_KEY` | Web push notifications. Set persistently in production. |
| `VAPID_EMAIL` | VAPID contact email. Defaults to `admin@plos.app`. |
| `STRIPE_SECRET_KEY` | Billing checkout/portal/webhooks. |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature verification. |
| `STRIPE_PRO_PRICE_ID` | Stripe subscription price. |
| `LOG_LEVEL` | Pino log level, defaults to `info`. |
| `LUMI_APP_AGENT_ENABLED` | Enables full app agent behavior when set to `true`. |
| `LUMI_FREE_MESSAGES_PER_DAY` | Free tier message limit override. |
| `LUMI_PRO_MESSAGES_PER_DAY` | Pro tier message limit override. |
| `LUMI_DISABLE_MESSAGE_LIMIT` | Set `true` only for controlled testing. |
| `LUMI_LOCAL_ROUTER` | Set `false` to disable the local Lumi router. |
| `OLLAMA_HOST` | Local Ollama fallback. Do not use for Azure production unless separately hosted. |

The `.env.example` includes `JWT_REFRESH_SECRET` and `JWT_REFRESH_EXPIRY`, but the backend code currently does not read them.

## Generate Secrets

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npx web-push generate-vapid-keys
```

Use the 64-byte output for `JWT_SECRET`, the 32-byte output for `TOKEN_ENC_KEY`, and persist both VAPID keys in App Settings.

## Deployment Strategy

Safest first production path:

1. Use GitHub Actions with Azure publish profile or OIDC.
2. Build/package only the `backend/` directory.
3. Deploy to a staging slot with Zip Deploy.
4. Run smoke checks against the staging slot.
5. Swap staging to production after health and login checks pass.

Recommended workflow behavior:

```yaml
working-directory: backend
install: npm ci --omit=dev
package: zip backend contents, not repo root
deploy: azure/webapps-deploy to staging slot
```

`az webapp deploy` or Zip Deploy from a local machine is acceptable for the first manual deployment, but GitHub Actions plus deployment slots is safer and repeatable. Azure Developer CLI is useful only if this repo grows an `azure.yaml` and checked-in infrastructure workflow. For the current repository, plain App Service plus GitHub Actions is the lowest-risk path.

## Database Migrations on Azure Startup

`server.js` runs `runMigrations()` before the HTTP server starts. That means a fresh Azure instance can initialize or upgrade the database during startup as long as:

- `DATABASE_URL` is reachable from App Service.
- The connection string includes `sslmode=require`.
- The database user can create/alter tables, indexes, policies, and the `schema_migrations` table.
- Azure PostgreSQL firewall or private networking allows App Service outbound access.

Important risk: the migration runner does not take a PostgreSQL advisory lock. If App Service runs multiple instances during deployment or scale-out, two instances can evaluate the same migration as pending and run it concurrently. Keep App Service at one instance while migrations run, or move migrations to a one-off CI/CD step before slot swap. Add a database advisory lock before relying on startup migrations in scaled production.

The migrations are sorted by filename and run in a single transaction per file. Current migration filenames include both `034_trackers.sql` and `034_unforce_rls.sql`; lexicographic ordering means `034_trackers.sql` runs before `034_unforce_rls.sql`. Avoid adding duplicate numeric prefixes going forward.

RLS note: `withUserContext()` currently executes `SET LOCAL ROLE plos_app`, but the migrations do not create that role. Provision `plos_app` and grant the required table privileges before enabling routes that depend on `withUserContext()` or before making FORCE RLS part of production enforcement. The current migration set intentionally unforces RLS again in `034_unforce_rls.sql` and `035_fix_rls_write_block.sql`.

## Cron Worker Recommendation

Today, `server.js` forks `src/workers/cronWorker.js` inside the API process after the server starts. The worker schedules:

- Weekly partner habit emails every Monday at 08:00 server time.
- Push notification reminders every minute.

This is acceptable only for a single-instance evaluation deployment. It is not the safest production design on Azure App Service because every App Service instance starts its own worker. The push reminder path has a PostgreSQL uniqueness guard, but the weekly email path can still duplicate work across instances because it selects users before calling `sendWeeklyPartnerEmails`.

Production recommendation:

1. Add an app setting such as `CRON_WORKER_ENABLED=false` for the API process.
2. Start the worker separately with `npm run worker`.
3. Run it as one of:
   - Azure WebJob on the same App Service Plan for the simplest setup.
   - Azure Container Apps Job if you want container isolation and clearer scaling controls.
   - Azure Functions Timer Trigger if the worker is refactored into discrete timer functions.

Use UTC deliberately. Azure App Service Linux instances normally run UTC unless `WEBSITE_TIME_ZONE` is configured, and `node-cron` currently has no explicit timezone in this worker.

## Health Checks

Configure Azure App Service Health check path as:

```text
/health
```

`GET /health` and `GET /api/health` return:

- `status`: `ok` when database and selected AI provider are configured, otherwise `degraded`.
- `db`: `connected` or `unreachable`.
- `ai.provider` and `ai.configured`.
- Redis status with fallback visibility.
- Timestamp, version, and environment.

Post-deployment smoke checks:

```bash
curl https://your-api.azurewebsites.net/health
curl https://your-api.azurewebsites.net/api/health
curl -X POST https://your-api.azurewebsites.net/api/demo/login
```

Expect health to be `ok` only when the database is reachable and the selected AI key is present. Redis being offline does not fail the health check.

## Railway-Specific Assumptions to Remove

Remove or stop using:

- Root `railway.toml`.
- `backend/railway.toml`.
- Railway URLs in deployment docs, OAuth redirect URIs, Stripe webhook URLs, and frontend `VITE_API_URL`.
- Any assumption that the platform auto-provisions `DATABASE_URL`.
- Any assumption that every GitHub push should immediately deploy to production without staging validation.

Update integrations:

- Google OAuth callback: `https://your-api.azurewebsites.net/api/oauth/google/callback`.
- Stripe webhook: `https://your-api.azurewebsites.net/api/billing/webhook`.
- Frontend API URL: `https://your-api.azurewebsites.net`.
- Backend `FRONTEND_URL`: the real frontend origin, not the API origin.

## Production Issues to Resolve Before Launch

- Add a PostgreSQL advisory lock or move migrations to a single CI/CD step before scaling beyond one instance.
- Gate the forked cron worker behind an environment variable and run exactly one worker outside the API process.
- Create and grant the `plos_app` PostgreSQL role, or remove `SET LOCAL ROLE plos_app` from paths that run in production. The current tenant-isolation test fails without that role.
- Persist `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`; auto-generated process-local keys will break push subscriptions after restarts.
- Set `DEMO_PASSWORD` to a strong secret or disable demo routes in production.
- Enable App Service Always On, health checks, log streaming, retention, and Application Insights.
- Confirm Azure PostgreSQL SSL and firewall/private endpoint connectivity before slot swap.
- Confirm Stripe webhook raw body behavior after deployment by sending a Stripe test event.
- Confirm `FRONTEND_URL` includes every real browser origin that will call the API.
- Keep initial production scale at one instance until migration and cron ownership are separated from HTTP startup.

## Manual Azure CLI Sketch

```bash
az group create --name rg-plos-prod --location eastus

az appservice plan create \
  --name asp-plos-prod \
  --resource-group rg-plos-prod \
  --is-linux \
  --sku B1

az webapp create \
  --name plos-api-prod \
  --resource-group rg-plos-prod \
  --plan asp-plos-prod \
  --runtime "NODE|22-lts"

az webapp config set \
  --name plos-api-prod \
  --resource-group rg-plos-prod \
  --startup-file "npm start"

az webapp config appsettings set \
  --name plos-api-prod \
  --resource-group rg-plos-prod \
  --settings NODE_ENV=production FRONTEND_URL=https://your-frontend.example.com
```

Package and deploy from `backend/`, not from the repository root.
