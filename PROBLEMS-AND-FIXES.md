# PLOS — Problems & Fix Plan

Six structural problems identified during the investor teardown. Each has a clear fix plan with specific files and build order.

---

## Problem 1 — Lumi Has No Memory ✓ FIXED 2026-05-04

**What is broken:**
Lumi is an LLM call with a session-scoped system prompt. When the session ends, everything is forgotten. Lumi cannot say "three months ago you told me your biggest fear was financial instability." The intelligence resets to zero on every conversation. This makes the core differentiator of the product — a compounding AI that knows you better over time — a marketing claim rather than a technical reality.

**Fix Plan:**

### Step 1 — Persistent memory store
Create migration `020_lumi_memory.sql`:
```sql
CREATE TABLE lumi_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  memory_type VARCHAR(30) NOT NULL, -- 'fact', 'goal', 'fear', 'pattern', 'milestone'
  content TEXT NOT NULL,
  source VARCHAR(30), -- 'life_audit', 'journal', 'chat', 'habit_pattern'
  importance INTEGER DEFAULT 5, -- 1-10, used for retrieval ranking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_lumi_memories_user ON lumi_memories(user_id, importance DESC);
```

### Step 2 — Memory extraction on key events
In `backend/src/routes/lumi.js`, after every life audit completion and after every chat turn, run an extraction prompt:
```
"From this conversation, extract 0-3 facts worth remembering about this user long-term.
Return JSON: [{ type: 'goal'|'fear'|'pattern'|'fact', content: string, importance: 1-10 }]"
```
Insert results into `lumi_memories`.

### Step 3 — Inject memories into every Lumi prompt
Before each Lumi response, query top 10 memories by importance and prepend them to the system prompt:
```
"What you know about this user from past sessions:
- [fact]: They said their biggest fear is financial instability (importance: 9)
- [goal]: They want to run a marathon by December
- [pattern]: They are most productive in the mornings but consistently skip evening habits"
```

### Step 4 — Retrieval over journal entries
Add a `/api/lumi/recall` endpoint that does a semantic search over the user's journal entries using pg_trgm similarity or a simple keyword index. When Lumi needs context, it can pull relevant journal excerpts rather than relying only on structured memories.

**Files to touch:**
- `backend/src/db/migrations/020_lumi_memory.sql` — new
- `backend/src/routes/lumi.js` — memory extraction + injection
- `frontend/src/pages/TalkToLumi.jsx` — no changes needed (transparent to UI)

**Effort:** 2–3 days  
**Impact:** Transforms Lumi from a chatbot into a genuine long-term AI companion. This is the single highest-impact fix.

---

## Problem 2 — No Push Notifications (Retention Collapse)
> Note: Offline-first write queue built 2026-05-04 as part of mobile research implementation. Habits, journal pages, budget entries, and schedule completions now queue to localStorage on network failure and flush automatically on reconnect.

**What is broken:**
PLOS only works when the user opens PLOS. There is no mechanism to pull the user back. Without push notifications, habit reminders, and schedule alerts reaching the user on their phone, the app relies entirely on self-initiated behavior — which is exactly what the app is supposed to help users overcome. Retention will collapse at day 7 without this.

**Fix Plan:**

### Step 1 — Deploy to production (prerequisite)
Push notifications require HTTPS. Deploy backend to Railway or Render, frontend to Vercel. See Problem 5 for full deployment plan. This must come first.

### Step 2 — PWA manifest and service worker
Create `frontend/public/manifest.json` with app name, icons, theme color, `display: standalone`.
Create `frontend/public/sw.js` — service worker that handles `push` events and shows `self.registration.showNotification()`.
Register the service worker in `frontend/src/main.jsx`.

### Step 3 — Web Push subscription backend
Add migration for push subscriptions:
```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
Create `backend/src/routes/push.js` with:
- `POST /api/push/subscribe` — saves subscription object
- `POST /api/push/unsubscribe` — removes it
Use `web-push` npm package with VAPID keys stored in `.env`.

### Step 4 — Notification triggers
In the schedule/habits routes, when a reminder time is reached, call the push service:
```js
webpush.sendNotification(subscription, JSON.stringify({
  title: 'Time for: Morning Run',
  body: 'You have a 7-day streak. Don\'t break it now.',
  icon: '/icons/icon-192.png'
}))
```
Use a cron job (node-cron) in the backend that runs every minute, checks for due schedule items, and fires notifications.

**Files to touch:**
- `frontend/public/manifest.json` — new
- `frontend/public/sw.js` — new
- `frontend/src/main.jsx` — SW registration
- `backend/src/routes/push.js` — new
- `backend/src/db/migrations/021_push_subscriptions.sql` — new
- `backend/server.js` — mount push routes, start cron

**Effort:** 3–4 days (after deployment)  
**Impact:** Day 7 retention goes from "user must remember to open app" to "app finds user."

---

## Problem 3 — No Mobile Experience ✓ FIXED 2026-05-04

**What is broken:**
The core user behaviors — logging a workout, journaling before sleep, checking habits in the morning — are mobile-native moments. PLOS currently requires a desktop browser. This is a fundamental mismatch between where the product needs to live and where it actually lives. No App Store presence means no organic discovery, no social sharing, no "download it" call to action in a demo.

**Fix Plan:**

### Step 1 — Responsive layout audit
Audit every page for mobile breakpoints. The biggest offenders will be:
- `Dashboard.jsx` — multi-column widget grid
- `Schedule.jsx` — week view 7-column grid
- `Habits.jsx` — heatmap overflows on small screens

Add CSS media queries at `max-width: 768px` throughout. The heatmap should collapse from 13 weeks to 4 weeks on mobile. The week view should become a horizontal scroll.

### Step 2 — Touch targets and interactions
All buttons need minimum 44×44px tap targets. The hover-to-reveal delete buttons on habits/schedule cards need a long-press alternative on mobile.

### Step 3 — PWA install prompt
Once the service worker is in place (Problem 2), add a subtle "Add to Home Screen" prompt in the Dashboard header for mobile users who have not yet installed. Store the `beforeinstallprompt` event and surface it at an appropriate moment (after 3 sessions, not on first visit).

### Step 4 — React Native (future, not now)
After the PWA is proven and retention data exists, evaluate a React Native rewrite of the core loop (Dashboard → Habits → Journal → Lumi). The web codebase should be kept clean with a clear API boundary so this migration is not a rewrite from scratch.

**Files to touch:**
- Every page component — responsive CSS additions
- `frontend/src/components/layout/SidebarLayout.jsx` — mobile nav (hamburger/bottom bar)
- `frontend/src/pages/Habits.jsx` — heatmap responsive collapse
- `frontend/src/pages/Schedule.jsx` — week view horizontal scroll on mobile

**Effort:** 1 week  
**Impact:** Opens the app to the entire mobile-first user base. Also required for PWA installation, which is required for push notifications.

---

## Problem 4 — No Social Layer ✓ FIXED 2026-05-04

**What is broken:**
PLOS is a solo experience. There is no sharing, no accountability partners, no community. The single most powerful distribution mechanic for consumer wellness apps is social proof and peer accountability. If your friend is on PLOS, your activation probability doubles. If you have a shared commitment with real stakes, your retention doubles. Without this, every user is acquired independently and retained independently — no compounding, no virality, no word-of-mouth loop.

**Fix Plan:**

### Step 1 — Accountability partners (lightweight, high impact)
Add a `habit_commitments` table:
```sql
CREATE TABLE habit_commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id),
  user_id UUID NOT NULL REFERENCES users(id),
  partner_email TEXT NOT NULL,
  partner_user_id UUID REFERENCES users(id),
  stake_description TEXT, -- "I owe you £20 if I miss 3 days"
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
When a user adds a commitment, their partner gets an email (via the Gmail integration already built) with a link to view the streak. The partner does not need a PLOS account to receive updates — just an email address.

### Step 2 — Shareable streak cards
Generate a visual streak card (an SVG or canvas render) that users can share. The card shows: habit name, streak count, heatmap for the last 4 weeks, identity label. One share button. No social feed inside the app — just an image that goes to Instagram, WhatsApp, wherever the user lives.

### Step 3 — Public life audit milestones
Allow users to optionally share a "milestone post" when they hit significant identity markers — "I've voted for being an athlete 30 times this month." Again, not a social feed inside PLOS. An exportable image that creates external word-of-mouth.

**Files to touch:**
- `backend/src/db/migrations/022_commitments.sql` — new
- `backend/src/routes/habits.js` — add commitment endpoints
- `frontend/src/pages/Habits.jsx` — add partner/stake field to habit creation
- `frontend/src/components/ShareCard.jsx` — new, canvas-based streak card

**Effort:** 3–4 days for accountability partners, 2 days for share cards  
**Impact:** Each shared card is a distribution event. Each accountability partner is an acquisition event.

---

## Problem 5 — No Production Deployment

**What is broken:**
The app runs on localhost. That means: no HTTPS, no push notifications, no Google OAuth in production, no PWA installation, no user testing with real people, no investor demo URL, no uptime monitoring. Everything good about PLOS is invisible to anyone who is not sitting at your laptop.

**Fix Plan:**

### Step 1 — Backend on Railway
1. Create `railway.toml` at repo root with build and start commands
2. Add all environment variables (DATABASE_URL, JWT_SECRET, OPENAI_API_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, FRONTEND_URL)
3. Railway provisions a Postgres database automatically — point DATABASE_URL at it
4. Deploy. Backend live at `https://plos-api.railway.app`

### Step 2 — Frontend on Vercel
1. `cd frontend && vercel --prod`
2. Set `VITE_API_URL=https://plos-api.railway.app` in Vercel environment variables
3. Frontend live at `https://plos.vercel.app`

### Step 3 — Custom domain (optional but recommended for demo)
Point a domain at the Vercel deployment. `app.plos.io` or similar. This matters for investor demos — a real URL reads as real product.

### Step 4 — Update CORS and OAuth
- Backend `ALLOWED_ORIGINS` must include the Vercel URL
- Google OAuth console must include the production callback URL
- Update `FRONTEND_URL` env var on Railway

### Step 5 — Health monitoring
Add UptimeRobot or Better Uptime monitoring on `/api/health`. Free tier is sufficient. Get a Slack or email alert if the server goes down.

**Files to touch:**
- `railway.toml` — new
- `frontend/vercel.json` — new (rewrite rules for SPA routing)
- `backend/.env.production` — document required vars (do not commit)
- `backend/server.js` — verify CORS handles production origin

**Effort:** 1 day  
**Impact:** Everything else depends on this. Push notifications, Google OAuth, PWA, investor demo — all blocked until the app has a real URL.

---

## Problem 6 — Feature Depth ✓ FIXED 2026-05-04

**What is broken:**
The app collects rich behavioral data — identity votes, habit heatmaps, savings patterns, journal entries, life audit responses — but does not synthesize that data into the kind of longitudinal insight that justifies the psychological architecture. The Identity Vote collects a score but shows a simple count. The heatmap shows presence/absence but not effort, mood, or time of day. Lumi can see today's data but not the trend across six months. The data is there. The insight is not.

**Fix Plan:**

### Step 1 — Identity Score trend line
In `Habits.jsx`, add a small sparkline below each habit's identity bar showing the 30-day rolling average of identity scores. A user should be able to see "I was scoring 8s in March and 4s in April" at a glance. Use a simple SVG path — no charting library needed.

### Step 2 — Habit correlation surface
Add a weekly insight card on the Dashboard: "On weeks you completed your Morning Run, your journal sentiment was 40% more positive." This requires:
- A sentiment score on journal entries (run a simple positive/negative classification on save, store in a column)
- A weekly aggregation query that correlates habit completion rates with journal sentiment
- One card on the Dashboard that surfaces the strongest correlation found

### Step 3 — Savings behavior pattern
The Budget and Savings modules have transaction data. Add a monthly pattern card: "Your overspending happens on weekends and correlates with weeks where your 'Mindset' habits are below 50% completion." This is a JOIN across `transactions`, `habit_completions`, and a day-of-week grouping. High insight value, moderate query complexity.

### Step 4 — Lumi monthly review
On the first day of each month, Lumi automatically generates a "Month in Review" — a structured summary of:
- Habit completion rates vs previous month
- Identity vote trends
- Savings progress
- Journal entry count and rough sentiment
- One specific observation and one specific recommendation

This is stored as a special journal entry type and surfaced on the Dashboard. It costs one API call per user per month. It is the most powerful retention mechanic in the system.

**Files to touch:**
- `backend/src/routes/journal.js` — add sentiment scoring on save
- `backend/src/routes/habits.js` — add trend endpoint
- `backend/src/routes/lumi.js` — add monthly review generation
- `frontend/src/pages/Habits.jsx` — sparkline trend under identity bar
- `frontend/src/pages/Dashboard.jsx` — correlation card, monthly review card
- `backend/src/db/migrations/023_journal_sentiment.sql` — add sentiment column

**Effort:** 1 week  
**Impact:** Converts the app from a data logger into an insight engine. This is the difference between "I use PLOS to track things" and "I use PLOS because it understands my patterns better than I do."

---

## Build Order

Do these in sequence — each one unblocks the next.

| Order | Problem | Why this sequence |
|-------|---------|-------------------|
| 1st | **Problem 5 — Deploy** | Everything else needs HTTPS and a real URL |
| 2nd | **Problem 3 — Mobile** | Responsive layout before users start testing |
| 3rd | **Problem 2 — Push notifications** | Needs deployment + mobile layout + service worker |
| 4th | **Problem 1 — Lumi memory** | High impact, self-contained, no dependencies |
| 5th | **Problem 6 — Insight depth** | Needs real usage data to validate which insights matter |
| 6th | **Problem 4 — Social layer** | Build last — social mechanics only work when core retention is proven |

**Total estimated effort: 4–5 weeks of focused building.**

After these six fixes, PLOS moves from "remarkable demo" to "defensible, retention-proven, investor-ready product."
