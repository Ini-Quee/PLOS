# Deploying PLOS to Production

## Backend → Railway

1. Install Railway CLI: `npm install -g @railway/cli`
2. `railway login`
3. `railway init` — create new project
4. `railway add` — add a Postgres database (Railway provisions it automatically)
5. Set environment variables in the Railway dashboard:

```
DATABASE_URL        = (Railway provides this automatically)
JWT_SECRET          = (generate: openssl rand -hex 64)
NODE_ENV            = production
FRONTEND_URL        = https://your-app.vercel.app
GROQ_API_KEY        = (from console.groq.com)
GOOGLE_CLIENT_ID    = (from Google Cloud Console)
GOOGLE_CLIENT_SECRET= (from Google Cloud Console)
GOOGLE_REDIRECT_URI = https://your-api.railway.app/api/oauth/google/callback
```

6. `railway up` — deploy. Backend live at `https://your-api.railway.app`
7. Test: `curl https://your-api.railway.app/api/health`

## Frontend → Vercel

1. Install Vercel CLI: `npm install -g vercel`
2. `cd frontend`
3. Create `.env.production`:
```
VITE_API_URL=https://your-api.railway.app/api
```
4. `vercel --prod`
5. Set `VITE_API_URL` in Vercel dashboard → Settings → Environment Variables

## Google OAuth — update for production

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Add to Authorised JavaScript origins: `https://your-app.vercel.app`
3. Add to Authorised redirect URIs: `https://your-api.railway.app/api/oauth/google/callback`

## Update CORS

In `backend/server.js`, add your Vercel URL to `ALLOWED_ORIGINS` via the `FRONTEND_URL` env var (already wired).

## Monitoring

Add free uptime monitoring at uptimerobot.com pointing at `https://your-api.railway.app/api/health`.
Paste your email for alerts.
