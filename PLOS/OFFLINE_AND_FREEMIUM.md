# PLOS — Offline-First Architecture & Freemium Strategy

**Purpose:** Make PLOS useful without internet. Make the free tier good enough to hook users, restricted enough to convert.
**Companion docs:** `SECURITY_AUDIT.md`, `MOBILE_SPEC.md`

---

## PART 1 — WHAT WORKS WITHOUT INTERNET

### The Core Principle

PLOS is a life operating system. People live their lives in tunnels, on planes, in areas with bad signal. The app must **open and show something useful** every time. If it shows a login screen or empty state because there's no signal, it fails.

### Feature-by-Feature Offline Map

#### ✅ FULLY OFFLINE (no server needed)

| Feature | How | Data Loss Risk |
|---------|-----|---------------|
| **Voice output (TTS)** | Browser `SpeechSynthesis` / `expo-speech` | None — local synthesis |
| **Journal encryption/decryption** | Web Crypto / `react-native-quick-crypto` | None — pure client-side |
| **Alarm system** | `setTimeout` + Notification API | None — fires from cached schedule |
| **Theme/appearance** | localStorage / AsyncStorage | None — static config |
| **Season/atmosphere** | Timezone fallback | None — client-side |
| **Biometric lock** (native) | `expo-local-authentication` | None — device-only |
| **Streak calculation** | Date math on cached completion arrays | None — pure computation |
| **Budget summary** | `SUM/GROUP BY` on cached entries | None — pure computation |
| **Savings progress** | `saved/target * 100` | None — pure math |
| **Tracker streaks** | Identical date math as habits | None — pure computation |
| **Schedule repeat resolution** | `repeat_pattern` + `repeat_days` → which days | None — pure date logic |
| **Consistency scores** | Already computed client-side in `Habits.jsx` | None |
| **Heatmap grids** | Already computed client-side | None |
| **Habit identity votes** | Template text from lookup table | None |

#### ✅ OFFLINE WITH CACHE + QUEUE (reads from cache, writes queue)

| Feature | Read Cache | Write Queue | Current Status |
|---------|-----------|-------------|----------------|
| **Dashboard** | Cache all widget data | N/A | ❌ No cache yet |
| **Habits list** | Cache habits + completions | ✅ Already queues complete/uncomplete | Partial |
| **Habit create** | — | ❌ Not queued yet | ❌ |
| **Tracker list** | Cache trackers + marks | ❌ Not queued yet | ❌ |
| **Tracker mark/unmark** | — | ❌ Not queued yet | ❌ |
| **Journal entries** | Cache last 20 entries | ✅ Already queues saves | Partial |
| **Budget entries** | Cache entries + compute summary | ✅ Already queues log expense | Partial |
| **Budget goals** | — | ❌ Not queued yet | ❌ |
| **Savings goals** | Cache goals | ❌ Not queued for deposits | ❌ |
| **Schedule list** | Cache today + week | ✅ Already queues completions | Partial |
| **Schedule create** | — | ❌ Not queued yet | ❌ |
| **User profile** | Cache in localStorage/AsyncStorage | ❌ Settings update not queued | ❌ |

#### ❌ REQUIRES INTERNET

| Feature | Why | Could It Ever Work Offline? |
|---------|-----|---------------------------|
| **Lumi empathetic chat** | Groq API (llama-3.3-70b) | Only with local LLM (Ollama exists but needs device resources) |
| **Voice transcription** | Whisper API | Only with local Whisper model (heavy) |
| **Monthly review** | AI prose generation | Template fallback possible |
| **Life audit** | AI interview | Partially — template questions exist |
| **Memory extraction** | AI inference | No |
| **Gmail integration** | Google API | No |
| **OAuth flow** | Google consent | No |
| **Stripe billing** | Stripe API | No |
| **Push notification scheduling** | Server cron | Local alarms work as fallback |
| **Registration** | Server required | No |

---

## PART 2 — THE OFFLINE-FIRST ARCHITECTURE

### Layer 1: Read Cache

Every GET endpoint caches its last successful response.

**Web:** `localStorage` with key `cache:{endpoint}` + timestamp
**Native:** `AsyncStorage` with same pattern

```ts
// Pseudocode — shared cache wrapper
async function cachedFetch(endpoint, options = {}) {
  const cacheKey = `cache:${endpoint}`;
  const cached = await storage.get(cacheKey);

  // Return cached immediately if fresh enough
  if (cached && Date.now() - cached.timestamp < options.maxAge * 1000) {
    return { data: cached.data, stale: false, fromCache: true };
  }

  // Try network
  try {
    const response = await api.get(endpoint);
    await storage.set(cacheKey, { data: response.data, timestamp: Date.now() });
    return { data: response.data, stale: false, fromCache: false };
  } catch (err) {
    // Network failed — return stale cache if available
    if (cached) {
      return { data: cached.data, stale: true, fromCache: true };
    }
    throw err; // no cache, no network — real error
  }
}
```

**Cache durations:**

| Data | maxAge | Rationale |
|------|--------|-----------|
| Habits + completions | 5 min | Changes frequently (completions) |
| Trackers + marks | 5 min | Changes frequently (marks) |
| Budget entries | 10 min | Changes moderately |
| Budget summary | 10 min | Derived from entries |
| Savings goals | 30 min | Changes infrequently |
| Schedule / today | 5 min | Completions change it |
| Schedule / week | 15 min | Less volatile |
| Journal entries | 30 min | Changes moderately |
| User profile | 1 hour | Rarely changes |
| Lumi memories | 1 hour | Rarely changes |
| Settings | 1 hour | Rarely changes |

### Layer 2: Write Queue (expand existing)

The current queue handles 6 endpoints. Expand to all write operations:

**Current queueable:**
- `POST /habits/:id/complete` ✅
- `DELETE /habits/:id/complete` ✅
- `POST /journal/pages` ✅
- `POST /budget/entries` ✅
- `POST /schedule/:id/complete` ✅
- `DELETE /schedule/:id/complete` ✅

**Add to queue:**
- `POST /habits` (create habit)
- `POST /trackers` (create tracker)
- `POST /trackers/:id/mark` (mark day)
- `DELETE /trackers/:id/mark` (unmark day)
- `POST /savings` (create goal)
- `POST /savings/:id/deposit` (add money)
- `PUT /savings/:id` (update goal)
- `POST /schedule` (create schedule item)
- `PUT /schedule/:id` (update schedule)
- `DELETE /schedule/:id` (delete schedule)
- `PUT /budget/entries/:id` (update entry)
- `DELETE /budget/entries/:id` (delete entry)
- `PUT /budget/goals` (update budget goals)
- `PUT /users/settings` (update settings)
- `PUT /users/profile` (update profile)
- `POST /journal/pages/types` (create journal type)

**Queue storage:**
- Web: `localStorage('plos_offline_queue')` — max 500 items
- Native: `AsyncStorage('plos_offline_queue')` — max 500 items

**Dedup rules:**
- DELETE cancels queued POST for same resource
- PUT replaces previous PUT for same resource
- Journal page POST replaces previous POST for same page ID
- Habit/tracker completions: latest wins

### Layer 3: Optimistic UI (already partially exists)

When a write is queued (offline), the UI should update immediately:

| Action | Optimistic Update |
|--------|------------------|
| Habit complete | Card shows checkmark, streak +1, haptic fires |
| Tracker mark | Square fills in grid, streak +1 |
| Budget entry | Entry appears in list, summary updates |
| Savings deposit | Progress bar moves, amount updates |
| Schedule complete | Task shows done, streak +1 |
| Journal save | Entry appears in list with "saving..." indicator |

**Conflict resolution on sync:** Server wins for reads. For completions/marks, use `ON CONFLICT DO NOTHING` (idempotent). For entries, use upsert with `updated_at` timestamp.

### Layer 4: Stale Indicator

When showing cached data, always show freshness:

```
┌──────────────────────────────────────┐
│  Habits                    ↻ 2h ago  │
│  (tap to refresh)                    │
└──────────────────────────────────────┘
```

**Rules:**
- `stale: false` → no indicator
- `stale: true, age < 1h` → subtle "2m ago" in header
- `stale: true, age 1-24h` → "Last updated 3h ago" banner
- `stale: true, age > 24h` → "Data may be outdated" warning

### Layer 5: Offline Lumi (client-side intelligence)

Port the backend's `lumiLocalRouter.js` pattern to the frontend. When offline, Lumi reads from cached data instead of the database:

```ts
// Frontend lumiLocalRouter — reads from cache, not DB
function tryLocalOffline(message, cachedData) {
  const t = message.toLowerCase();

  // "What's my schedule today?"
  if (/schedule|plan|agenda|what.*have/i.test(t) && /today/i.test(t)) {
    const schedules = cachedData.schedules || [];
    if (schedules.length === 0) return "Your today is clear — nothing scheduled.";
    const list = schedules.map(s => `• ${s.title} at ${fmtTime(s.start_time)}`).join('\n');
    return `Here's today:\n${list}`;
  }

  // "What did I spend today?"
  if (/spend|spent|expenses?|budget/i.test(t) && /today/i.test(t)) {
    const entries = cachedData.budgetEntries?.filter(e => isToday(e.entry_date)) || [];
    if (entries.length === 0) return "No expenses logged today.";
    const total = entries.reduce((s, e) => s + Number(e.amount), 0);
    return `Today you've spent ₦${total.toLocaleString()}:\n` +
      entries.map(e => `• ₦${Number(e.amount).toLocaleString()} ${e.category}`).join('\n');
  }

  // "What are my habits?"
  if (/habits?/i.test(t)) {
    const habits = cachedData.habits || [];
    const done = habits.filter(h => h.completedToday).length;
    return `Habits today (${done}/${habits.length}):\n` +
      habits.map(h => `${h.completedToday ? '✓' : '○'} ${h.title}`).join('\n');
  }

  // "How are my streaks?"
  if (/streak/i.test(t)) {
    const trackers = cachedData.trackers || [];
    return trackers.map(t => `${t.emoji} ${t.title}: ${t.streak} days`).join('\n') ||
      "No active trackers yet.";
  }

  return null; // nothing matched — show "Lumi needs internet for this"
}
```

**Offline Lumi UX:**
- Text input works
- Local router handles lookups (schedule, budget, habits, trackers)
- For anything that needs AI: "I need internet to think about that. But here's what I can tell you from your data: [cached summary]"
- Suggestion chips still show (they trigger local lookups)
- No voice input (needs Whisper)
- No empathetic tone (that needs the LLM) — just data

---

## PART 3 — FREEMIUM STRATEGY

### The Problem

Current free tier is too generous:
- 10,000 Lumi messages/day (effectively unlimited)
- 3 habits max (too restrictive for a habit app)
- Personal journal only (artificial limitation)

This means: free users never hit a limit (no conversion pressure), but habit users get frustrated at 3 (churn risk).

### The Fix: Gate Intelligence, Not Utility

**Principle:** The daily habit loop must be free and unlimited. That's what makes users come back. Gate the AI depth and premium features.

### Free Tier — What Every User Gets

| Feature | Limit | Why Free |
|---------|-------|---------|
| **Dashboard** | Unlimited | Command center — must work |
| **Habits** | **Unlimited** | The streak engine is the retention hook |
| **Trackers** | Unlimited | Same as habits — streaks keep users |
| **Journal — all types** | Unlimited | Reflection is core to the app's purpose |
| **Planner** | Unlimited | Daily structure is core |
| **Budget** | Unlimited | Financial awareness is core |
| **Savings goals** | Unlimited | Same |
| **Schedule** | Unlimited | Same |
| **Lumi — data lookups** | Unlimited | "What's my schedule?" / "How much did I spend?" — these are just cached reads |
| **Lumi — simple commands** | 15/day | "Add gym at 7am" / "Log gym" / "Track my workouts" — local router, zero AI cost, but limit to prevent abuse |
| **Lumi — AI chat** | **10/day** | Empathetic responses, complex reasoning — actual Groq cost |
| **Lumi — voice input** | 5/day | Whisper API cost |
| **Offline access** | Full | Cache + queue for all data |
| **Push notifications** | Basic (daily check-in, streak reminders) | Server cron, low cost |
| **Themes** | Dark + Coloured | Already built |
| **MFA** | Yes | Security should be free |

### Pro Tier — What Converts

| Feature | Pro | Why It's Worth Paying |
|---------|-----|----------------------|
| **Lumi — AI chat** | **100/day** | 10x the free limit for power users |
| **Lumi — voice input** | **50/day** | Voice is the premium input method |
| **Lumi — monthly reviews** | Unlimited | AI-generated insights from your data |
| **Lumi — life audit** | Full interview + schedule | The "plan my entire life" feature |
| **Lumi — memory extraction** | Yes | Lumi remembers your preferences long-term |
| **Lumi — smart nudges** | AI-timed notifications | "You usually journal at 9pm, want to write?" |
| **Lumi — pattern detection** | Yes | "You're most productive on Tuesdays" |
| **Cloud sync** | Cross-device, backup, restore | The #1 reason to pay for a life app |
| **Custom wallpapers** | Premium scenes | Personalization |
| **Priority AI** | Faster model (70b vs 8b) | Better responses |
| **Export** | PDF journals, financial reports | Take your data with you |
| **Gmail integration** | Send emails through Lumi | Connected accounts |
| **Content planner** | AI-generated social posts | Business feature |

### Pricing Psychology

| Tier | Price | Positioning |
|------|-------|-------------|
| **Free** | $0 | "PLOS is your daily companion. Unlimited habits, journal, planner, budget. Lumi helps with 10 AI conversations per day." |
| **Pro** | $9.99/month or $79.99/year | "Unlock Lumi's full intelligence. 100 AI conversations, monthly reviews, life audit, cloud sync." |
| **Trial** | 7-day Pro trial on signup | Let users experience the AI depth before gating it |

### Why This Works

1. **Habits are unlimited** — the streak engine is the retention hook. Users build streaks they don't want to break. This is free forever.
2. **Journal is unlimited** — all types. Reflection is the app's soul. Don't gate it.
3. **Budget is unlimited** — financial awareness is a core need. Don't gate it.
4. **Lumi data lookups are unlimited** — "What's my schedule?" costs nothing (local router, cached data). Users should never feel Lumi is broken.
5. **Lumi AI chat is limited to 10/day** — enough to feel useful, not enough for power users. This is the conversion lever.
6. **Cloud sync is Pro-only** — the single biggest reason to pay. Without it, your data lives on one device.

### Implementation Changes

**Backend (`checkTier.js`):**
```js
const FREE_LIMITS = {
  lumi_ai_messages_per_day: 10,      // actual Groq calls
  lumi_local_messages_per_day: 999,  // local router — effectively unlimited
  lumi_voice_per_day: 5,
  lumi_monthly_reviews: 0,           // pro only
  lumi_life_audit: false,            // pro only
  habits_max: 999,                   // unlimited (remove the 3-habit gate)
  journal_types: ['personal', 'spiritual', 'goals', 'business', 'wellness', 'budget'], // all free
  trackers_max: 999,                 // unlimited
  cloud_sync: false,                 // pro only
  export_pdf: false,                 // pro only
  custom_wallpapers: false,          // pro only
  smart_nudges: false,               // pro only
};

const PRO_LIMITS = {
  lumi_ai_messages_per_day: 100,
  lumi_local_messages_per_day: 999,
  lumi_voice_per_day: 50,
  lumi_monthly_reviews: 12,          // 1/month
  lumi_life_audit: true,
  habits_max: 999,
  journal_types: [...],              // same as free
  trackers_max: 999,
  cloud_sync: true,
  export_pdf: true,
  custom_wallpapers: true,
  smart_nudges: true,
};
```

**Key change:** Distinguish between `lumi_local` (local router, zero cost) and `lumi_ai` (Groq calls, real cost). The local router is free. The AI costs money.

**Frontend (`lumiLocalRouter.js` — new file):**
Port the backend's `tryLocal()` to the frontend. When a message matches a local pattern, handle it from cache without hitting the server. Only send to `/api/lumi/message` if local router returns null.

**Frontend (limit display):**
Show remaining AI messages: "3 of 10 AI conversations left today" — subtle, not aggressive. When at 0: "You've used your daily AI conversations. Upgrade to Pro for 100/day, or try asking Lumi a data question (unlimited)."

---

## PART 4 — WHAT STAYS FREE FOREVER

These features are the daily loop. They're what makes PLOS sticky. Never gate them:

1. **Unlimited habits** — the streak engine
2. **Unlimited trackers** — visual motivation
3. **All journal types** — reflection space
4. **Planner** — daily structure
5. **Budget** — financial awareness
6. **Savings goals** — financial goals
7. **Dashboard** — command center
8. **Offline access** — reliability
9. **Lumi data lookups** — "What's my schedule?" costs nothing
10. **Basic push notifications** — daily check-in, streak reminders
11. **Themes** — dark + coloured
12. **MFA** — security

---

## PART 5 — IMPLEMENTATION CHECKLIST

### Offline-First (do for mobile launch)

- [ ] Build `cachedFetch()` wrapper (web + native)
- [ ] Cache GET responses for: `/habits`, `/trackers`, `/budget/entries`, `/budget/summary`, `/savings`, `/schedule/today`, `/schedule`, `/journal/pages`, `/users/settings`
- [ ] Expand write queue to all write endpoints (16 new patterns)
- [ ] Show stale indicator in UI headers
- [ ] Port `lumiLocalRouter.js` to frontend for offline Lumi lookups
- [ ] Handle offline auth (show cached user, skip token refresh, show "offline mode" banner)
- [ ] Test: airplane mode → open app → see cached data → complete habit → queue flushes on reconnect

### Freemium (do for revenue)

- [ ] Update `checkTier.js` with new limits (see above)
- [ ] Distinguish `lumi_local` vs `lumi_ai` message counts
- [ ] Remove 3-habit limit
- [ ] Remove personal-only journal restriction
- [ ] Gate: monthly reviews, life audit, cloud sync, export, custom wallpapers, smart nudges
- [ ] Build "X of 10 AI conversations left today" indicator in Lumi UI
- [ ] Build upgrade prompt when limit hit
- [ ] Implement 7-day Pro trial on signup
- [ ] Build cloud sync (cross-device data) — this is the Pro killer feature

### Security (do before deploy)

- [ ] All items from `SECURITY_AUDIT.md` Part 6

---

## HONEST BOTTOM LINE

**Offline:** The app is closer than it looks. The write queue exists for 6 endpoints. The local Lumi router exists. Streak calculations are already client-side. The missing piece is read caching — wrap every GET in a `cachedFetch()` and the app works offline for all core features.

**Freemium:** The current model gates the wrong things. Habits at 3 is frustrating. Journal types restricted is artificial. Lumi at 10k/day is meaningless. The right model: unlimited utility (habits, journal, budget, planner), limited AI depth (10/day free, 100/day Pro), Pro-only cloud sync.

**The conversion story:** User builds habits for free → gets invested in streaks → wants Lumi's deeper insights → hits 10/day limit → upgrades. Or: user has data on one device → wants it on phone + laptop → upgrades for cloud sync.

Don't gate what makes the app sticky. Gate what makes it smarter.
