# PLOS — Project Instructions for Claude

## What this app is
PLOS is a life-planning productivity app for people with ADHD. Lumi is the AI assistant.
Every design decision prioritises zero friction. Lumi does the thinking so the user doesn't have to.

## Current state (as of 2026-05-05)
- Full web app built. All original 12 tasks done. Not yet deployed.
- Journal system migration in progress (uncommitted — commit this first before anything else).
- Theme overhaul needed (see below).

---

## START HERE — DO THESE IN ORDER

### 0. Commit current journal work (5 min)
Three uncommitted changes:
- `frontend/src/components/journal/BlockEditor.jsx` (new — Notion-style block editor)
- `frontend/src/pages/JournalPage.jsx` (Blank Page now uses BlockEditor)
- `frontend/src/pages/JournalDashboard.jsx` (uses /journal/pages API, per-type stats, real snippets)

Commit message: `Journal: BlockEditor + migrate dashboard to journal_page_entries`

---

### 1. THEME OVERHAUL — Woody aesthetic + two colour modes
**User wants:** Brown, pitch black, warm gray — "woody" feel. Two switchable modes.

#### Mode A — Dark (default)
Deep woody dark. Like a dark wood-panelled study at night.
```
background:        #080503   (pitch black with a brown undertone)
surface-card:      rgba(20, 12, 6, 0.88)
surface-elevated:  rgba(35, 22, 12, 0.95)
primary (accent):  #C8955C   (warm amber — keep for Lumi)
text-primary:      #EAE0D5   (warm off-white)
text-secondary:    #9B8A7A
text-muted:        #5E5048
border:            rgba(200, 149, 92, 0.09)
html/body bg:      #080503
```

#### Mode B — Coloured (warm woody with richer accents)
Same wood feel but surfaces are warmer and accents are richer/brighter.
```
background:        #0F0804   (dark walnut)
surface-card:      rgba(30, 18, 8, 0.90)
surface-elevated:  rgba(52, 32, 16, 0.97)
primary (accent):  #D4A06A   (brighter amber/sienna)
text-primary:      #F5EDE2
text-secondary:    #C4A882
text-muted:        #7A6450
border:            rgba(212, 160, 106, 0.15)
html/body bg:      #0F0804
```

**Files to update:**
1. `frontend/src/index.css` — replace `:root` (dark) and `[data-theme="light"]` → rename to `[data-theme="coloured"]` with the coloured palette above
2. `frontend/src/lib/colors.js` — replace `Colors` with woody palette, update `ModuleColors` accents to earth tones
3. `frontend/src/pages/Settings.jsx` — update the theme toggle: options are "dark" | "coloured" (remove "light" label, rename to "Coloured")
4. Any hardcoded `#0A0A0F`, `#13131A`, `#1C1C27` hex values in page files → replace with CSS variables

**Journal page accents** (per book — keep warm, woody):
```
personal:   #C8955C   (amber)
spiritual:  #9B7FD4   (muted purple)
budget:     #5BA88A   (muted teal/sage)
wellness:   #7ABFB8   (soft teal)
goals:      #7AAEE8   (muted blue)
business:   #D4A06A   (sienna/gold)
```

---

### 2. Migration tracker (backend, 20 min)
**Why urgent:** Migration runner re-runs ALL SQL files on every server start. Any bad migration crashes prod.

In `backend/src/db/connection.js` → `runMigrations()`:
- Add `CREATE TABLE IF NOT EXISTS schema_migrations (filename TEXT PRIMARY KEY, run_at TIMESTAMPTZ DEFAULT NOW())`
- Before each `.sql` file: check if filename is in schema_migrations → skip if yes
- After running: insert filename

---

### 3. Week view in Planner — show actual schedule entries
In `frontend/src/pages/Schedule.jsx` → `WeekTab` component:
- Fetch `GET /api/schedule` (all active schedules)
- Map recurring entries onto correct days using `repeat_pattern` + `repeat_days`
- Show each day's tasks as small coloured chips in grid cells
- Clicking a chip opens context in Lumi panel

---

### 4. Dashboard widgets — connect new data
In `frontend/src/pages/Dashboard.jsx` add:
- Content posts due today → `GET /api/content/posts/today`
- Journal pages written today → `GET /api/journal/pages/today`
- Life audit session in progress → `GET /api/lumi/life-audit/preview`
- Savings goals progress → `GET /api/savings`

---

### 5. Bug testing pass (before deploy)
Walk every page. Fix before deploying.

| Page | What to check |
|------|--------------|
| Planner | Today tab, week view, bell reminder picker, progress ring |
| Habits | Add habit, mark done (identity vote modal), heatmap, share card PNG |
| Journal | Open a book, write, auto-save, Browse tab past entries |
| Dashboard | Stat cards, InsightCard, no crashed widgets |
| Lumi | Send message, response, header shows memory count |
| Budget | Log expense, see in list |
| Login | "Try Investor Demo" loads demo with seed data |
| Mobile | iPhone 12 DevTools: bottom nav, pages usable, heatmap 4 weeks |

---

### 6. Deploy
Follow DEPLOY.md. Railway (backend) + Vercel (frontend).
Get Gemini API key free: aistudio.google.com/apikey
VAPID keys auto-generated on first backend start — copy from logs to Railway env vars.

---

### 7. PWA — complete it (1 day, nearly done)
- Generate icons at realfavicongenerator.net → drop into `frontend/public/icons/`
- Test "Add to Home Screen" on iOS Safari and Android Chrome
- sw.js and manifest.json already built

---

## KEY FILES

| What | Where |
|------|-------|
| Color system | `frontend/src/lib/colors.js` |
| CSS variables / themes | `frontend/src/index.css` |
| Theme toggle | `frontend/src/pages/Settings.jsx` |
| Lumi AI brain | `backend/src/services/lumiRouter.js` |
| Life audit interview | `backend/src/routes/lifeAudit.js` |
| Journal block editor | `frontend/src/components/journal/BlockEditor.jsx` |
| Journal page entries API | `backend/src/routes/journalPages.js` |
| Migration runner | `backend/src/db/connection.js` |
| Alarm system | `frontend/src/components/AlarmBar.jsx` |
| Mobile layout | `frontend/src/components/layout/SidebarLayout.jsx` |
| Offline queue | `frontend/src/lib/offlineQueue.js` |
| Deploy instructions | `DEPLOY.md` |

## AI PROVIDER
Groq — `llama-3.3-70b-versatile` (Lumi), `llama-3.1-8b-instant` (fast sub-tasks).
NOT Gemini. NOT OpenAI.

## JOURNAL TYPE KEYS (canonical — do not change)
`personal` · `spiritual` · `goals` · `business` · `wellness` · `budget`

## REDIS KEYS
- `lumi_conv:{userId}` — conversation history (TTL 4h)
- `life_audit:{userId}` — life planning interview session (TTL 4h)

## DATABASE MIGRATIONS
001–017: original schema | 018: habits | 019: identity/revival | 020: is_demo
021: lumi_memories | 022: habit_commitments | 023: push_subscriptions
