# PLOS — Session Checkpoint

**Last updated:** June 23, 2026
**Branch:** `feature/lumi-local-router`

---

## WHAT'S DONE (this session)

### 1. JournalDashboard.jsx fix (committed)
- Fixed `useEffect` guard in `OpenJournal` component — prevents crash when `journal` prop is null
- Commit: `f9834ea fix: guard useEffect in OpenJournal against null journal prop`

### 2. Migration tracker (already implemented)
- `backend/src/db/connection.js` already has `schema_migrations` table
- Tracks applied migrations, prevents re-running on server start
- ✅ Complete

### 3. Week view in Planner (already implemented)
- `frontend/src/pages/Schedule.jsx` → `WeekTab` component (line 238)
- Fetches `GET /api/schedule`, maps entries to days via `repeat_pattern` + `repeat_days`
- Shows coloured chips per day, clicking opens Lumi panel
- ✅ Complete

### 4. Dashboard widgets (already implemented)
- `frontend/src/pages/Dashboard.jsx` already fetches:
  - Content posts due today → `GET /api/content/posts/today`
  - Journal pages written today → `GET /api/journal/pages/today`
  - Life audit session → `GET /api/lumi/life-audit/preview`
  - Savings goals → `GET /api/savings`
- ✅ Complete

### 5. Discovery Panel (already implemented)
- `frontend/src/pages/Dashboard.jsx` → `DiscoveryPanel` component (line 1280)
- Shows: Plan status (Free/Pro), Gmail connection, Notifications, Quick settings chips
- ✅ Complete

### 6. Theme overhaul (already implemented)
- `frontend/src/index.css` — woody dark palette (#080503) + coloured mode (#0F0804)
- `frontend/src/lib/colors.js` — updated with amber/purple/teal accents
- ✅ Complete

### 7. Bug testing pass — IN PROGRESS
- Ran `npm run lint` on frontend
- **224 problems (206 errors, 18 warnings)**
- Fixed critical bug: `clearTimers` not defined in `lumi-listen.js` (moved variable declarations outside try/catch)
- **Fixed:**
  - `TalkToLumi.jsx` — moved `speak`, `fetchContext`, `greet` function declarations ABOVE the `useEffect` that calls them
  - `Schedule.jsx` — replaced `nowInserted` variable with `findIndex` to fix immutability error
  - `sw.js` — added `/* global clients */` comment to fix service worker ESLint errors
- **Remaining (non-critical):**
  - Many `no-unused-vars` warnings (non-critical)
  - Many `react-hooks/set-state-in-effect` warnings (non-critical, lint rule only)
  - Many `empty block statement` warnings (catch blocks — non-critical)

---

## WHAT'S NEXT (in order)

### 1. Continue bug testing pass (30 min)
Fix the remaining critical lint errors:
- **TalkToLumi.jsx** — ✅ Fixed: moved function declarations before useEffect
- **Schedule.jsx** — ✅ Fixed: replaced `nowInserted` with `findIndex`

Then manually test each page:
| Page | What to check |
|------|--------------|
| Planner | Today tab, week view, bell reminder picker, progress ring |
| Habits | Add habit, mark done (identity vote modal), heatmap |
| Journal | Open a book, write, auto-save, Browse tab |
| Dashboard | Stat cards, InsightCard, DiscoveryPanel |
| Lumi | Send message, response, header memory count |
| Budget | Log expense, see in list |
| Login | Page loads correctly |
| Mobile | iPhone 12 DevTools: bottom nav, pages usable |

### 2. Native app — offline cache (1 hour)
- Add AsyncStorage caching for GET endpoints in `PLOS/services/api.ts`
- Create write queue for mutations

### 3. Deploy (2-3 hours)
- Follow `DEPLOY.md`
- Railway (backend) + Vercel (frontend)
- Copy VAPID keys from backend logs to Railway env vars
- Get Gemini API key from aistudio.google.com/apikey

### 4. PWA — complete it (1 hour)
- Generate icons at realfavicongenerator.net → `frontend/public/icons/`
- Test "Add to Home Screen" on iOS Safari and Android Chrome
- `sw.js` and `manifest.json` already built

---

## KEY FILES TO TOUCH NEXT

### Bug fixes (frontend)
- `frontend/src/pages/TalkToLumi.jsx` — ✅ Fixed: moved function declarations before useEffect
- `frontend/src/pages/Schedule.jsx` — ✅ Fixed: replaced `nowInserted` with `findIndex`

### Native app (PLOS/)
- `PLOS/services/api.ts` — add offline cache layer
- `PLOS/app.config.ts` — environment config (done)
- `PLOS/services/pushNotifications.ts` — push notifications (done)
- `PLOS/utils/biometric.ts` — biometric lock (done)

### Deploy
- `DEPLOY.md` — deployment instructions
- `backend/src/db/connection.js` — migration runner (done)
- `frontend/src/index.css` — theme (done)

---

## GIT STATUS
- Branch: `feature/lumi-local-router`
- Last commit: `f9834ea fix: guard useEffect in OpenJournal against null journal prop`
- Uncommitted changes: `PLOS/` directory (native app — 2277 lines added)
- No secrets in git ✅

## UNCOMMITTED NATIVE APP CHANGES (PLOS/)
The native app has significant uncommitted work:
- New screens: planner, lumi, journal (with book view), habits, budget, calendar, contacts, content-planner, email, jobs, profile, projects, settings, trackers, upgrade, year-plan
- New components: LumiFace, HeroCard, GlanceCard, NudgeBar, StreakGrid, ModeToggle, VoiceCapture
- New services: pushNotifications, biometric utility
- Updated colors.ts with woody amber theme
- Updated typography.ts with serif hero
- 5-tab navigation: Home, Planner, Lumi (center), Journal, Habits

**Consider committing native app work before continuing.**

---

## REMAINING TASKS FROM CLAUDE.md

| # | Task | Status |
|---|------|--------|
| 0 | Commit journal work | ✅ Done |
| 1 | Theme overhaul | ✅ Done |
| 2 | Migration tracker | ✅ Done |
| 3 | Week view in Planner | ✅ Done |
| 4 | Dashboard widgets | ✅ Done |
| 5 | Bug testing pass | 🔄 In progress |
| 6 | Deploy | ⏳ Pending |
| 7 | PWA complete | ⏳ Pending |
