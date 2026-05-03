# PLOS — Tomorrow's Build Session
**Date saved:** 2026-05-03
**Last commit:** f71cd49 — "Major release: Lumi AI life planning, journal architecture, alarms & content scheduler"

---

## START HERE — Read this first

We had a massive session today. Everything below is what's left to build.
The app runs. The backend is up. The frontend compiles (after fixing a JSX parse error in JournalDashboard.jsx line 1008 — missing `}` on the bookshelf grid conditional).

Tell Claude: **"Continue from TOMORROW.md"** and point to this file.

---

## DO THESE IN ORDER

### 1. Migration tracker ⚡ DO THIS FIRST — 20 minutes
**Why urgent:** The migration runner re-runs every SQL file on every server start.
Today it crashed the whole server with error `42P17` (bad index in migration 016).
We fixed the SQL but the root problem remains — any future bad migration will crash prod.

**What to build:**
- In `backend/src/db/connection.js` → add a `schema_migrations` table check at the top of `runMigrations()`
- Before running each `.sql` file, check if it's already in `schema_migrations`
- Only run files not yet recorded. After running, insert the filename.
- Add the `schema_migrations` table creation inline (it creates itself if not exists)

**Files to touch:** `backend/src/db/connection.js` only.

---

### 2. Week view in Planner — show actual schedule entries
**Why:** Users complete the life audit interview → Lumi builds a full weekly schedule → they go to the Planner → Week tab shows an empty grid. The data is in the database. The UI just isn't reading it.

**What to build:**
- In `frontend/src/pages/Schedule.jsx` → `WeekTab` component
- Fetch `GET /api/schedule` (all active schedules, not just today)
- Map recurring entries onto correct days using `repeat_pattern` + `repeat_days`
- Show each day's tasks as small coloured chips in the grid cells
- Clicking a chip opens the Lumi panel with context about that task

**Files to touch:** `frontend/src/pages/Schedule.jsx` (WeekTab component only)

---

### 3. Dashboard widgets — connect new data
**Why:** Dashboard feels empty. All the new data (content due today, journal pages, savings goals, life audit progress) exists in the database but nothing is showing it.

**What to add to `frontend/src/pages/Dashboard.jsx`:**
- Content posts due today → `GET /api/content/posts/today`
- Journal pages written today → `GET /api/journal/pages/today`
- Life audit session in progress → `GET /api/lumi/life-audit/preview` (show % complete if active)
- Savings goals progress → `GET /api/savings`

**Files to touch:** `frontend/src/pages/Dashboard.jsx`

---

### 4. Onboarding flow — first-time user life audit
**Why:** New users see an empty dashboard with no guidance. The life audit should be the first thing they do.

**What to build:**
- Check `localStorage.getItem('plos_onboarded')` on Dashboard mount
- If not set, show a full-screen modal: 3 steps (name/timezone → "Let Lumi plan your life" → done)
- Step 2 navigates to `/talk-to-lumi` and auto-starts the life audit
- Set `localStorage.setItem('plos_onboarded', 'true')` on completion

**Files to touch:** `frontend/src/pages/Dashboard.jsx`, possibly a new `frontend/src/components/OnboardingModal.jsx`

---

### 5. Habits page (replace redirect)
**Why:** `/habits` currently redirects to the wellness journal. Good temporary fix, needs a real page.

**What to build — `frontend/src/pages/Habits.jsx`:**
- Today's habits list with checkboxes → calls `POST /api/habits/:id/complete`
- Streak count per habit
- Weekly completion heatmap (7-day grid)
- "Add habit" button → Lumi logs it via `/api/lumi/message`
- Register route in `frontend/src/App.jsx` (replace the Navigate redirect)

**Backend already exists:** `habits` + `habit_completions` tables, routes in `/api/habits` or via Lumi

---

### 6. Journal past entries — browse by week
**Why:** Users who journal for weeks can't find old entries. The OpenJournal modal loads from the old `/journal/entries` table, not the new `/journal/pages` structured entries.

**What to fix in `frontend/src/pages/JournalDashboard.jsx`:**
- In the `OpenJournal` modal, replace the API call from `GET /journal/entries?limit=20` to `GET /journal/pages?journal_type={type}&limit=50`
- Group results by week
- Show date chips → clicking navigates to `/journal/page?type=&template=&date=`

---

### 7. Reminder minutes UI on schedule cards
**The column exists** (`reminder_minutes` in schedules table, migration 015).
**AlarmBar reads it.** There's just no UI to set it.

**What to add to `frontend/src/pages/Schedule.jsx` → `TaskCard`:**
- Small 🔔 icon on each card
- On click: dropdown with options: 5 min / 10 min / 15 min / 30 min / 1 hour / No reminder
- On select: call `PUT /api/schedule/:id` with `{ reminder_minutes: value }`

---

### 8. Gmail end-to-end test + fix
**What's needed:**
```bash
cd backend && npm install googleapis
```
Then add to `.env`:
```
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
GOOGLE_REDIRECT_URI=http://localhost:3000/api/oauth/google/callback
```
Then test: Settings → Integrations → Connect Google Account → full OAuth flow → send a test email via Lumi ("send an email to X saying Y").

Also: wire scheduled emails (`platform='email'` posts in `scheduled_posts`) to the `AlarmBar` so they fire as content alerts.

---

### 9. Lumi voice fallback — browser Speech API
**Why:** `/api/lumi/voice` requires OpenAI Whisper (OPENAI_API_KEY). Most installs won't have that.

**What to build in `frontend/src/pages/TalkToLumi.jsx`:**
- If backend voice upload fails with 503 (not configured) → fall back to browser Web Speech API
- The Web Speech API is already used in JournalPage for the floating mic → reuse that logic
- User speaks → browser transcribes → text sent to `/api/lumi/message` as normal
- This makes the life audit interview fully voice-operable without any API key

---

### 10. Production deployment (staging)
**Why:** Need HTTPS for PWA push notifications and Google OAuth redirect.

**Steps:**
1. Deploy backend to Railway (free tier) — connect GitHub repo, set env vars
2. Deploy frontend to Vercel — connect GitHub, set `VITE_API_URL` to Railway URL
3. Update `GOOGLE_REDIRECT_URI` to Railway URL
4. Update CORS in `backend/server.js` `ALLOWED_ORIGINS` to include Vercel URL
5. Test full app on the staging URL

---

### 11. PWA service worker — notifications when app is closed
**Needs Task 10 (HTTPS) first.**

**What to build:**
- `frontend/public/sw.js` — service worker: cache app shell, receive push events
- `frontend/src/main.jsx` — register service worker
- `backend/` → `npm install web-push`, generate VAPID keys
- `POST /api/notifications/subscribe` — save user's push subscription to DB
- Background job (or pg_cron) to fire push 10 minutes before each schedule item

---

### 12. Investor demo mode — do this last
**What to build:**
- Demo account with pre-seeded data: full life audit schedule, journal entries, budget transactions, content posts
- "Try Demo" button on login page → auto-logs into demo account
- 5-step guided tour overlay (hotspots on: Planner, Journal, Lumi, Content, Budget)
- Demo video script = the 12 investor talking points from today's session (see below)

---

## INVESTOR TALKING POINTS (for emails + pitch)

1. AI that routes information automatically — users never decide where to put anything
2. The type key mismatch bug — AI integration failures are invisible until a real user hits them
3. ADHD is 15–20% of adults. Every productivity app ignores them. We built for them specifically
4. Stateless AI is not a companion. Memory is the product — we solved it with Redis sessions
5. Claude-quality life planning on Groq's free tier — the moat is the structure, not the model
6. Notifications that work like a native app — built on Web APIs, zero cloud cost
7. Budget + Journal two-way sync — users shouldn't have to think about which app to open
8. Content creators lose revenue missing post times — we solved it without any social media API
9. The Claude affiliate model — pointing users to a "competitor" as a distribution strategy
10. Gmail integration with preview-first trust design — trust is a feature, not an assumption
11. Migration system that crashes the server — we know exactly where the technical debt is
12. Production-ready at $10/day for 1,000 DAU — every investor dollar goes to growth, not infra

---

## KEY FILES TO KNOW

| What | Where |
|------|-------|
| Lumi AI brain | `backend/src/services/lumiRouter.js` |
| Life audit interview | `backend/src/routes/lifeAudit.js` |
| All Lumi endpoints | `backend/src/routes/lumi.js` |
| Journal page entries | `backend/src/routes/journalPages.js` |
| Alarm system | `frontend/src/components/AlarmBar.jsx` + `frontend/src/lib/alarmScheduler.js` |
| Content planner | `frontend/src/pages/ContentPlanner.jsx` |
| Custom notebook wizard | `frontend/src/components/journal/CreateBookWizard.jsx` |
| TalkToLumi (life audit UI) | `frontend/src/pages/TalkToLumi.jsx` |
| Google OAuth | `backend/src/routes/oauth.js` |
| Gmail send | `backend/src/routes/gmail.js` |
| Database migrations | `backend/src/db/migrations/001–017` |
| Migration runner (needs fix) | `backend/src/db/connection.js` |

## JOURNAL TYPE KEYS (canonical — do not change)
`personal` · `spiritual` · `goals` · `business` · `wellness` · `budget`

## AI PROVIDER
Groq — `llama-3.3-70b-versatile` for main Lumi, `llama-3.1-8b-instant` for fast sub-tasks.
NOT Gemini. NOT OpenAI (except Whisper for voice, which has a browser fallback coming).

## REDIS KEYS
- `lumi_conv:{userId}` — conversation history (TTL 4h)
- `life_audit:{userId}` — life planning interview session (TTL 4h)
