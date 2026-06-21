# PLOS — Session Checkpoint

**Last updated:** June 2026
**Branch:** `feature/lumi-local-router`

---

## WHAT'S DONE

### Documentation (committed + pushed)
- `PLOS/MOBILE_SPEC.md` — Full native app design spec (nav, screens, components, build plan)
- `PLOS/SECURITY_AUDIT.md` — Vulnerabilities, credential storage map, fixes needed
- `PLOS/OFFLINE_AND_FREEMIUM.md` — Offline architecture + pricing strategy

### Security
- Full stack audit completed (backend, web frontend, native app)
- No secrets exposed in git ✅
- `backend/.env` (has real Groq key) was never committed — gitignored ✅
- npm audit: 0 vulnerabilities (fixed nodemailer, form-data, qs, brace-expansion, uuid)
- 25/25 backend tests pass

### Frontend (committed + pushed)
- Woody amber theme overhaul (31 files)
- LumiFace component
- Atmosphere system (wallpapers, particles)
- Journal V2
- Settings cleanup

### Native App (PLOS/PLOS/PLOS/)
- Expo Router scaffolded with route groups
- Auth flow (login/register) working
- SecureStore for JWT tokens
- Zustand auth store
- AES-256-GCM encryption utility
- Home dashboard (13KB, has greeting, life score, habits grid, quick actions)
- 3 placeholder screens (Journal, Budget, Habits)
- Profile screen (minimal — just logout)

---

## WHAT'S NEXT (in order)

### Phase 0 — Brand Pass (not started)
- Replace `constants/colors.ts` with woody amber palette (`#C8955C` primary, `#0A0A0F` background)
- Update `constants/typography.ts` with serif hero
- Restyle login/register with brand colors
- Restyle Home with brand cards
- Update `app.json` splash background

### Phase 1 — Navigation Fix (not started)
- Create `app/(tabs)/planner/` route group
- Create `app/(tabs)/lumi/` route group
- Move `budget/` and `profile/` out of tabs (accessed from Home)
- Update `app/(tabs)/_layout.tsx` with 5-tab bar: Home, Planner, Lumi (center), Journal, Habits
- Style tab bar: `#0D0D16` bg, amber active, Lumi center elevated with LumiFace

### Phase 2 — LumiFace Component (not started)
- Build `components/LumiFace.tsx` with Reanimated
- 5 moods: resting, thinking, happy, listening, concerned
- Place on center tab and Lumi screen

### Phase 3 — Lumi Chat Screen (not started)
- Build `app/(tabs)/lumi/index.tsx`
- Text chat with Lumi
- Suggestion chips
- Voice input (expo-av → Whisper)
- Wire to `POST /api/lumi/chat`

### Phase 4 — Home + Planner (not started)
- Wire Home to real API endpoints
- Build Planner (Today/Week/Year segmented view)

### Phase 5 — Habits + Trackers (not started)
- Habit cards with tap-to-complete + haptics
- Tracker grids (GitHub-style streak visualization)
- Celebration modal (identity vote)

### Phase 6 — Journal + Budget (not started)
- Journal bookshelf → entry list → compose
- Budget overview + quick-add expense

### Phase 7 — Native Features (not started)
- Push notifications
- Biometric lock
- Offline cache + write queue
- Environment config (app.config.ts)

### Phase 8 — Profile + Settings (not started)
- Full settings screen
- Theme toggle (Dark / Coloured)
- Billing/upgrade flow

### Phase 9 — Release (not started)
- EAS build
- TestFlight + Play Internal Testing

---

## KEY DECISIONS MADE

### Navigation
- 5 tabs: Home, Planner, Lumi (center), Journal, Habits
- Budget and Profile accessed from Home cards / settings icon
- Lumi center tab has animated LumiFace eyes

### Colors (brand-aligned)
- Primary: `#C8955C` (warm amber)
- Background: `#0A0A0F`
- Tab active: `#C8955C` (amber, NOT blue)
- Lumi gold: `#D6B85A`
- Lumi thinking: `#5B9BD6`

### Freemium
- Free: unlimited habits, all journal types, unlimited budget/planner, 10 Lumi AI messages/day
- Pro ($9.99/mo): 100 AI messages, monthly reviews, life audit, cloud sync, smart nudges
- Gate AI depth, not core utility

### Offline
- Read cache (AsyncStorage/localStorage) for all GET endpoints
- Write queue expanded to all write operations
- Port `lumiLocalRouter.js` to frontend for offline Lumi lookups
- Budget, habits, trackers, schedule all work offline with cached data

### Security (fixes needed before deploy)
- Remove raw password from sessionStorage (web) — derive key client-side
- Remove refresh token from localStorage (web) — use httpOnly cookie
- Encrypt MFA secrets in DB
- Add rate limiters to refresh, MFA verify, demo login
- Add auth middleware to journal routes missing it
- Move native BASE_URL to app.config.ts

---

## FILES TO TOUCH NEXT

### Phase 0 (brand pass)
- `PLOS/constants/colors.ts` — replace palette
- `PLOS/constants/typography.ts` — add serif hero
- `PLOS/app/(auth)/login.tsx` — restyle
- `PLOS/app/(auth)/register.tsx` — restyle
- `PLOS/app/_layout.tsx` — update loading screen
- `PLOS/app/(tabs)/index.tsx` — restyle Home
- `PLOS/app/(tabs)/profile/index.tsx` — restyle
- `PLOS/app.json` — update splash

### Phase 1 (nav fix)
- `PLOS/app/(tabs)/_layout.tsx` — new 5-tab bar
- `PLOS/app/(tabs)/planner/index.tsx` — NEW
- `PLOS/app/(tabs)/lumi/index.tsx` — NEW

---

## GIT STATUS
- Branch: `feature/lumi-local-router`
- All changes committed and pushed
- No uncommitted work
- No secrets in git
