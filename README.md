<div align="center">

# PLOS
### Personal Life Operating System

**Powered by Lumi — Your AI Daily Life Conductor**

*"Most apps make you go to them. Lumi comes to you."*

[![Build](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square)](.)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![Stack](https://img.shields.io/badge/stack-React%20%2B%20Node%20%2B%20PostgreSQL-blueviolet?style=flat-square)](.)
[![AI](https://img.shields.io/badge/AI-Groq%20LLaMA%203.1-orange?style=flat-square)](.)
[![Encrypted](https://img.shields.io/badge/data-zero--knowledge%20encrypted-success?style=flat-square)](.)

</div>

---

## What Is PLOS?

PLOS is not a productivity app. It is not a journal. It is not a planner.

**PLOS is a life operating system.** It is the single place where your daily routine, your goals, your journal, your health, your finances, your reading, and your spiritual life all live — connected together, aware of each other, and guided by an AI companion called **Lumi** who is always one step ahead of your day.

You do not navigate PLOS like an app. You talk to it. You tell Lumi what you want. She builds it, tracks it, documents it, and celebrates it — automatically, across every section, while asking your permission before touching anything.

---

## Lumi — The AI Conductor

```
Morning  →  Lumi:  "Good morning Erica. Today you have 15 blocks.
                    Your workout is at 2 PM — prep gear at 1:50.
                    You have a conflict at 10 AM. One tap to fix."

Task done →  You:  "Done with Bible reading."
             Lumi: "Beautiful. What verse did you read today?
                    Any insights from prayer? Want me to save
                    this to your spiritual journal?"

Planning →   You:  "Plan my anniversary prep — some work Monday,
                    some Friday, some Saturday for 6 weeks."
             Lumi: "Here is what I'll set up — 6 schedule blocks
                    across Mon/Fri/Sat. Should I go ahead? ✓"

Night    →  Lumi:  "You completed 12 of 15 tasks today. You
                    finished your workout, journaled, and hit
                    your reading goal. 🏆 You just unlocked:
                    '7-Day Reading Streak'. Want to add a
                    milestone to your goals?"
```

Lumi is **not passive**. She reads your journal, your schedule, your goals, your habits — and she acts. When you say you want something, she proposes it in writing before doing anything. You confirm. She executes.

---

## The Atmosphere System

PLOS does not have a static background. It has a **living atmosphere**.

The entire app reads your time of day, your geographic region, and your season — then wraps every page in an emotionally matched scene:

| Time / Season | Scene | Particles |
|---|---|---|
| Morning (any region) | Cozy coffee shop | — |
| Morning (mountains) | Mountain mist | Rising mist |
| Rain season (Nigeria/tropics) | Forest rain | Falling rain |
| Harmattan (West Africa) | Savanna sunset | Dust drift |
| Winter (USA/Europe) | Snowy pine forest | Snowfall |
| Spring | Cherry blossoms | Falling petals |
| Autumn | Forest path | Tumbling leaves |
| Night | Starfield | Twinkling stars |
| Fireplace (night, winter) | Cabin fireplace | Rising embers |

Every panel, card, and sidebar is **glass** — transparent enough that the scene shows through, dark enough that text is always readable. The UI does not sit on top of the atmosphere. It lives inside it.

Rain falling through your reading list. Snow drifting behind your goals. The app feels alive because it **is** alive.

---

## Features

### Daily Planner
- **Time-blocked schedule** with color-coded categories (Spiritual, Health, Work, Meals, Social, Sleep)
- **Progress ring** that fills as you check off tasks
- **Lock icons** — protect priority blocks (Bible, prayer, meditation) from being moved
- **Conflict detection** — overlapping blocks are flagged, Lumi fixes them in one tap
- **Now line** — real-time red line showing the current time in your timeline
- **Night banner** — after 9 PM: "Plan tomorrow with Lumi before you sleep"
- **Weekly view** — 7-day grid with completion %, category dots, workout plan, goals bars
- **Plans tab** — workout schedule, meal plan with macros, medication tracker, sleep heatmap

### Lumi AI Orchestration
- **Chat mode** — talk to Lumi from any page, she responds in context
- **Plan mode** — describe what you want built, Lumi proposes a full action plan before touching anything
- **Cross-app execution** — one confirmation creates schedule blocks, journal entries, goal updates, and habit completions simultaneously
- **Post-completion follow-up** — mark a task done, Lumi asks what you want to document
- **Achievement celebrations** — goal reached → full-screen celebration with milestone emoji
- **Auto page refresh** — after Lumi writes to a section, that page reloads its data automatically

### Journal System
- Six journal types: Personal, Spiritual, Budget, Habits, Goals, Health
- Draggable stickers and sticky notes on journal pages
- Voice dictation directly into journal fields
- AI analysis of each entry (mood, summary, emotion)
- Zero-knowledge encryption on all content

### Goal Tracking
- Year → Quarter → Month → Week → Day hierarchy
- Progress percentage per goal
- Achievement milestones with emoji badges
- Lumi detects when you've reached a goal and asks to celebrate it

### Health & Wellness
- Workout plan with weekly schedule (Strength, Cardio, HIIT, Yoga, Rest)
- Meal plan with calories and macros
- Medication tracker with daily checkboxes
- Sleep schedule with 21-night heatmap and quality score

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)               │
│                                                          │
│  Atmosphere.jsx          ← Scene system (photos + CSS   │
│  ├─ atmos.js               particles, Ken Burns, glass  │
│  └─ Atmosphere.css         UI, palette-aware themes)    │
│                                                          │
│  LumiOrchestrator.jsx    ← Global AI overlay (plan      │
│  └─ useLumi.js             review, achievements,        │
│                            follow-ups, event bus)       │
│                                                          │
│  Pages: Dashboard, Schedule, Journal, Books,            │
│         Goals, Settings, TalkToLumi, ...                │
│  Layout: SidebarLayout (glass, palette-adaptive)        │
└──────────────────────────┬──────────────────────────────┘
                           │ REST API
┌──────────────────────────▼──────────────────────────────┐
│                   BACKEND (Node + Express)               │
│                                                          │
│  /api/lumi/message    ← Conversational AI (Groq)        │
│  /api/lumi/plan       ← Cross-app action proposals      │
│  /api/lumi/execute    ← Confirmed action execution      │
│  /api/lumi/complete-task ← Post-completion follow-up    │
│                                                          │
│  lumiRouter.js        ← Groq LLaMA 3.1 integration     │
│  lumiActions.js       ← DB writes across all sections  │
│                                                          │
│  /api/schedule        ← Daily planner CRUD             │
│  /api/journal         ← Encrypted journal entries      │
│  /api/goals           ← Year planning hierarchy        │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│              PostgreSQL + Row-Level Security             │
│  Zero-knowledge encryption on journal content           │
│  User data is fully isolated at the database level      │
└─────────────────────────────────────────────────────────┘
```

### Stack
| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Framer Motion |
| Styling | Inline styles + CSS modules, no Tailwind runtime |
| AI | Groq (LLaMA 3.1 8B Instant) |
| Backend | Node.js, Express |
| Database | PostgreSQL with RLS |
| Auth | JWT (15m access + 7d refresh) |
| Encryption | AES-256 on all journal content |
| Voice | WebSpeech API + Whisper (optional) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- A free [Groq API key](https://console.groq.com)

### Installation

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/PLOS.git
cd PLOS

# Backend
cd backend
cp .env.example .env
# Fill in: DATABASE_URL, GROQ_API_KEY, JWT_SECRET
npm install
npm run migrate
npm run dev

# Frontend (new terminal)
cd ../frontend
npm install
npm run dev
```

Open `http://localhost:5173`

### Environment Variables

```env
# backend/.env
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/plos
JWT_SECRET=your-64-char-secret
JWT_REFRESH_SECRET=your-other-64-char-secret
GROQ_API_KEY=gsk_...
FRONTEND_URL=http://localhost:5173
```

---

## Changelog — What Was Built

### Atmosphere System (complete rewrite)
- Replaced static dark backgrounds with a living scene system
- 12 hand-curated scenes matched to time of day, season, and region
- CSS-only weather particles: rain, snow, harmattan dust, cherry petals, autumn leaves, embers, stars, mist
- `useMemo`-seeded particle arrays — zero flicker on re-renders
- Ken Burns slow zoom on every photo background
- Glass UI — every card, sidebar, and panel uses `backdrop-filter: blur` so the scene shows through
- `useAtmos()` context hook — any component reads the current scene's color palette
- Sidebar and dashboard accent colors adapt to the active scene

### Lumi Orchestration (new)
- `POST /lumi/plan` — Lumi proposes cross-app actions before executing anything
- `POST /lumi/execute` — confirmed batch execution across schedule, journal, goals, habits
- `POST /lumi/complete-task` — post-completion follow-up with contextual journal prompts
- `LumiOrchestrator.jsx` — global overlay: plan review modal, achievement celebrations, completion follow-ups
- `useLumi` upgraded with `askLumiToPlan`, `confirmActions`, `completeTask`, achievement state, cross-app event bus
- Lumi system prompt updated: proactive planner brain, conflict resolver, night-time planning, completion tracking

### Daily Planner (full rebuild)
- Full timeline with 15 blocks: Bible, Prayer, Meditation → Work → Meals → Workout → Sleep
- Progress ring, conflict detection, lock icons, now-line
- This Week tab: 7-day grid, goals bars, workout summary
- My Plans tab: workout plan, meal plan, medication tracker, sleep heatmap

### Bug Fixes
- CORS: backend now accepts both `localhost:5173` and `localhost:5174`
- Particle layer z-index fixed — particles now render above content
- Removed all `console.log` debug statements from production code
- Removed dead Unsplash Source API — replaced with Picsum Photos
- Removed all `photo_query` fields — replaced with `photo_seed` for consistent images
- `Math.random()` moved inside `useMemo` — eliminated particle flicker on re-render
- LivingBackground removed from Journal, Books, Projects, Jobs, YearPlan, Calendar, Contacts, ContentPlanner, TalkToLumi

---

## Security

- All journal entries are AES-256 encrypted before storage
- JWT with 15-minute access tokens and 7-day refresh tokens
- Row-Level Security on all PostgreSQL tables
- CORS allowlist — only configured origins accepted
- No third-party analytics or tracking

---

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Push notifications and alarm integration
- [ ] Email reminders via SendGrid
- [ ] Offline mode with local SQLite sync
- [ ] Lumi voice output (text-to-speech responses)
- [ ] Regional cultural scenes (40+ countries)
- [ ] Budget tracker with bank sync
- [ ] Habit streak leaderboard (opt-in)

---

## Philosophy

PLOS was built on one belief: **your life deserves more than a to-do list.**

Most productivity tools treat your life like a project. PLOS treats it like what it is — your actual life, with seasons and rhythms and quiet mornings and late nights and things that matter deeply to you specifically.

The app changes with the weather outside your window. Lumi learns your routines. Your journal remembers what your goals tracker forgot. Everything connects.

It is not an app. It is a practice.

---

## License

MIT — free to use, fork, and build on.

---

<div align="center">

Built with intention by **Erica Innocent Effiong**

*PLOS — Personal Life Operating System*

</div>
