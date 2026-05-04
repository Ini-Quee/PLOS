# PLOS — Pre-Launch Checklist

Everything that must be done before inviting real users. Work through this in order.

---

## Infrastructure (do first — everything else depends on it)

- [ ] **Deploy backend to Railway** — `railway up` (see DEPLOY.md)
- [ ] **Deploy frontend to Vercel** — `vercel --prod` (see DEPLOY.md)
- [ ] **Set all environment variables** on Railway (DATABASE_URL, JWT_SECRET, GROQ_API_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, FRONTEND_URL)
- [ ] **Update Google OAuth** — add production URLs to authorised origins + redirect URIs
- [ ] **Test health check** — `curl https://your-api.railway.app/api/health`
- [ ] **Add uptime monitor** — UptimeRobot free tier on `/api/health`

---

## Before 100 Trial Users (token economics)

- [x] **Switch Groq → Gemini Flash** — aiClient.js wrapper prefers Gemini when GEMINI_API_KEY set, falls back to Groq automatically
- [x] **Add per-user daily message cap** — 50 msgs/day, graceful message, backend guard on `/lumi/message`
- [ ] **Test demo account** — `POST /api/demo/login`, verify seed data loads, reset works

---

## Problems Fixed (from PROBLEMS-AND-FIXES.md)

- [x] **Problem 1 — Lumi memory** — persistent `lumi_memories` table, injection into prompt, extraction from responses
- [x] **Offline-first write queue** — habits, journal, budget, schedule queue to localStorage on network failure, flush on reconnect
- [x] **Problem 2 — Push notifications** — push_subscriptions table, /api/push routes, per-minute cron fires reminders, usePushNotifications hook, Dashboard opt-in prompt after 3 sessions
- [x] **Problem 3 — Mobile responsive layout** — DONE
- [x] **Problem 4 — Social layer** — accountability partners (partner email + weekly cron emails), shareable streak card PNG download, "👥 Partner watching" badge
- [ ] **Problem 5 — Deploy** — config files done, commands not yet run
- [x] **Problem 6 — Insight depth** — identity sparklines on habits, InsightCard on dashboard, Lumi monthly review generated + saved to journal

---

## Polish (do last)

- [ ] **PWA icons** — generate icon set at all sizes (72, 96, 128, 144, 152, 192, 384, 512px)
- [ ] **Custom domain** — point domain at Vercel deployment
- [ ] **Investor demo walkthrough** — test demo account end-to-end, verify all seed data looks good
- [x] **Error boundaries** — Dashboard widgets individually wrapped (compact), Habits + Schedule page-level wrapped, App-level boundary
- [x] **Privacy policy page** — /privacy route, covers data collection, Google API compliance, Lumi memory, GDPR rights
