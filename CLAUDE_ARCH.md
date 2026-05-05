# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Commands

### Frontend (`frontend/`)
```bash
npm run dev       # Vite dev server on http://localhost:5173
npm run build     # Production build
npm run lint      # ESLint
npm run preview   # Preview production build locally
```

### Backend (`backend/`)
```bash
npm run dev       # nodemon (auto-restart on change) on port 3000
npm start         # Production: node server.js
npm run worker    # Run cron background worker standalone
```

### Local env setup
- Copy `backend/.env.example` to `backend/.env`. Required vars: `DATABASE_URL`, `JWT_SECRET`.
- At minimum, add `GROQ_API_KEY` (free at console.groq.com) to enable Lumi.
- Frontend reads `VITE_API_URL` (defaults to `http://localhost:3000` via Vite proxy or direct).

### Health check
```bash
curl http://localhost:3000/api/health
# Expected: {"status":"ok","db":"connected",...}
```

---

## Architecture

### Monorepo layout
```
PLOS/
  frontend/   React 19 + Vite + Tailwind v4
  backend/    Node/Express + PostgreSQL + Redis
  DEPLOY.md   Railway (backend) + Vercel (frontend)
```

### Backend

**Startup sequence** (`backend/server.js` → `start()`):
1. `validateEnv()` — crashes fast if `DATABASE_URL` or `JWT_SECRET` missing; logs which optional features are disabled
2. `redisClient.init()` — connects to Redis; app runs without it (rate-limiting falls back to memory)
3. `runMigrations()` — applies any unapplied `.sql` files from `backend/src/db/migrations/` in sorted order; tracked in `schema_migrations` table
4. HTTP server starts; cron worker forked as a child process

**Route structure** — all under `/api/`:
| Prefix | File |
|--------|------|
| `/auth` | `src/routes/auth.js` |
| `/lumi` | `src/routes/lumi.js` |
| `/lumi/life-audit` | `src/routes/lifeAudit.js` |
| `/journal` | `src/routes/journal.js` |
| `/journal/pages` | `src/routes/journalPages.js` |
| `/budget` | `src/routes/budget.js` |
| `/habits` | `src/routes/habits.js` |
| `/schedule` | `src/routes/schedule.js` |
| `/users` | `src/routes/users.js` |
| `/billing` | `src/routes/billing.js` (Stripe) |
| `/oauth` | `src/routes/oauth.js` (Google) |
| `/demo` | `src/routes/demo.js` |
| `/push` | `src/routes/push.js` (Web Push / VAPID) |

**Lumi AI brain** (`src/services/lumiRouter.js`):
- Receives free-text from the user via `/api/lumi`
- Calls Groq (`llama-3.3-70b-versatile`) to extract facts and generate a response
- Routes each extracted fact to the correct DB table (budget → `budget_entries`, habit → `habit_completions`, schedule → `schedules`, etc.)
- Always writes a human-readable narrative to `lumi_daily_entries` so the user sees their day in the Journal
- Conversation history stored in Redis under `lumi_conv:{userId}` (TTL 4 h)
- Life audit interview state in `life_audit:{userId}` (TTL 4 h)

**AI provider**: Groq only — `llama-3.3-70b-versatile` for Lumi, `llama-3.1-8b-instant` for fast sub-tasks. Do not substitute OpenAI or Gemini for these routes.

**Database migrations**:
- Files in `backend/src/db/migrations/` named `NNN_description.sql`, sorted and applied in order
- Tracked in `schema_migrations(filename, applied_at)` — never re-run a file already recorded there
- Current highest: `029_stripe_tables.sql` — next new migration must be `030_...`

**Feature flags** (set by `validateEnv()`): `redisEnabled`, `lumiEnabled`, `emailEnabled`, `pushEnabled`, `oauthEnabled`, `stripeEnabled` — route handlers check these before using the corresponding service.

---

### Frontend

**Entry point**: `src/main.jsx` → `src/App.jsx`

**Background / atmosphere system** — three layered components:
1. `Atmosphere.jsx` (wraps the entire app in `App.jsx`) — photo-based scenes with CSS particle effects. Picks the best scene from `src/lib/atmos.js → SCENES` by scoring time-of-day + season + section + region. Scene auto-refreshes every 60 s. Exposes `AtmosContext` (palette + scene) to all children via `useAtmos()`.
2. `LivingBackground.jsx` — pure CSS gradient + SVG silhouettes + weather particles (rain, snow, dust, etc.). Driven by `src/lib/livingBackgroundConfig.js`. Used when the photo-based Atmosphere is not active.
3. Season detection (`src/lib/seasonDetection.js`) — detects user country via `ipapi.co`, maps to a season, caches in `localStorage` for 24 h (`userCountry`, `currentSeason`, `seasonCacheTime`).

**Color / theme system**:
- CSS variables defined in `src/index.css` `:root` (dark) and `[data-theme="coloured"]`
- JS palette in `src/lib/colors.js` (`Colors`, `ModuleColors`)
- Theme is set by `document.documentElement.setAttribute('data-theme', theme)` in `Settings.jsx`
- Dynamic palette from the current atmosphere scene flows via `useAtmos()` → `palette.accent`, etc.

**Layout**: `src/components/layout/SidebarLayout.jsx` — renders the sidebar nav (desktop) and bottom nav (mobile). Exports design tokens `C` and `NAV_ITEMS`. The hidden routes (Projects, Contacts, Books, Calendar, Content, Goals, Jobs) are accessible via URL but not shown in the nav.

**Journal types** (canonical, do not change keys):
`personal` · `spiritual` · `goals` · `business` · `wellness` · `budget`

**Pages → API mapping** (key wiring to know):
- `Dashboard.jsx` — reads from multiple endpoints; uses `useAtmos()` for palette
- `Journal/JournalPage.jsx` — uses `BlockEditor.jsx` (Notion-style blocks), auto-saves to `/api/journal/pages`
- `JournalDashboard.jsx` — reads from `/api/journal/pages`, shows per-type stats
- `TalkToLumi.jsx` → `POST /api/lumi` (main chat)
- `Budget.jsx` → `/api/budget` + `/api/savings`
- `Habits.jsx` → `/api/habits`

**Freemium gates**: checked via `user.subscription_tier` (`'free'` | `'pro'`). Pro upgrade via Stripe → `/api/billing`.

**PWA**: `sw.js` and `manifest.json` already built. Icons need generating (see CLAUDE.md task list).

**Offline queue**: `src/lib/offlineQueue.js` — queues mutations when offline, replays on reconnect.

---

## Key conventions

- **No canvas** for particles — all effects are CSS animations on `<div>` elements for accessibility and performance.
- **Glass-morphism cards**: `background: rgba(..., 0.30); backdrop-filter: blur(18px); border: 1px solid rgba(255,255,255,0.07)` — the atmosphere always shows through.
- **Stripe webhook** must be mounted *before* `express.json()` in `server.js` (needs raw body).
- **VAPID keys** auto-generated on first backend start — copy from logs to env vars before restarting.
- All backend routes use `src/middleware/auditLog.js` (`globalAuditLog`) for mutation logging — it runs on every `/api` non-GET request.
