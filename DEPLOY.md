# Deploying PLOS to Production

## Overview

| Service | Provider | Cost | Purpose |
|---------|----------|------|---------|
| Backend + PostgreSQL | Railway Hobby | $5/month | API + database |
| Redis | Upstash free | $0 | Rate limiting + session cache |
| Frontend | Vercel free | $0 | React app |
| AI | Groq + Gemini | $0–5/month | Lumi AI |

---

## Step 1 — Backend on Railway

1. Create account at railway.app
2. New project → Add service → GitHub repo → select `backend/` as root directory
3. Railway auto-detects `railway.toml` and runs `node server.js`
4. Add PostgreSQL: New service → Database → PostgreSQL (Railway sets `DATABASE_URL` automatically)

### Required environment variables (set in Railway dashboard):

```
# Required — app will not start without these
DATABASE_URL          = (Railway sets this automatically)
JWT_SECRET            = (generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_ACCESS_EXPIRY     = 15m
TOKEN_ENC_KEY         = (generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# AI (at least one required for Lumi)
GROQ_API_KEY          = (from console.groq.com — free tier)
GEMINI_API_KEY        = (from aistudio.google.com/apikey — 1M tokens/day free)

# Frontend origin (required for CORS)
FRONTEND_URL          = https://your-app.vercel.app

# Demo account
DEMO_EMAIL            = demo@plos.app
DEMO_PASSWORD         = (generate a random string)

# Optional — features degrade gracefully without these
REDIS_URL             = (from upstash.com — free tier, see Step 2)
STRIPE_SECRET_KEY     = (from stripe.com dashboard)
STRIPE_WEBHOOK_SECRET = (from stripe.com webhook settings)
STRIPE_PRO_PRICE_ID   = (from stripe.com product pricing)
GOOGLE_CLIENT_ID      = (from Google Cloud Console)
GOOGLE_CLIENT_SECRET  = (from Google Cloud Console)
GOOGLE_REDIRECT_URI   = https://your-api.railway.app/api/oauth/google/callback
GMAIL_USER            = (Gmail address for outgoing emails)
GMAIL_APP_PASSWORD    = (Gmail app password — not your regular password)
VAPID_PUBLIC_KEY      = (auto-generated on first start — copy from logs)
VAPID_PRIVATE_KEY     = (auto-generated on first start — copy from logs)
NODE_ENV              = production
```

5. Deploy: Railway auto-deploys on every push to main
6. Verify: `curl https://your-api.railway.app/api/health`
   Expected: `{"status":"ok","db":"connected",...}`

---

## Step 2 — Redis on Upstash (free)

1. Create account at upstash.com
2. Create Redis database → copy the `REDIS_URL` (format: `rediss://...`)
3. Add `REDIS_URL` to Railway environment variables
4. Redis is optional — the app runs without it (rate limiting falls back to in-memory)

---

## Step 3 — Frontend on Vercel

1. Create account at vercel.com
2. New project → import GitHub repo → set root directory to `frontend/`
3. Vercel auto-detects Vite

### Environment variables (set in Vercel dashboard):

```
VITE_API_URL = https://your-api.railway.app
```

4. Deploy — Vercel auto-deploys on every push to main
5. Your app is live at `https://your-app.vercel.app`

---

## Step 4 — Stripe webhook (if using Stripe)

1. Go to stripe.com → Developers → Webhooks → Add endpoint
2. URL: `https://your-api.railway.app/api/billing/webhook`
3. Events to listen: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_succeeded`
4. Copy the signing secret → add to Railway as `STRIPE_WEBHOOK_SECRET`

---

## Step 5 — Google OAuth (if using Gmail integration)

1. Go to console.cloud.google.com → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Authorised JavaScript origins: `https://your-app.vercel.app`
4. Authorised redirect URIs: `https://your-api.railway.app/api/oauth/google/callback`
5. Copy Client ID and Secret → add to Railway env vars

---

## Step 6 — Post-deploy checklist

```bash
# 1. Health check
curl https://your-api.railway.app/api/health

# 2. Demo login
curl -X POST https://your-api.railway.app/api/demo/login

# 3. Demo reset (get token from step 2)
curl -X POST https://your-api.railway.app/api/demo/reset \
  -H "Authorization: Bearer TOKEN"
```

- [ ] Health check returns `{"status":"ok","db":"connected"}`
- [ ] Demo login returns a user object with `is_demo: true`
- [ ] Open app in browser → register a real account → complete onboarding
- [ ] Click "Try Investor Demo" → demo account loads with seed data
- [ ] "Tour" button in demo banner triggers the 5-step tour
- [ ] Lumi responds to a message
- [ ] Week view shows the seeded schedule

---

## Monitoring (free)

- uptimerobot.com → monitor `https://your-api.railway.app/api/health` every 5 minutes → email alert if down
- Railway dashboard → logs tab → check for any startup errors

---

## Cost summary at 1,000 DAU

| Item | Cost |
|------|------|
| Railway Hobby (backend + DB) | $5/month |
| Vercel (frontend) | $0 |
| Upstash Redis | $0 |
| Groq AI (free tier, 50K RPD) | $0 |
| Gemini Flash (1M tokens/day) | $0–$3 |
| **Total** | **~$5–8/month** |
