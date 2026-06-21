# PLOS — Native Mobile App Design & Architecture Spec

**Version:** 1.0 — June 2026
**Verified against:** Live Expo scaffolding (`PLOS/PLOS/PLOS/`) + web app (`frontend/`)

---

## TABLE OF CONTENTS

1. [Research Foundation](#1-research-foundation)
2. [Information Architecture](#2-information-architecture)
3. [Navigation Structure](#3-navigation-structure)
4. [Screen Inventory & Wireframes](#4-screen-inventory--wireframes)
5. [UI Design System](#5-ui-design-system)
6. [Component Library](#6-component-library)
7. [Motion & Haptics Guidelines](#7-motion--haptics-guidelines)
8. [Lumi on Native](#8-lumi-on-native)
9. [Native-Only Capabilities](#9-native-only-capabilities)
10. [Security](#10-security)
11. [Developer Implementation Plan](#11-developer-implementation-plan)
12. [Reuse Strategy](#12-reuse-strategy)

---

## 1. RESEARCH FOUNDATION

### 1.1 Apps Studied

| Category | Apps | Key Takeaway |
|----------|------|--------------|
| Productivity | Notion, Sunsama, Todoist, TickTick, Motion | One focal thing per screen. Today-first. |
| Journaling | Day One, Stoic, Reflectly | Speed of capture is sacred. Warm typography. |
| Budget | YNAB, Copilot, Rocket Money | Summary first, details on demand. Color = info. |
| Habits | Streaks, Habitify, Productive | One-tap complete. Streak > percentage. |
| AI Companions | ChatGPT, Pi AI, Replika | Conversation-first. Suggested prompts. Memory = trust. |

### 1.2 Research-Backed Decisions

| Decision | Why | Source |
|----------|-----|--------|
| **5 tabs maximum** | Beyond 5, touch targets shrink below 44pt and labels become unreadable | Apple HIG, Material Design |
| **Lumi gets her own tab** | AI companions that are buried in menus get forgotten. A dedicated tab = daily engagement | NN/g: visible nav gets 48-50% usage vs 27% for hidden |
| **One-tap habit completion** | Every extra tap between intent and action is friction that kills streaks | Streaks app design research |
| **Journal = warm serif** | Serif fonts signal "personal, reflective space" vs sans-serif which signals "utility" | Day One, Stoic typography research |
| **Budget: categories first** | Users want "can I afford this?" not a transaction list. Category-first answers that in one glance | YNAB, Copilot UX |
| **Progressive disclosure everywhere** | Show summary → details on demand. Reduces cognitive load by ~40% | Nielsen Norman Group |
| **Bottom nav, not drawer** | Hidden navigation leads to 21% higher perceived difficulty, 15-39% slower task times | NN/g mobile nav study |

### 1.3 What the Native App Is NOT

- NOT a webview wrapper
- NOT a feature-complete port of every web page
- NOT a dashboard that shows everything at once

It IS:
- A calm, one-handed daily companion
- Lumi-first (she's the reason PLOS exists)
- Fast capture, warm reflection
- A life operating system that fits in your pocket

---

## 2. INFORMATION ARCHITECTURE

### 2.1 Mobile IA — What Belongs Where

```
PLOS Mobile
├── DAILY LOOP (used multiple times/day)
│   ├── Home (Dashboard) — command center, one-glance day
│   ├── Lumi — talk, ask, plan, log, reflect
│   └── Habits — check in, streak, celebrate
│
├── CAPTURE (used 1-3x/day)
│   ├── Journal — write, reflect, attach
│   └── Planner — today/week, time blocks
│
├── REVIEW (used 1-3x/week)
│   └── Budget — spend log, categories, goals
│
└── PERIPHERY (used rarely)
    ├── Profile / Settings
    ├── Billing / Upgrade
    └── Account / MFA
```

### 2.2 What Gets Surfaced vs Hidden

| Feature | Mobile Treatment | Rationale |
|---------|-----------------|-----------|
| Dashboard | **Tab** — Home | Used every app open |
| Lumi (AI) | **Tab** — center, elevated | Core value prop, needs to be one tap |
| Habits | **Tab** | Multiple daily interactions |
| Journal | **Tab** | Daily capture |
| Planner | **Tab** | Daily planning/checking |
| Budget | **Card on Home + push from Lumi** | Important but not daily-driver. Accessible from Home card and via Lumi conversation |
| Trackers | **Section in Habits tab** | Related to habits, no separate tab needed |
| Calendar | **Deep link from Planner** | Low-frequency on mobile |
| Year Plan | **Deep link from Planner** | Low-frequency on mobile |
| Settings | **Profile icon → sheet** | Rarely changed |
| Billing | **Card on Home + Settings** | Discovery, not configuration |
| Contacts/Books/Projects/Jobs | **Web-only** | Low-frequency, complex CRUD |

### 2.3 Conversational Delegation to Lumi

Instead of building full mobile screens for low-frequency features, Lumi handles them conversationally:

| Feature | How Lumi Handles It |
|---------|-------------------|
| Log expense | "I spent 2500 on food" → Lumi logs it, confirms with a card |
| Create journal entry | "Write that I had a great day" → Lumi drafts, saves to journal |
| Check budget | "How much have I spent this week?" → Lumi shows summary card |
| Plan tomorrow | "Plan my day tomorrow" → Lumi generates time blocks |
| Review habits | "How are my streaks?" → Lumi shows tracker grid |
| Set reminder | "Remind me to call mom at 5pm" → Lumi schedules notification |

**Principle:** If it takes <30 seconds and doesn't need a full screen, Lumi does it.

---

## 3. NAVIGATION STRUCTURE

### 3.1 Bottom Tab Bar — 5 Tabs, Lumi Centered

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   ◈ Home    📅 Planner    ✦ Lumi    📖 Journal    🔥 Habits  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Why this order:**
- **Home** (far left): Universal convention. First thing users look for.
- **Planner** (second): Daily planning is the second most frequent action.
- **Lumi** (center): The heart of PLOS. Elevated with amber ring, LumiFace eyes visible. Center position = easiest one-thumb reach.
- **Journal** (fourth): Capture is daily but less frequent than planning.
- **Habits** (far right): Quick check-ins, complements the daily loop.

**Why Budget and Profile are NOT tabs:**
- Budget is used 1-3x/week, not hourly. A card on Home + Lumi conversation covers 90% of use.
- Profile/Settings is rarely opened. Goes behind a gear icon or "More" sheet.

### 3.2 Tab Bar Design

```
┌─────────────────────────────────────────────────────┐
│  ┌───┐   ┌───┐   ┌─────┐   ┌───┐   ┌───┐          │
│  │ ◈ │   │ 📅│   │ ✦  │   │ 📖│   │ 🔥│          │
│  └───┘   └───┘   └─────┘   └───┘   └───┘          │
│  Home   Planner    Lumi    Journal  Habits          │
└─────────────────────────────────────────────────────┘
```

- **Background:** `#0D0D16` (deep dark, matches web sidebar)
- **Active indicator:** `#C8955C` (warm amber) — icon tint + subtle underline dot
- **Inactive:** `#5F5E5A` (warm gray)
- **Labels:** Hidden (icons carry the meaning; LumiFace is self-explanatory)
- **Height:** 65pt (standard iOS tab bar height)
- **Lumi center button:** 52pt circle, amber ring (`#C8955C`), elevated 8pt above bar, contains animated LumiFace eyes (mood-reactive: resting normally, thinking when processing)

### 3.3 Route Structure (Expo Router)

```
app/
  _layout.tsx                    # Root: auth gate, theme, SafeArea, StatusBar
  (auth)/
    _layout.tsx                  # Auth stack
    login.tsx                    # Login screen
    register.tsx                 # Register screen
  (tabs)/
    _layout.tsx                  # 5-tab bar (Home, Planner, Lumi, Journal, Habits)
    index.tsx                    # Home (Dashboard)
    planner/
      index.tsx                  # Planner — Today/Week/Year segmented
      [date].tsx                 # Day detail (pushes on stack)
    lumi/
      index.tsx                  # Talk to Lumi — full chat screen
    journal/
      index.tsx                  # Journal bookshelf → entry list
      [id].tsx                   # Entry detail / compose
    habits/
      index.tsx                  # Habits + Tracker grids
      trackers.tsx               # Full tracker view
      [id].tsx                   # Habit detail
  budget/
    _layout.tsx                  # Budget stack (accessed from Home card)
    index.tsx                    # Budget overview
  profile/
    _layout.tsx                  # Profile stack (accessed from Home)
    index.tsx                    # Profile + Settings
    settings.tsx                 # Full settings
    upgrade.tsx                  # Billing/upgrade
```

### 3.4 Modal/Sheet Presentations

These screens present as native bottom sheets or modals (not full tab switches):

- **Add Task** — bottom sheet from Planner
- **Log Expense** — bottom sheet from Budget or Lumi conversation
- **New Journal Entry** — full-screen modal (compose)
- **Habit Completion** — celebration modal (identity vote)
- **Lumi Voice** — inline in Lumi screen (not a separate modal)

---

## 4. SCREEN INVENTORY & WIREFRAMES

### 4.1 Home (Dashboard) — `(tabs)/index`

**Purpose:** One-glance command center. What do I need to know and do right now?

**Wireframe:**
```
┌──────────────────────────────────────────┐
│ Safe Area                                 │
│                                           │
│  Good Morning, David          [⚙️ profile]│
│  Tuesday, June 17                         │
│                                           │
│ ┌──────────────────────────────────────┐  │
│ │  Today's Focus                       │  │
│ │  "Deep work on the PLOS redesign"    │  │
│ │  (editable, Lumi-suggested)          │  │
│ └──────────────────────────────────────┘  │
│                                           │
│ ┌──────────────┐ ┌──────────────┐         │
│ │ 🔥 3 streaks │ │ 📅 Next: 2pm │         │
│ │  active      │ │  Team call   │         │
│ └──────────────┘ └──────────────┘         │
│                                           │
│ ┌──────────────────────────────────────┐  │
│ │  LUMI NUDGE                          │  │
│ │  "You've been crushing your water    │  │
│ │   streak. 3 more days for a record." │  │
│ │  [Talk to Lumi →]                    │  │
│ └──────────────────────────────────────┘  │
│                                           │
│ ┌──────────────┐ ┌──────────────┐         │
│ │ 📖 Journal   │ │ 💰 Budget    │         │
│ │ 2 entries    │ │ ₦12,500 left │         │
│ │ this week    │ │ this week    │         │
│ │ [Write →]    │ │ [View →]     │         │
│ └──────────────┘ └──────────────┘         │
│                                           │
│ ┌──────────────────────────────────────┐  │
│ │ TODAY'S HABITS (mini grid)           │  │
│ │ ● Bible  ● Water  ○ Reading         │  │
│ │ ○ Exercise  ● Journal               │  │
│ └──────────────────────────────────────┘  │
│                                           │
│ ┌──────────────────────────────────────┐  │
│ │ QUICK ACTIONS                        │  │
│ │ [+ Expense] [+ Entry] [Talk to Lumi] │  │
│ └──────────────────────────────────────┘  │
│                                           │
│            [Tab Bar]                      │
└──────────────────────────────────────────┘
```

**Sections:**
1. **Header** — Greeting (serif, time-aware) + date + profile gear icon
2. **Today's Focus** — One sentence, Lumi-suggested or user-set. The focal point.
3. **Quick Stats Row** — Streak count + next schedule item. Two cards, side by side.
4. **Lumi Nudge** — Personalized insight from Lumi. Warm, encouraging. Tappable → Lumi chat.
5. **Module Cards** — Journal (entries this week, write CTA) + Budget (remaining, view CTA). Tappable → their screens.
6. **Today's Habits** — Mini grid of today's habits. Tap to complete (haptic). No full habit screen needed here.
7. **Quick Actions** — Chips for common actions: + Expense, + Entry, Talk to Lumi.

**Empty State (new user):**
```
┌──────────────────────────────────────────┐
│                                           │
│  Welcome to PLOS, David                   │
│                                           │
│  ┌────────────────────────────────────┐   │
│  │  ✦ Hi, I'm Lumi.                  │   │
│  │  I'm your life companion.         │   │
│  │  Let me help you get started.     │   │
│  │                                   │   │
│  │  [Plan my life →]                 │   │
│  │  [Start a streak →]              │   │
│  │  [Write a line →]                │   │
│  │  [Log an expense →]              │   │
│  └────────────────────────────────────┘   │
│                                           │
└──────────────────────────────────────────┘
```

**Data sources:** `/schedule/today`, `/trackers`, `/lumi` (greeting/nudge), `/journal/pages/today`, `/budget/summary`

---

### 4.2 Lumi (Talk to Lumi) — `(tabs)/lumi`

**Purpose:** The flagship screen. Conversational AI companion. One tap to talk, type, or ask.

**Wireframe:**
```
┌──────────────────────────────────────────┐
│ Safe Area                                 │
│                                           │
│  ← Back    ✦ Lumi    [🧠 12 memories]    │
│                                           │
│ ┌──────────────────────────────────────┐  │
│ │                                      │  │
│ │         [LumiFace — 120px]           │  │
│ │         (resting mood, breathing)    │  │
│ │                                      │  │
│ └──────────────────────────────────────┘  │
│                                           │
│ ┌──────────────────────────────────────┐  │
│ │ Good morning, David. You've got      │  │
│ │ 3 things planned today. Want me to   │  │
│ │ walk you through them?               │  │
│ └──────────────────────────────────────┘  │
│                                           │
│          ┌─────────────────────┐          │
│          │ Plan my day         │          │
│          └─────────────────────┘          │
│          ┌─────────────────────┐          │
│          │ How are my streaks? │          │
│          └─────────────────────┘          │
│          ┌─────────────────────┐          │
│          │ I spent ₦2500 on food│         │
│          └─────────────────────┘          │
│          ┌─────────────────────┐          │
│          │ Write a journal entry│         │
│          └─────────────────────┘          │
│                                           │
│ ┌──────────────────────────────────────┐  │
│ │  You: I had a really productive day  │  │
│ │       today, finished the redesign   │  │
│ └──────────────────────────────────────┘  │
│                                           │
│ ┌──────────────────────────────────────┐  │
│ │  ✦ That's wonderful, David. Finishing│  │
│ │  a redesign takes real discipline.   │  │
│ │  Want me to save this as a journal   │  │
│ │  entry?                              │  │
│ │  [Yes, save it]  [Not now]           │  │
│ └──────────────────────────────────────┘  │
│                                           │
│ ┌────────────────────────────────────┐    │
│ │ 🎤  Type a message...        [→]  │    │
│ └────────────────────────────────────┘    │
│            [Tab Bar]                      │
└──────────────────────────────────────────┘
```

**States:**
- **Idle:** LumiFace resting (warm gold eyes, gentle breathing glow)
- **Listening:** LumiFace listening (teal eyes, pulse animation), recording indicator
- **Processing:** LumiFace thinking (blue eyes, smaller pupils, typing dots below)
- **Speaking:** LumiFace resting (TTS audio plays, subtle wave visualization)

**Features:**
- Text input (primary)
- Voice input (mic button → expo-av recording → whisper transcription)
- Suggestion chips (context-aware: based on time of day, recent activity)
- Confirmation cards (journal save, expense logged, plan created)
- Memory count in header (trust signal)
- Scrollable conversation history

**Suggestion Chip Logic:**
- Morning: "Plan my day", "What should I focus on?"
- Afternoon: "How are my streaks?", "Log an expense"
- Evening: "Reflect on today", "Write a journal entry"
- After habit completion: "Great job! Want to journal about it?"
- After journal: "Want me to plan tomorrow based on this?"

---

### 4.3 Planner — `(tabs)/planner`

**Purpose:** What's happening today, this week, this year. Time-blocked planning.

**Wireframe (Today view):**
```
┌──────────────────────────────────────────┐
│ Safe Area                                 │
│                                           │
│  Planner                                  │
│  [Today]  [Week]  [Year]                  │
│                                           │
│  ┌──────────────────────────────────────┐ │
│  │ 6:00 AM                              │ │
│  │ ┌──────────────────────────────────┐ │ │
│  │ │ 🌅 Morning routine               │ │ │
│  │ │    30 min                        │ │ │
│  │ └──────────────────────────────────┘ │ │
│  │                                      │ │
│  │ 7:00 AM                              │ │
│  │ ┌──────────────────────────────────┐ │ │
│  │ │ 💻 Deep work — PLOS redesign     │ │ │
│  │ │    2 hours · ● in progress       │ │ │
│  │ └──────────────────────────────────┘ │ │
│  │                                      │ │
│  │ ─ ─ ─ ─ ─ NOW ─ ─ ─ ─ ─ ─ ─ ─ ─   │ │
│  │                                      │ │
│  │ 10:00 AM                             │ │
│  │ ┌──────────────────────────────────┐ │ │
│  │ │ 📞 Team standup                  │ │ │
│  │ │    30 min                        │ │ │
│  │ └──────────────────────────────────┘ │ │
│  │                                      │ │
│  │ 2:00 PM                              │ │
│  │ ┌──────────────────────────────────┐ │ │
│  │ │ 📖 Reading block                 │ │ │
│  │ │    1 hour                        │ │ │
│  │ └──────────────────────────────────┘ │ │
│  └──────────────────────────────────────┘ │
│                                           │
│            [Tab Bar]                      │
└──────────────────────────────────────────┘
```

**Wireframe (Week view):**
```
┌──────────────────────────────────────────┐
│ Safe Area                                 │
│                                           │
│  Planner                                  │
│  [Today]  [Week]  [Year]                  │
│                                           │
│  Mon 16  Tue 17  Wed 18  Thu 19  Fri 20  │
│   ●●○     ●●●     ○○○     ●○○     ●●○    │
│                                           │
│  ┌──────────────────────────────────────┐ │
│  │ Tuesday, June 17                     │ │
│  │                                      │ │
│  │ ● 6:00  Morning routine              │ │
│  │ ● 7:00  Deep work (2h)               │ │
│  │ ○ 10:00 Team standup                 │ │
│  │ ○ 2:00  Reading                      │ │
│  │ ○ 6:00  Evening wind-down            │ │
│  │                                      │ │
│  │ Habits today: ●●●○○ (3/5)            │ │
│  └──────────────────────────────────────┘ │
│                                           │
│            [Tab Bar]                      │
└──────────────────────────────────────────┘
```

**Segmented control:** Today / Week / Year (swipeable)
- **Today:** Time-blocked timeline with "now" line. Tap block → complete (haptic + optimistic update).
- **Week:** 7-day strip with habit dots + selected day's schedule below.
- **Year:** Month grid. Colored dots per day = activity level. Tap month → month detail.

**Data sources:** `/schedule`, `/goals`, `/habits`

---

### 4.4 Habits + Trackers — `(tabs)/habits`

**Purpose:** Daily check-ins, streak tracking, the "trick" that keeps people coming back.

**Wireframe:**
```
┌──────────────────────────────────────────┐
│ Safe Area                                 │
│                                           │
│  Habits                    [+ Add]        │
│                                           │
│  ┌──────────────────────────────────────┐ │
│  │ TODAY · Tuesday, June 17             │ │
│  │                                      │ │
│  │ ┌──────────────────────────────────┐ │ │
│  │ │ 📖 Bible Reading          🔥 12  │ │ │
│  │ │    Streak: 12 days               │ │ │
│  │ │    [═══════════════○] 12/14 goal │ │ │
│  │ └──────────────────────────────────┘ │ │
│  │                                      │ │
│  │ ┌──────────────────────────────────┐ │ │
│  │ │ 💧 Drink 2L Water         🔥 8   │ │ │
│  │ │    Streak: 8 days                │ │ │
│  │ │    [═════════○○○○○○○] 1/2 today  │ │ │
│  │ └──────────────────────────────────┘ │ │
│  │                                      │ │
│  │ ┌──────────────────────────────────┐ │ │
│  │ │ 📚 Reading (30 min)       🔥 15  │ │ │
│  │ │    Streak: 15 days               │ │ │
│  │ │    [═══════════════════○] done?  │ │ │
│  │ └──────────────────────────────────┘ │ │
│  │                                      │ │
│  │ ┌──────────────────────────────────┐ │ │
│  │ │ 🏋️ Exercise               🔥 5   │ │ │
│  │ │    Streak: 5 days                │ │ │
│  │ │    [══════○○○○○○○○○○○] not yet   │ │ │
│  │ └──────────────────────────────────┘ │ │
│  └──────────────────────────────────────┘ │
│                                           │
│  ┌──────────────────────────────────────┐ │
│  │ TRACKERS (streak grids)              │ │
│  │                                      │ │
│  │ Bible   ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░ 12    │ │
│  │ Water   ▓▓▓▓▓▓▓▓░░░░░░░░░░░░  8    │ │
│  │ Reading ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░ 15    │ │
│  │ Exercise▓▓▓▓▓░░░░░░░░░░░░░░░  5    │ │
│  │ Journal ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░ 21    │ │
│  │                                      │ │
│  │ [View all trackers →]                │ │
│  └──────────────────────────────────────┘ │
│                                           │
│            [Tab Bar]                      │
└──────────────────────────────────────────┘
```

**Interaction:**
- **Tap habit card** → marks complete. Haptic feedback. Card animates (checkmark appears, streak counter ticks up, brief celebration).
- **Long-press habit card** → options (edit, skip today, view history).
- **Tracker grid** → GitHub-style streak visualization. Each square = one day. Filled = done. Color intensity = streak length.
- **Streak at risk** → notification at configured time if habit not completed today.

**Completion Celebration (identity vote modal):**
```
┌──────────────────────────────────────────┐
│                                           │
│         ✓ Bible Reading                   │
│                                           │
│         🔥 13 day streak                  │
│                                           │
│  "You're the kind of person who           │
│   starts the day with purpose."           │
│                                           │
│         [Continue]                        │
│                                           │
└──────────────────────────────────────────┘
```

**Data sources:** `/habits`, `/trackers`

---

### 4.5 Journal — `(tabs)/journal`

**Purpose:** Write, reflect, capture. Warm and personal.

**Wireframe (Bookshelf):**
```
┌──────────────────────────────────────────┐
│ Safe Area                                 │
│                                           │
│  Journal                   [+ New Entry]  │
│                                           │
│  ┌──────────────────────────────────────┐ │
│  │  📖 Personal              23 entries │ │
│  │  "Reflections on life"               │ │
│  │  Last: 2 hours ago                   │ │
│  └──────────────────────────────────────┘ │
│                                           │
│  ┌──────────────────────────────────────┐ │
│  │  🙏 Spiritual              15 entries│ │
│  │  "Faith and growth"                  │ │
│  │  Last: Yesterday                     │ │
│  └──────────────────────────────────────┘ │
│                                           │
│  ┌──────────────────────────────────────┐ │
│  │  🎯 Goals                   8 entries│ │
│  │  "Progress and plans"                │ │
│  │  Last: 3 days ago                    │ │
│  └──────────────────────────────────────┘ │
│                                           │
│  ┌──────────────────────────────────────┐ │
│  │  💰 Budget                  5 entries│ │
│  │  "Financial reflections"             │ │
│  │  Last: 1 week ago                    │ │
│  └──────────────────────────────────────┘ │
│                                           │
│            [Tab Bar]                      │
└──────────────────────────────────────────┘
```

**Wireframe (Compose — full-screen modal):**
```
┌──────────────────────────────────────────┐
│ Safe Area                                 │
│                                           │
│  ← Back    Personal       [📎] [✓ Save]  │
│                                           │
│  ┌──────────────────────────────────────┐ │
│  │                                      │ │
│  │  Today I realized something          │ │
│  │  important about the way I approach  │ │
│  │  my mornings. The routine I built    │ │
│  │  last week is actually working...    │ │
│  │                                      │ │
│  │  (cursor blinking)                   │ │
│  │                                      │ │
│  │                                      │ │
│  │                                      │ │
│  │                                      │ │
│  │                                      │ │
│  └──────────────────────────────────────┘ │
│                                           │
│  ┌──────────────────────────────────────┐ │
│  │  📷 Photo  😊 Mood  🏷️ Tags         │ │
│  └──────────────────────────────────────┘ │
│                                           │
└──────────────────────────────────────────┘
```

**Features:**
- Bookshelf = journal types (personal, spiritual, goals, budget, wellness, business)
- Each book → entry list (snippets with date)
- Compose = full-screen modal with minimal chrome
- Auto-save every 5 seconds
- Camera attachment (expo-camera / image picker)
- Mood selector (emoji row)
- Per-type accent color (personal=amber, spiritual=purple, goals=blue, etc.)

**Data sources:** `/journal`, `/journal/pages`

---

### 4.6 Budget — `budget/` (off-tab, accessed from Home)

**Purpose:** Where does my money go? Quick logging, category overview.

**Wireframe:**
```
┌──────────────────────────────────────────┐
│ Safe Area                                 │
│                                           │
│  ← Home    Budget              [+ Add]   │
│                                           │
│  ┌──────────────────────────────────────┐ │
│  │  THIS WEEK                           │ │
│  │  ₦47,500 spent    ₦12,500 remaining  │ │
│  │  [═════════════════○○○] 79%          │ │
│  └──────────────────────────────────────┘ │
│                                           │
│  ┌──────────────────────────────────────┐ │
│  │  CATEGORIES                          │ │
│  │                                      │ │
│  │  🍽️ Food      ₦18,500  [████████░░] │ │
│  │  🚗 Transport ₦12,000  [██████░░░░] │ │
│  │  🛒 Groceries ₦ 8,500  [████░░░░░░] │ │
│  │  🎮 Fun       ₦ 5,000  [███░░░░░░░] │ │
│  │  📦 Other     ₦ 3,500  [██░░░░░░░░] │ │
│  └──────────────────────────────────────┘ │
│                                           │
│  ┌──────────────────────────────────────┐ │
│  │  RECENT                              │ │
│  │  Today  Lunch — ₦2,500    Food       │ │
│  │  Today  Uber — ₦1,800     Transport  │ │
│  │  Y'day  Netflix — ₦4,500  Fun        │ │
│  └──────────────────────────────────────┘ │
│                                           │
│  ┌──────────────────────────────────────┐ │
│  │  SAVINGS GOALS                       │ │
│  │  🏠 New apartment  ₦200k/₦500k      │ │
│  │     [████████░░░░░░░░░░] 40%         │ │
│  └──────────────────────────────────────┘ │
│                                           │
│  ┌──────────────────────────────────────┐ │
│  │  💬 Ask Lumi about your budget       │ │
│  │  "How much did I spend on food       │ │
│  │   this month?"  [Ask →]              │ │
│  └──────────────────────────────────────┘ │
│                                           │
└──────────────────────────────────────────┘
```

**Data sources:** `/budget`, `/savings`

---

### 4.7 Profile / Settings — `profile/` (off-tab, accessed from Home gear icon)

**Purpose:** Account, preferences, billing. Rarely visited.

**Wireframe:**
```
┌──────────────────────────────────────────┐
│ Safe Area                                 │
│                                           │
│  ← Home    Profile                        │
│                                           │
│  ┌──────────────────────────────────────┐ │
│  │  👤 David O.                         │ │
│  │  david@example.com                   │ │
│  │  Free Plan                           │ │
│  │  [Upgrade to Pro →]                  │ │
│  └──────────────────────────────────────┘ │
│                                           │
│  ┌──────────────────────────────────────┐ │
│  │  SETTINGS                            │ │
│  │                                      │ │
│  │  🔔 Notifications        [→]        │ │
│  │  🎨 Theme                [Dark ▾]   │ │
│  │  🔊 Lumi's Voice         [→]        │ │
│  │  🔒 Biometric Lock       [Off ▾]    │ │
│  │  🔐 MFA Setup            [→]        │ │
│  │  📱 App Version          1.0.0      │ │
│  └──────────────────────────────────────┘ │
│                                           │
│  ┌──────────────────────────────────────┐ │
│  │  [Logout]                            │ │
│  └──────────────────────────────────────┘ │
│                                           │
└──────────────────────────────────────────┘
```

---

### 4.8 Auth Screens — `(auth)/`

**Purpose:** Login / Register. Brand-aligned, LumiFace welcome.

**Wireframe (Login):**
```
┌──────────────────────────────────────────┐
│ Safe Area                                 │
│                                           │
│                                           │
│                                           │
│         [LumiFace — 80px]                 │
│         (resting, warm glow)              │
│                                           │
│              PLOS                         │
│         Your life. Organized.             │
│                                           │
│  ┌──────────────────────────────────────┐ │
│  │  Email                               │ │
│  └──────────────────────────────────────┘ │
│                                           │
│  ┌──────────────────────────────────────┐ │
│  │  Password                    👁️      │ │
│  └──────────────────────────────────────┘ │
│                                           │
│  ┌──────────────────────────────────────┐ │
│  │            LOG IN                     │ │
│  └──────────────────────────────────────┘ │
│                                           │
│  Don't have an account? Register          │
│                                           │
└──────────────────────────────────────────┘
```

---

## 5. UI DESIGN SYSTEM

### 5.1 Color Palette

Replace `constants/colors.ts` with the brand-aligned palette:

```ts
export const Colors = {
  // Surfaces — calm, deep, woody
  background:    '#0A0A0F',      // page background
  surface:       '#13131A',      // secondary surfaces
  card:          '#1C1C27',      // card backgrounds
  border:        'rgba(255,255,255,0.07)',

  // Brand — warm wood amber (matches web C.amber)
  amber:         '#C8955C',      // primary accent
  amberSoft:     '#DBA870',      // hover/active states
  amberMuted:    'rgba(200,149,92,0.12)',

  // Lumi — her identity
  lumiGold:      '#D6B85A',      // Lumi's eyes (resting)
  lumiGoldLite:  '#F1D98A',      // Lumi's eyes (bright)
  lumiThinking:  '#5B9BD6',      // Lumi thinking state
  lumiListening: '#3FC7AC',      // Lumi listening state

  // Domain accents (used sparingly)
  teal:          '#00D4AA',      // progress / done / health
  purple:        '#8B5CF6',      // Lumi's voice / spiritual
  green:         '#4CAF7D',      // budget positive
  blue:          '#7AAEE8',      // planning
  rose:          '#F472B6',
  coral:         '#E05252',      // errors / negative

  // Text hierarchy
  textPrimary:   '#E8E8F0',      // headings, body
  textSecondary: '#9A9AAA',      // labels, captions
  textMuted:     'rgba(255,255,255,0.4)',

  // Tab bar
  tabBar:        '#0D0D16',
  tabActive:     '#C8955C',      // amber, NOT blue
  tabInactive:   '#5F5E5A',

  // White (for buttons on dark)
  white:         '#FFFFFF',
};

// Journal type accents (per book)
export const JournalColors = {
  personal:      '#C8955C',      // amber
  spiritual:     '#9B7FD4',      // muted purple
  budget:        '#5BA88A',      // sage
  wellness:      '#7ABFB8',      // soft teal
  goals:         '#7AAEE8',      // muted blue
  business:      '#D4A06A',      // sienna
};

// Habit/tracker domain colors
export const HabitColors = {
  bible:         '#C8955C',
  hydration:     '#7AAEE8',
  reading:       '#9B7FD4',
  exercise:      '#4CAF7D',
  prayer:        '#C8955C',
  journal:       '#C8955C',
  sleep:         '#9B7FD4',
  focus:         '#E05252',
};
```

**Why this palette:**
- `#C8955C` amber is the verified web primary accent. It reads as "warm, woody, premium."
- Tab active is amber, not blue. Blue tabs made the app look like a different product.
- Lumi's gold (`#D6B85A`) and thinking blue (`#5B9BD6`) match the web LumiFace moods exactly.
- Domain accents are earth-toned (teal, sage, muted purple) — not neon.

### 5.2 Typography

```ts
export const Typography = {
  hero:     { fontSize: 36, fontWeight: '700' as const, fontFamily: 'serif' },
  title:    { fontSize: 24, fontWeight: '600' as const },
  subtitle: { fontSize: 18, fontWeight: '500' as const },
  body:     { fontSize: 16, fontWeight: '400' as const },
  caption:  { fontSize: 13, fontWeight: '400' as const },
  micro:    { fontSize: 11, fontWeight: '500' as const },
};
```

**Font choices:**
- **Hero / Lumi's spoken lines:** System serif (Georgia on iOS, Noto Serif on Android). Creates warmth. Matches web's `DM Serif Display`.
- **Everything else:** System default (SF Pro on iOS, Roboto on Android). Clean, native feel.
- **Two weights only:** 400 (body) and 500-600 (emphasis). No hairline, no black.

### 5.3 Spacing & Shape

```ts
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,     // chips, pills
  full: 999,  // circular
};
```

**Rules:**
- Minimum touch target: 44×44pt (Apple HIG)
- Card padding: 16pt
- Section spacing: 24pt
- Input height: 54pt
- Icon size: 24pt (nav), 20pt (inline)

### 5.4 Card Style (Glass Effect)

The web uses glass-morphism cards. On native, approximate with:

```ts
export const CardStyle = {
  backgroundColor: 'rgba(28, 28, 39, 0.90)',  // card with slight transparency
  borderRadius: 16,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.07)',
  padding: 16,
  // Note: backdrop-filter blur is not available on RN
  // Use solid backgrounds with subtle transparency instead
};
```

### 5.5 Theme System

Two themes (matching web):

| Token | Dark (default) | Coloured |
|-------|---------------|----------|
| background | `#0A0A0F` | `#0F0804` |
| surface | `#13131A` | `#1A0F08` |
| card | `#1C1C27` | `#231608` |
| amber | `#C8955C` | `#D4A06A` |
| textPrimary | `#E8E8F0` | `#F5EDE2` |

Store theme preference in AsyncStorage (`plos_theme`). Apply via a `ThemeProvider` context that all screens consume.

---

## 6. COMPONENT LIBRARY

### 6.1 Components to Build

| Component | Purpose | Used In |
|-----------|---------|---------|
| `LumiFace` | Animated Reanimated eyes (5 moods) | Lumi screen, center tab, auth |
| `GlassCard` | Card with border + shadow | Every screen |
| `HabitCard` | Habit check-in with streak + tap-to-complete | Habits, Home |
| `TrackerGrid` | GitHub-style streak grid | Habits, Home |
| `StreakCounter` | Animated number with fire emoji | Habits, Home |
| `QuickActionChip` | Tappable chip for common actions | Home, Lumi |
| `SegmentedControl` | Today/Week/Year tabs | Planner |
| `TimelineBlock` | Time-blocked schedule item | Planner (Today) |
| `DayStrip` | 7-day horizontal strip | Planner (Week) |
| `MonthGrid` | Calendar month view | Planner (Year) |
| `JournalBookCard` | Journal type entry | Journal |
| `EntrySnippet` | Journal entry preview | Journal |
| `BudgetCategoryRow` | Category + amount + progress bar | Budget |
| `SavingsGoalCard` | Goal with progress ring | Budget, Home |
| `LumiNudge` | Personalized insight card | Home |
| `FocusCard` | Today's focus (editable) | Home |
| `GreetingHeader` | Time-aware greeting + date | Home |
| `CelebrationModal` | Habit completion identity vote | Habits |
| `ConfirmationCard` | Lumi's action confirmations | Lumi |
| `SuggestionChip` | Lumi's suggested prompts | Lumi |
| `BottomSheet` | Native bottom sheet wrapper | Various |
| `ProgressBar` | Linear progress indicator | Budget, Habits |
| `ProgressRing` | Circular progress indicator | Home, Habits |

### 6.2 Component Specifications

#### LumiFace (native)

```tsx
interface LumiFaceProps {
  mood: 'resting' | 'thinking' | 'happy' | 'listening' | 'concerned';
  size?: number;           // default 96
  showOrb?: boolean;       // dark circle backdrop, default true
  subtle?: boolean;        // extra-quiet mode for icons
  tint?: 'gold' | 'blue' | 'teal' | 'purple' | 'green';  // override mood color
}
```

Built with `react-native-reanimated` 4. Two `Animated.View` eyes with:
- **Blink:** `scaleY` from 1 → 0.05 → 1, every 3-5 seconds (randomized)
- **Breathe:** `opacity` and `shadowRadius` pulse on the orb backdrop
- **Thinking:** smaller pupils, blue tint, look-up translation
- **Happy:** crescent shapes (clip-path or border-radius tricks)
- **Listening:** teal tint, pulse scale animation

Honor `AccessibilityInfo.isReduceMotionEnabled()` — disable all animations when true.

#### HabitCard

```tsx
interface HabitCardProps {
  name: string;
  icon: string;            // emoji
  color: string;           // domain accent
  streak: number;
  completed: boolean;
  onToggle: () => void;
  onLongPress?: () => void;
}
```

- Tap → `onToggle()` + haptic (medium impact) + checkmark animation
- Streak counter with fire emoji, number animates on change
- Progress bar under the card (if goal exists)

#### TrackerGrid

```tsx
interface TrackerGridProps {
  data: boolean[];         // last N days, true = done
  color: string;
  label: string;
  streak: number;
}
```

- Horizontal scroll of squares (7 columns visible, scroll for history)
- Filled = color, empty = `rgba(255,255,255,0.06)`
- Streak counter to the right

---

## 7. MOTION & HAPTICS GUIDELINES

### 7.1 Reanimated Animations

| Animation | Trigger | Duration | Easing |
|-----------|---------|----------|--------|
| LumiFace blink | Random 3-5s interval | 150ms | ease-out |
| LumiFace breathe | Continuous | 3s cycle | sine |
| Habit complete | Tap | 300ms | spring (damping: 15) |
| Streak tick | Number change | 200ms | ease-out |
| Card appear | Screen load | 250ms | ease-out, stagger 50ms |
| Tab switch | Tab tap | 200ms | ease-in-out |
| Pull-to-refresh | Pull down | 300ms | spring |
| Celebration modal | Habit complete | 400ms | spring (damping: 12) |
| Progress ring fill | Data load | 600ms | ease-out |
| "Now" line pulse | Planner Today | 2s cycle | sine |

### 7.2 Haptics (`expo-haptics`)

| Moment | Haptic Type | When |
|--------|-------------|------|
| Habit complete | `ImpactFeedbackStyle.Medium` | On tap |
| Streak tick | `ImpactFeedbackStyle.Light` | Number changes |
| Lumi done thinking | `NotificationFeedbackStyle.Success` | Response received |
| Pull-to-refresh | `ImpactFeedbackStyle.Light` | Threshold crossed |
| Error/failed action | `NotificationFeedbackStyle.Error` | API error |
| Tab switch | `ImpactFeedbackStyle.Light` | Tab tap (optional, respect system settings) |

**Rules:**
- Never haptic on every scroll or gesture — only on meaningful moments
- Respect system haptic settings (iOS Settings > Sounds & Haptics)
- Pair haptic with visual feedback — haptic alone is confusing

### 7.3 Reduce Motion

```ts
import { AccessibilityInfo } from 'react-native';

const isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
```

When enabled:
- Disable LumiFace blink/breathe (static eyes)
- Disable celebration animations (simple checkmark)
- Disable card stagger (instant appear)
- Keep haptics (they're not visual motion)

---

## 8. LUMI ON NATIVE

### 8.1 Architecture

```
Lumi Screen
├── LumiFace.tsx          (Reanimated, 5 moods)
├── MessageList.tsx        (FlatList, inverted)
├── SuggestionChips.tsx    (context-aware prompts)
├── TextInput.tsx          (text + mic button)
├── ConfirmationCard.tsx   (action confirmations)
└── useLumiChat.ts         (hook: state machine, API calls)
```

### 8.2 State Machine

```
idle → (user types/taps mic) → listening/recording
listening → (user sends) → processing
processing → (API responds) → speaking
speaking → (TTS ends or user taps) → idle
```

### 8.3 Voice Input Flow

```
User taps mic
  → expo-av starts recording
  → LumiFace mood = listening (teal)
  → Recording indicator shows
  → User taps stop (or auto-stop after 60s)
  → Audio file sent to backend /api/lumi/transcribe
  → Backend returns text
  → Text appears in input field
  → User taps send (or auto-send)
  → LumiFace mood = thinking (blue)
  → POST /api/lumi/chat with message
  → Response streams back
  → LumiFace mood = resting (gold)
  → expo-speech speaks response (optional)
```

### 8.4 Message Types

| Type | Render |
|------|--------|
| User text | Right-aligned, amber-tinted background |
| Lumi text | Left-aligned, LumiFace icon, serif font |
| Confirmation card | Full-width, action buttons |
| Suggestion chips | Horizontal scroll below last message |
| Life audit | Progress bar + category cards |
| Error | Inline error, coral tint |

### 8.5 API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `POST /api/lumi/chat` | Send message, get response |
| `POST /api/lumi/transcribe` | Audio → text (whisper) |
| `GET /api/lumi/memories` | Memory count for header |
| `POST /api/lumi/memories` | Save a memory |
| `GET /api/lumi/life-audit/preview` | Life audit status |

---

## 9. NATIVE-ONLY CAPABILITIES

### 9.1 Push Notifications (`expo-notifications`)

| Notification | Trigger | Copy |
|-------------|---------|------|
| Daily check-in | Configured time (default 8am) | "Good morning! Ready to plan your day? ✦" |
| Streak at risk | Evening if habit not done | "Your {habit} streak is at {n} days. Don't break it!" |
| Schedule reminder | 15 min before event | "{event} starts in 15 minutes" |
| Lumi nudge | Random, max 1/day | "I noticed you haven't journaled today. Want to write a quick line?" |
| Weekly review | Sunday evening | "Here's your week: {streaks} streaks, {entries} journal entries. 🎉" |

**Implementation:**
- Register device token on login → `POST /api/push/subscribe`
- Backend schedules notifications using existing copy generation
- Deep links: `plos://habits`, `plos://journal`, `plos://planner`

### 9.2 Biometric App Lock (`expo-local-authentication`)

```
Settings → Biometric Lock → [Toggle]
  → On first enable: prompt Face ID / fingerprint
  → On each app open (if enabled): authenticate before showing content
  → Fallback: device PIN
```

**Why:** This app holds someone's entire private life — journals, finances, habits, conversations with Lumi. Biometric lock is the #1 native security feature.

### 9.3 Offline Cache

| Data | Cache Strategy | Storage |
|------|---------------|---------|
| User profile | Cache on login | AsyncStorage |
| Today's schedule | Cache on fetch, refresh on pull | AsyncStorage |
| Habits + trackers | Cache on fetch, optimistic updates | AsyncStorage |
| Journal entries (last 20) | Cache on fetch | AsyncStorage |
| Budget summary | Cache on fetch | AsyncStorage |
| Lumi conversation | Session-only (not cached) | Memory |

**Offline behavior:**
- App opens instantly with cached data
- Stale indicator shown ("Last updated 2h ago")
- Writes queue in offline queue (`services/offlineQueue.ts`)
- On reconnect: queue flushes, conflicts resolved (server wins)
- Lumi: "You're offline. I'll process your message when you're back."

### 9.4 Environment Config

Move hardcoded `BASE_URL` from `services/api.ts` to `app.config.ts`:

```ts
// app.config.ts
export default {
  // ...
  extra: {
    apiUrl: process.env.API_URL || 'http://localhost:3000',
  },
};
```

```ts
// services/api.ts
import Constants from 'expo-constants';
const BASE_URL = Constants.expoConfig?.extra?.apiUrl;
```

**Environments:**
- Development: `http://localhost:3000` (iOS) / `http://192.168.x.x:3000` (Android)
- Staging: `https://staging-api.plos.app`
- Production: `https://api.plos.app`

---

## 10. SECURITY

### 10.1 Already Done (keep)

- ✅ JWT in `expo-secure-store` (Keychain/Keystore-backed)
- ✅ Token refresh interceptor with request queue
- ✅ AES-256-GCM encryption utility
- ✅ Auth gate in root layout

### 10.2 To Add

| Feature | Priority | Implementation |
|---------|----------|---------------|
| Biometric app lock | **High** | `expo-local-authentication` |
| Env-based `BASE_URL` | **High** | `app.config.ts` + EAS env vars |
| HTTPS-only in prod | **High** | Config check, never ship `http://` |
| Certificate pinning | Medium | `expo-network-config` or native module |
| Secure logging | Medium | Never log message content, tokens, or PII |
| App timeout lock | Medium | Lock after 5 min background |

### 10.3 Rules

- **Never** store tokens in AsyncStorage (they're in SecureStore — keep it that way)
- **Never** log conversation content to crash reporting
- **Never** ship with a hardcoded dev IP
- **Always** use HTTPS in staging/production
- **Always** clear SecureStore on logout

---

## 11. DEVELOPER IMPLEMENTATION PLAN

### Phase 0 — Brand Pass (1-2 days)
**Goal:** Fix the palette. Make the native app look like PLOS.

- [ ] Replace `constants/colors.ts` with the brand palette (§5.1)
- [ ] Update `constants/typography.ts` with serif hero (§5.2)
- [ ] Restyle login screen: amber logo, LumiFace welcome, brand inputs
- [ ] Restyle register screen: same
- [ ] Restyle root layout loading screen: amber spinner
- [ ] Restyle Home screen: brand cards, amber accents, warm text
- [ ] Restyle Profile screen: brand buttons
- [ ] Update `app.json` splash background to `#0A0A0F`

### Phase 1 — Navigation Fix (1 day)
**Goal:** 5-tab bar with Lumi center + Planner tab.

- [ ] Create `app/(tabs)/planner/` route group
- [ ] Create `app/(tabs)/lumi/` route group
- [ ] Move `budget/` and `profile/` out of tabs (into root stack)
- [ ] Update `app/(tabs)/_layout.tsx` with new 5-tab structure
- [ ] Style tab bar: `#0D0D16` bg, amber active, Lumi center elevated
- [ ] Add tab bar icons (Ionicons: home, calendar, book, checkmark-circle)
- [ ] Center Lumi tab placeholder (circle with amber ring)

### Phase 2 — LumiFace Component (2-3 days)
**Goal:** Animated LumiFace with 5 moods, working on center tab and Lumi screen.

- [ ] Build `components/LumiFace.tsx` with Reanimated
- [ ] Implement resting mood (gold eyes, blink, breathe)
- [ ] Implement thinking mood (blue eyes, smaller pupils)
- [ ] Implement happy mood (crescents, rosy cheeks)
- [ ] Implement listening mood (teal, pulse)
- [ ] Implement concerned mood (tilt, dimmed)
- [ ] Add reduce-motion support
- [ ] Place LumiFace on center tab (mood-reactive)
- [ ] Place LumiFace on Lumi screen header

### Phase 3 — Lumi Chat Screen (3-4 days)
**Goal:** Working text chat with Lumi, suggestion chips, confirmation cards.

- [ ] Build `app/(tabs)/lumi/index.tsx` screen layout
- [ ] Build `useLumiChat.ts` hook (state machine, API calls)
- [ ] Build message list (FlatList, inverted, user/Lumi bubbles)
- [ ] Build text input with send button
- [ ] Build suggestion chips (context-aware)
- [ ] Build confirmation card component
- [ ] Wire to `POST /api/lumi/chat`
- [ ] Add voice input (expo-av recording → `/lumi/transcribe`)
- [ ] Add TTS output (expo-speech)

### Phase 4 — Home + Planner (3-4 days)
**Goal:** Working Dashboard and Planner screens with real API data.

- [ ] Build Home screen (greeting, focus, stats, nudge, habits, quick actions)
- [ ] Wire Home to `/schedule/today`, `/trackers`, `/lumi` endpoints
- [ ] Build empty state (4-door welcome)
- [ ] Build Planner Today view (timeline with "now" line)
- [ ] Build Planner Week view (7-day strip + schedule)
- [ ] Build Planner Year view (month grid)
- [ ] Wire Planner to `/schedule`, `/goals`
- [ ] Add segmented control (Today/Week/Year)

### Phase 5 — Habits + Trackers (2-3 days)
**Goal:** Working habit check-ins with haptics and streak visualization.

- [ ] Build habit cards (tap-to-complete, streak counter)
- [ ] Build tracker grid (GitHub-style streak visualization)
- [ ] Build celebration modal (identity vote)
- [ ] Add haptics on completion
- [ ] Wire to `/habits`, `/trackers`
- [ ] Add habit creation flow (modal)
- [ ] Build streak-at-risk notification logic

### Phase 6 — Journal + Budget (3-4 days)
**Goal:** Journal bookshelf, compose, budget overview.

- [ ] Build journal bookshelf (journal type cards)
- [ ] Build entry list (snippets with date)
- [ ] Build compose screen (full-screen modal, auto-save)
- [ ] Add camera attachment (expo-camera / image picker)
- [ ] Wire to `/journal`, `/journal/pages`
- [ ] Build Budget overview (summary strip, categories, recent)
- [ ] Build quick-add expense (bottom sheet)
- [ ] Wire to `/budget`, `/savings`

### Phase 7 — Native Features (2-3 days)
**Goal:** Push notifications, biometric lock, offline cache, env config.

- [ ] Implement push notification registration → `/push/subscribe`
- [ ] Implement daily/streak/schedule notifications
- [ ] Add biometric app lock (expo-local-authentication)
- [ ] Move BASE_URL to app.config.ts + EAS env
- [ ] Implement offline cache (AsyncStorage for key data)
- [ ] Implement offline queue for writes
- [ ] Add deep link handling

### Phase 8 — Profile + Polish (2 days)
**Goal:** Profile/Settings, upgrade flow, final polish.

- [ ] Build Profile screen (account, settings, billing)
- [ ] Build Settings sections (notifications, theme, voice, biometric, MFA)
- [ ] Add theme toggle (Dark / Coloured)
- [ ] Add upgrade flow (Stripe web view or RevenueCat)
- [ ] Polish all screen transitions
- [ ] Add pull-to-refresh on all data screens
- [ ] Add skeleton loading states
- [ ] Test on iOS (iPhone 12+) and Android (Pixel 6+)

### Phase 9 — Release Prep (2-3 days)
**Goal:** EAS build, TestFlight, Play Internal Testing.

- [ ] EAS build configuration
- [ ] TestFlight upload (iOS)
- [ ] Play Internal Testing upload (Android)
- [ ] Fix platform-specific issues
- [ ] Performance profiling (60fps, no jank)
- [ ] Accessibility audit (VoiceOver, TalkBack)
- [ ] Final security review

**Total estimated time: 6-8 weeks for a solo developer.**

---

## 12. REUSE STRATEGY

### 12.1 What's Shared (copy-kept-in-sync)

| Asset | Web Location | Native Location | Sync Method |
|-------|-------------|-----------------|-------------|
| Color palette | `frontend/src/lib/colors.js` | `constants/colors.ts` | Copy values manually |
| Lumi moods | `LumiFace.jsx` mood colors | `components/LumiFace.tsx` | Same spec, different implementation |
| API contract | Backend routes | `services/api.ts` | Same endpoints, shared backend |
| Journal type keys | `journal_page_entries.type` | `JournalColors` object | Same keys |

### 12.2 What's NOT Shared (expected)

| What | Why |
|------|-----|
| UI components | DOM vs RN primitives — completely different |
| Animations | CSS keyframes vs Reanimated |
| Layout system | CSS grid/flex vs RN StyleSheet |
| Navigation | React Router vs Expo Router |

### 12.3 Shared Spec Doc

Create a `DESIGN_TOKENS.md` that both platforms reference:

```
# PLOS Design Tokens (Canonical)

## Colors
- Primary: #C8955C
- Background: #080503 (dark) / #0F0804 (coloured)
- Text: #EAE0D5 / #F5EDE2

## Lumi Moods
- Resting: gold #F1D98A / #C8955C
- Thinking: blue #B8D4F0 / #5B9BD6
- Listening: teal #A8E8D8 / #3FC7AC

## Timing
- Blink: 150ms, every 3-5s
- Breathe: 3s cycle
- Card appear: 250ms, stagger 50ms
```

---

## HONEST BOTTOM LINE

The native app has **good bones** — Expo Router, SecureStore auth, Zustand, the right dependencies. The work is:

1. **Fix the brand** (1-2 days) — the palette is off, making it look like a different product
2. **Fix the nav** (1 day) — Lumi must be the center tab, Planner must exist
3. **Build Lumi** (1 week) — the flagship feature, the reason PLOS exists
4. **Fill screens** (3-4 weeks) — wire to existing APIs, mirror web patterns
5. **Add native features** (1 week) — push, biometrics, offline
6. **Ship** (1 week) — EAS build, testing, release

The web app is the reference. The native app re-expresses the same soul in native primitives. Every screen has a finished web counterpart to mirror. The backend is shared — no duplication.

The mobile app should feel like: **Calm. Fast. Personal. Conversational. One-handed. Zero cognitive overload.**

Lumi does the thinking. The user lives the story.
