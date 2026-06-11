# PLANNER — CORRECTED BUILD PROMPTS (Phase 0 + Phase 2)

**Verified against live source June 2026. All issues from review fixed.**

Header: *"Use Edit/Write with the exact strings given. If an old_string is not found exactly, stop and report."*

---

# PHASE 0 — UNBLOCK THE CALENDAR

## PB-0A+0B — Fix Bug A + add date-range scoping (combined — these overlap)

```
FILE: backend/src/routes/schedule.js
These two changes touch the same code block. Apply as ONE edit.

OLD (lines 23-36):
    try {
      const schedules = await pool.query(
        `SELECT * FROM schedules
         WHERE user_id = $1 AND is_active = true
         ORDER BY start_time ASC`,
        [req.user.id]
      );

      res.json({ schedules });
    } catch (err) {

NEW:
    try {
      const { from, to } = req.query;
      const params = [req.user.id];
      let dateFilter = '';
      if (from && to) {
        params.push(from, to);
        dateFilter = ` AND (target_date IS NULL OR target_date BETWEEN $2 AND $3)`;
      }
      const { rows } = await pool.query(
        `SELECT * FROM schedules
         WHERE user_id = $1 AND is_active = true${dateFilter}
         ORDER BY start_time ASC`,
        params
      );

      res.json({ schedules: rows });
    } catch (err) {

VERIFY: GET /api/schedule → {schedules:[...]}. GET /api/schedule?from=2026-06-01&to=2026-06-30 → filtered. Open /calendar → events render.
NOTE: Do NOT touch the /today route below this.
```

## PB-0C — Reveal Calendar + Year Plan in sidebar

```
FILE: frontend/src/components/layout/SidebarLayout.jsx

OLD:
  life: [
    { icon: '📖', label: 'Journal',      path: '/journal'      },
    { icon: '🔥', label: 'Habits',       path: '/habits'       },
    { icon: '💰', label: 'Budget',       path: '/budget'       },
  ],

NEW:
  life: [
    { icon: '📖', label: 'Journal',      path: '/journal'      },
    { icon: '🔥', label: 'Habits',       path: '/habits'       },
    { icon: '💰', label: 'Budget',       path: '/budget'       },
    { icon: '📆', label: 'Calendar',     path: '/calendar'     },
    { icon: '🗓️', label: 'Year Plan',    path: '/year-plan'    },
  ],

VERIFY: Sidebar shows Calendar and Year Plan links. Both route correctly.
NOTE: No Goals page exists in App.jsx — do not add a Goals link.
```

---

# PHASE 2 — THE TRACKER SYSTEM

## PB-2A — Migration: tracker tables + RLS

```
Create FILE: backend/src/db/migrations/034_trackers.sql
(NOT 033 — that's taken by force_rls.sql)

CONTENTS:

-- Trackers: user-generated streak trackers for anything.
-- Mirrors habits/habit_completions so the existing streak + grid engine works.
CREATE TABLE IF NOT EXISTS trackers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  emoji          VARCHAR(10) DEFAULT '✅',
  type           VARCHAR(20) NOT NULL DEFAULT 'chain',
  target_days    INTEGER,
  target_count   INTEGER,
  target_dow     INTEGER[] DEFAULT '{0,1,2,3,4,5,6}',
  color          VARCHAR(7) DEFAULT '#C8955C',
  revival_tokens INTEGER DEFAULT 2,
  start_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active      BOOLEAN DEFAULT true,
  archived_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tracker_marks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracker_id  UUID NOT NULL REFERENCES trackers(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mark_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tracker_id, mark_date)
);

CREATE INDEX IF NOT EXISTS idx_trackers_user_active ON trackers(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_tracker_marks_tracker ON tracker_marks(tracker_id, mark_date DESC);
CREATE INDEX IF NOT EXISTS idx_tracker_marks_user_date ON tracker_marks(user_id, mark_date DESC);

ALTER TABLE trackers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracker_marks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'trackers_user_isolation'
  ) THEN
    CREATE POLICY trackers_user_isolation ON trackers
    FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'tracker_marks_user_isolation'
  ) THEN
    CREATE POLICY tracker_marks_user_isolation ON tracker_marks
    FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
  END IF;
END $$;

NOTE: Uses the same RLS policy form as every other migration (005, 006, etc.).
Do NOT add FORCE RLS here — tracker routes use the plain pool, not withUserContext.
Add trackers + tracker_marks to 033_force_rls.sql ONLY after withUserContext is wired.

VERIFY: restart server → [Migration] applied: 034_trackers.sql in logs.
```

## PB-2B — Backend routes + server.js registration

```
Create FILE: backend/src/routes/trackers.js

CONTENTS:

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { pool } = require('../db/connection');

router.use(authenticate);

function calcStreak(markDates) {
  if (!markDates || markDates.length === 0) return 0;
  const set = new Set(markDates.map(d =>
    typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10)
  ));
  let streak = 0;
  const d = new Date();
  for (;;) {
    const iso = d.toISOString().slice(0, 10);
    if (set.has(iso)) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}

// List trackers with marks + streak
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.*,
        (SELECT json_agg(mark_date ORDER BY mark_date DESC)
         FROM tracker_marks m WHERE m.tracker_id = t.id
         AND m.mark_date >= CURRENT_DATE - 364) AS marks
       FROM trackers t
       WHERE t.user_id = $1 AND t.is_active = true AND t.archived_at IS NULL
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );
    const trackers = rows.map(t => ({
      ...t,
      marks: t.marks || [],
      streak: calcStreak(t.marks || []),
    }));
    res.json({ trackers });
  } catch (e) {
    console.error('[trackers] list:', e.message);
    res.status(500).json({ error: 'Failed to load trackers' });
  }
});

// Create a tracker
router.post('/', async (req, res) => {
  try {
    const {
      title, type = 'chain', target_days = null,
      target_count = null, emoji = '✅', color = '#C8955C',
      target_dow = null,
    } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'title required' });
    }
    const { rows } = await pool.query(
      `INSERT INTO trackers
       (user_id, title, type, target_days, target_count, emoji, color, target_dow)
       VALUES ($1,$2,$3,$4,$5,$6,$7, COALESCE($8,'{0,1,2,3,4,5,6}'))
       RETURNING *`,
      [req.user.id, title.trim(), type, target_days, target_count, emoji, color, target_dow]
    );
    res.json({ tracker: { ...rows[0], marks: [], streak: 0 } });
  } catch (e) {
    console.error('[trackers] create:', e.message);
    res.status(500).json({ error: 'Failed to create tracker' });
  }
});

// Mark a date (default: today)
router.post('/:id/mark', async (req, res) => {
  try {
    const date = req.body.date || null;
    await pool.query(
      `INSERT INTO tracker_marks (tracker_id, user_id, mark_date)
       VALUES ($1, $2, COALESCE($3::date, CURRENT_DATE))
       ON CONFLICT (tracker_id, mark_date) DO NOTHING`,
      [req.params.id, req.user.id, date]
    );
    res.json({ success: true });
  } catch (e) {
    console.error('[trackers] mark:', e.message);
    res.status(500).json({ error: 'Failed to mark' });
  }
});

// Unmark a date (default: today). Uses query param (DELETE body is unreliable).
router.delete('/:id/mark', async (req, res) => {
  try {
    const date = req.query.date || null;
    await pool.query(
      `DELETE FROM tracker_marks
       WHERE tracker_id = $1 AND user_id = $2
       AND mark_date = COALESCE($3::date, CURRENT_DATE)`,
      [req.params.id, req.user.id, date]
    );
    res.json({ success: true });
  } catch (e) {
    console.error('[trackers] unmark:', e.message);
    res.status(500).json({ error: 'Failed to unmark' });
  }
});

// Revival: protect a missed day. Defaults to yesterday (revival is for missed days).
router.post('/:id/revive', async (req, res) => {
  try {
    const t = await pool.query(
      `SELECT revival_tokens FROM trackers WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!t.rows.length) return res.status(404).json({ error: 'Tracker not found' });
    if ((t.rows[0].revival_tokens || 0) <= 0) {
      return res.status(400).json({ error: 'No revivals left' });
    }
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const date = req.body.date || yesterday.toISOString().slice(0, 10);
    await pool.query(
      `INSERT INTO tracker_marks (tracker_id, user_id, mark_date, note)
       VALUES ($1, $2, $3, 'revived')
       ON CONFLICT (tracker_id, mark_date) DO NOTHING`,
      [req.params.id, req.user.id, date]
    );
    await pool.query(
      `UPDATE trackers SET revival_tokens = revival_tokens - 1
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (e) {
    console.error('[trackers] revive:', e.message);
    res.status(500).json({ error: 'Failed to revive' });
  }
});

// Archive a tracker
router.patch('/:id', async (req, res) => {
  try {
    const { archived } = req.body;
    if (archived) {
      await pool.query(
        `UPDATE trackers SET archived_at = NOW(), is_active = false
         WHERE id = $1 AND user_id = $2`,
        [req.params.id, req.user.id]
      );
    }
    res.json({ success: true });
  } catch (e) {
    console.error('[trackers] patch:', e.message);
    res.status(500).json({ error: 'Failed to update' });
  }
});

module.exports = router;


Then register it. FILE: backend/server.js

OLD (line 31):
const { router: habitsRoutes } = require('./src/routes/habits');

NEW:
const { router: habitsRoutes } = require('./src/routes/habits');
const trackerRoutes = require('./src/routes/trackers');

OLD (line 122):
app.use('/api/habits', habitsRoutes);

NEW:
app.use('/api/habits', habitsRoutes);
app.use('/api/trackers', trackerRoutes);

VERIFY: POST /api/trackers {title:"Workout",type:"challenge",target_days:75} → 200.
POST /api/trackers/:id/mark → 200. GET /api/trackers → streak:1.
DELETE /api/trackers/:id/mark?date=2026-06-04 → streak:0.
```

## PB-2C — Frontend: Trackers page + route + nav

```
Create FILE: frontend/src/pages/Trackers.jsx

Build a page with these requirements:
- Import SidebarLayout, { C } from '../components/layout/SidebarLayout'
- Import api from '../lib/api', useState/useEffect from 'react'
- On mount: fetch GET /api/trackers, store in state
- List view: each tracker is a card showing emoji, title, "🔥 {streak} days"
  - Mini grid: last 5 weeks (35 squares), filled = mark present, today = ringed
  - Use palette: filled #C8955C, empty rgba(255,255,255,0.06), today ring #F1D98A
  - Click card → detail view
- "+ New tracker" button → inline form (title input, type selector: chain/challenge/count,
  target_days input if challenge, emoji picker, color picker) → POST /api/trackers → refresh
- Detail view: big grid (same style as Habits.jsx Heatmap but larger squares),
  streak counter prominent, progress bar if type='challenge' (day X of target_days),
  "Mark today done" button (POST /:id/mark, optimistic update with rollback on error),
  revival button showing remaining tokens (POST /:id/revive), back button to list
- Wrap in <SidebarLayout>. Loading state. Empty state: "Start your first tracker 🌱"
- Match Habits.jsx styling: use C.text, C.muted, C.amber, glass card backgrounds,
  fadeUp animation. ErrorBoundary wrap.

Then add route. FILE: frontend/src/App.jsx
- Add import: import Trackers from './pages/Trackers'
- Add route block (mirror /calendar pattern exactly):

        <Route
          path="/trackers"
          element={
            <ProtectedRoute>
              <AnimatedRoute>
                <Trackers />
              </AnimatedRoute>
            </ProtectedRoute>
          }
        />

And add to nav. FILE: frontend/src/components/layout/SidebarLayout.jsx
- In the life: array (after PB-0C has been applied), add:
    { icon: '📊', label: 'Trackers', path: '/trackers' },

VERIFY: /trackers loads, create tracker, mark today, refresh persists, revive works.
```

## PB-2D — Dashboard streak peek

```
FILE: frontend/src/pages/Dashboard.jsx

Find the existing data fetch (Promise.allSettled or useEffect). Add:
  - Fetch GET /api/trackers alongside other data
  - Store in trackersToday state (default [])

Add a compact "Your streaks" section (full width card) that renders ONLY when
trackersToday.length > 0. For each active tracker: emoji, title, 🔥 streak count,
and a 7-square mini week grid (Mon-Sun, filled if marked). Use the same glass card
style as existing Dashboard cards. If no trackers, render nothing (no empty box).

VERIFY: Dashboard shows streak peeks when trackers exist; clean when none.
```

---

## RUN ORDER
```
Phase 0:  PB-0A+0B → PB-0C                build/test
Phase 2:  PB-2A → PB-2B → PB-2C → PB-2D   build/test each
```

## FIXES APPLIED (vs. original prompts)
1. PB-0A + PB-0B combined into one edit (they overlap the same code block)
2. PB-0B variable name mismatch fixed (was: `result` + `schedules.rows`)
3. PB-2A migration number: 034 (033 is force_rls.sql)
4. PB-2A RLS policy: uses `current_setting('app.current_user_id')::UUID` (matches all existing migrations)
5. PB-2B: `authenticate` import explicitly included
6. PB-2B DELETE route: uses `req.query.date` instead of `req.body`
7. PB-2B revive: defaults to yesterday (not today — revival is for missed days)
8. PB-2C: server.js registration note added
9. PB-0C: confirmed no Goals page exists — correctly omitted
