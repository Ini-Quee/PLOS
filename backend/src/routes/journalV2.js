const express = require('express');
const { z } = require('zod');
const { pool } = require('../db/connection');
const { authenticate } = require('../middleware/authenticate');
const { auditLog } = require('../middleware/auditLog');
const { validateInput } = require('../middleware/validateInput');
const {
  ENTRY_TYPES,
  JOURNAL_TAGS,
  ROUTING_RULES,
  TEMPLATE_SCHEMAS,
  inferRoute,
  normalizeTags,
  normalizeTemplateType,
} = require('../services/journalSchema');

const router = express.Router();
router.use(authenticate);

const jsonArraySchema = z.array(z.record(z.unknown())).default([]);

const dailyEntrySchema = z.object({
  entry_date: z.string().optional(),
  entry_type: z.enum(ENTRY_TYPES).optional(),
  template_type: z.string().min(1).max(100).optional(),
  title: z.string().max(300).optional().nullable(),
  entry_text: z.string().optional().default(''),
  tags: z.array(z.enum(JOURNAL_TAGS)).optional(),
  fields: z.record(z.unknown()).optional().default({}),
  attachments: jsonArraySchema.optional(),
  stickers: jsonArraySchema.optional(),
  source: z.enum(['user', 'lumi', 'system']).optional().default('user'),
});

const dailyEntryUpdateSchema = dailyEntrySchema.partial();

const weeklyReviewSchema = z.object({
  week_start: z.string().min(10).max(10),
  ai_summary: z.string().optional().nullable(),
  user_notes: z.string().optional().nullable(),
  wins: z.array(z.string()).optional().default([]),
  struggles: z.array(z.string()).optional().default([]),
  learning: z.string().optional().nullable(),
  next_week_intention: z.string().optional().nullable(),
  fields: z.record(z.unknown()).optional().default({}),
  attachments: jsonArraySchema.optional(),
  stickers: jsonArraySchema.optional(),
  source: z.enum(['user', 'lumi', 'system']).optional().default('user'),
});

const weeklyReviewUpdateSchema = weeklyReviewSchema.partial();

const monthlyCompassSchema = z.object({
  month_start: z.string().min(10).max(10),
  theme: z.string().optional().nullable(),
  goals: z.array(z.record(z.unknown())).optional().default([]),
  achievements: z.array(z.string()).optional().default([]),
  lessons: z.array(z.string()).optional().default([]),
  review: z.string().optional().nullable(),
  cover_image: z.string().optional().nullable(),
  fields: z.record(z.unknown()).optional().default({}),
  attachments: jsonArraySchema.optional(),
  stickers: jsonArraySchema.optional(),
  source: z.enum(['user', 'lumi', 'system']).optional().default('user'),
});

const monthlyCompassUpdateSchema = monthlyCompassSchema.partial();

function limitNumber(value, fallback = 50, max = 200) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.floor(n), max);
}

function normalizeEntryPayload(body) {
  const inferred = inferRoute(body.entry_text || body.title || '');
  const templateType = normalizeTemplateType(body.template_type || inferred.template_type);
  const tags = normalizeTags(body.tags || inferred.tags, templateType);
  const entryType = body.entry_type || (templateType === 'Blank Page' ? 'blank_page' : inferred.entry_type);
  return {
    ...body,
    entry_type: entryType,
    template_type: templateType,
    tags,
    fields: body.fields || {},
    attachments: body.attachments || [],
    stickers: body.stickers || [],
  };
}

function mergeEntryPayload(current, body) {
  const hasRoutingInput = body.template_type !== undefined || body.tags !== undefined || body.entry_text !== undefined || body.title !== undefined;
  if (!hasRoutingInput) {
    return {
      ...current,
      ...body,
      fields: body.fields !== undefined ? body.fields : current.fields,
      attachments: body.attachments !== undefined ? body.attachments : current.attachments,
      stickers: body.stickers !== undefined ? body.stickers : current.stickers,
    };
  }

  const normalized = normalizeEntryPayload({
    entry_text: body.entry_text !== undefined ? body.entry_text : current.entry_text,
    title: body.title !== undefined ? body.title : current.title,
    template_type: body.template_type !== undefined ? body.template_type : current.template_type,
    tags: body.tags !== undefined ? body.tags : current.tags,
    entry_type: body.entry_type !== undefined ? body.entry_type : current.entry_type,
    fields: body.fields !== undefined ? body.fields : current.fields,
    attachments: body.attachments !== undefined ? body.attachments : current.attachments,
    stickers: body.stickers !== undefined ? body.stickers : current.stickers,
    source: body.source !== undefined ? body.source : current.source,
  });

  return {
    ...current,
    ...body,
    ...normalized,
  };
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function weekStartIso(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

function monthStartIso(date = new Date()) {
  const d = new Date(date);
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

router.get('/schema', auditLog('journal_v2_schema', 'journal'), (req, res) => {
  res.json({
    tags: JOURNAL_TAGS,
    entry_types: ENTRY_TYPES,
    templates: TEMPLATE_SCHEMAS,
    routing_rules: ROUTING_RULES,
  });
});

router.post('/infer', auditLog('journal_v2_infer', 'journal'), (req, res) => {
  res.json({ route: inferRoute(req.body?.text || '') });
});

router.get('/entries', auditLog('journal_v2_entries_list', 'daily_entries'), async (req, res) => {
  const { from, to, tag, template_type, entry_type, q } = req.query;
  const limit = limitNumber(req.query.limit);
  const conditions = ['user_id=$1', 'archived_at IS NULL'];
  const params = [req.user.id];
  let i = 2;

  if (from) { conditions.push(`entry_date >= $${i++}`); params.push(from); }
  if (to) { conditions.push(`entry_date <= $${i++}`); params.push(to); }
  if (tag) { conditions.push(`$${i++} = ANY(tags)`); params.push(String(tag).toLowerCase()); }
  if (template_type) { conditions.push(`template_type = $${i++}`); params.push(normalizeTemplateType(template_type)); }
  if (entry_type) { conditions.push(`entry_type = $${i++}`); params.push(entry_type); }
  if (q) {
    conditions.push(`(entry_text ILIKE $${i} OR title ILIKE $${i} OR fields::text ILIKE $${i})`);
    params.push(`%${q}%`);
    i++;
  }
  params.push(limit);

  try {
    const { rows } = await pool.query(
      `SELECT id, entry_date, entry_type, template_type, title, entry_text, tags,
              fields, attachments, stickers, source, created_at, updated_at
         FROM daily_entries
        WHERE ${conditions.join(' AND ')}
        ORDER BY entry_date DESC, created_at DESC
        LIMIT $${i}`,
      params
    );
    res.json({ entries: rows });
  } catch (err) {
    console.error('Journal v2 entries list error:', err.message);
    res.status(500).json({ error: 'Failed to load journal entries' });
  }
});

router.get('/today', auditLog('journal_v2_today', 'daily_entries'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, entry_date, entry_type, template_type, title, entry_text, tags,
              fields, attachments, stickers, source, created_at, updated_at
         FROM daily_entries
        WHERE user_id=$1 AND entry_date=CURRENT_DATE AND archived_at IS NULL
        ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ entries: rows });
  } catch (err) {
    console.error('Journal v2 today error:', err.message);
    res.status(500).json({ error: 'Failed to load today journal entries' });
  }
});

router.get('/views/:tag', auditLog('journal_v2_tag_view', 'daily_entries'), async (req, res) => {
  const tag = String(req.params.tag || '').toLowerCase();
  if (!JOURNAL_TAGS.includes(tag)) return res.status(400).json({ error: 'Unknown journal tag' });

  try {
    const { rows } = await pool.query(
      `SELECT id, entry_date, entry_type, template_type, title, entry_text, tags,
              fields, attachments, stickers, source, created_at, updated_at
         FROM daily_entries
        WHERE user_id=$1 AND archived_at IS NULL AND $2 = ANY(tags)
        ORDER BY entry_date DESC, created_at DESC
        LIMIT $3`,
      [req.user.id, tag, limitNumber(req.query.limit)]
    );
    res.json({ tag, entries: rows });
  } catch (err) {
    console.error('Journal v2 tag view error:', err.message);
    res.status(500).json({ error: 'Failed to load journal view' });
  }
});

router.post('/entries',
  validateInput(dailyEntrySchema),
  auditLog('journal_v2_entry_create', 'daily_entries'),
  async (req, res) => {
    const payload = normalizeEntryPayload(req.body);
    try {
      const { rows } = await pool.query(
        `INSERT INTO daily_entries
           (user_id, entry_date, entry_type, template_type, title, entry_text, tags,
            fields, attachments, stickers, source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10::jsonb,$11)
         RETURNING id, entry_date, entry_type, template_type, title, entry_text, tags,
                   fields, attachments, stickers, source, created_at, updated_at`,
        [
          req.user.id,
          payload.entry_date || todayIso(),
          payload.entry_type,
          payload.template_type,
          payload.title || null,
          payload.entry_text || '',
          payload.tags,
          JSON.stringify(payload.fields),
          JSON.stringify(payload.attachments),
          JSON.stringify(payload.stickers),
          payload.source,
        ]
      );
      res.status(201).json({ entry: rows[0] });
    } catch (err) {
      console.error('Journal v2 create entry error:', err.message);
      res.status(500).json({ error: 'Failed to create journal entry' });
    }
  }
);

router.put('/entries/:id',
  validateInput(dailyEntryUpdateSchema),
  auditLog('journal_v2_entry_update', 'daily_entries'),
  async (req, res) => {
    try {
      const existing = await pool.query(
        `SELECT * FROM daily_entries WHERE id=$1 AND user_id=$2 AND archived_at IS NULL`,
        [req.params.id, req.user.id]
      );
      if (!existing.rows.length) return res.status(404).json({ error: 'Entry not found' });

      const current = existing.rows[0];
      const next = mergeEntryPayload(current, req.body);
      const { rows } = await pool.query(
        `UPDATE daily_entries SET
           entry_date=$1, entry_type=$2, template_type=$3, title=$4, entry_text=$5,
           tags=$6, fields=$7::jsonb, attachments=$8::jsonb, stickers=$9::jsonb,
           source=$10, updated_at=NOW()
         WHERE id=$11 AND user_id=$12
         RETURNING id, entry_date, entry_type, template_type, title, entry_text, tags,
                   fields, attachments, stickers, source, created_at, updated_at`,
        [
          next.entry_date,
          next.entry_type,
          next.template_type,
          next.title,
          next.entry_text,
          next.tags,
          JSON.stringify(next.fields || {}),
          JSON.stringify(next.attachments || []),
          JSON.stringify(next.stickers || []),
          next.source,
          req.params.id,
          req.user.id,
        ]
      );
      res.json({ entry: rows[0] });
    } catch (err) {
      console.error('Journal v2 update entry error:', err.message);
      res.status(500).json({ error: 'Failed to update journal entry' });
    }
  }
);

router.delete('/entries/:id', auditLog('journal_v2_entry_archive', 'daily_entries'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE daily_entries SET archived_at=NOW(), updated_at=NOW()
        WHERE id=$1 AND user_id=$2 AND archived_at IS NULL
        RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Entry not found' });
    res.json({ archived: req.params.id });
  } catch (err) {
    console.error('Journal v2 archive entry error:', err.message);
    res.status(500).json({ error: 'Failed to archive journal entry' });
  }
});

router.get('/weekly', auditLog('journal_v2_weekly_list', 'weekly_reviews'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM weekly_reviews
        WHERE user_id=$1 AND archived_at IS NULL
        ORDER BY week_start DESC
        LIMIT $2`,
      [req.user.id, limitNumber(req.query.limit, 20, 100)]
    );
    res.json({ reviews: rows });
  } catch (err) {
    console.error('Journal v2 weekly list error:', err.message);
    res.status(500).json({ error: 'Failed to load weekly reviews' });
  }
});

router.post('/weekly',
  validateInput(weeklyReviewSchema),
  auditLog('journal_v2_weekly_upsert', 'weekly_reviews'),
  async (req, res) => {
    const p = req.body;
    try {
      const { rows } = await pool.query(
        `INSERT INTO weekly_reviews
           (user_id, week_start, ai_summary, user_notes, wins, struggles, learning,
            next_week_intention, fields, attachments, stickers, source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11::jsonb,$12)
         ON CONFLICT (user_id, week_start)
         DO UPDATE SET
           ai_summary=EXCLUDED.ai_summary,
           user_notes=EXCLUDED.user_notes,
           wins=EXCLUDED.wins,
           struggles=EXCLUDED.struggles,
           learning=EXCLUDED.learning,
           next_week_intention=EXCLUDED.next_week_intention,
           fields=EXCLUDED.fields,
           attachments=EXCLUDED.attachments,
           stickers=EXCLUDED.stickers,
           source=EXCLUDED.source,
           updated_at=NOW()
         RETURNING *`,
        [
          req.user.id, p.week_start, p.ai_summary || null, p.user_notes || null,
          p.wins || [], p.struggles || [], p.learning || null, p.next_week_intention || null,
          JSON.stringify(p.fields || {}), JSON.stringify(p.attachments || []),
          JSON.stringify(p.stickers || []), p.source,
        ]
      );
      res.status(201).json({ review: rows[0] });
    } catch (err) {
      console.error('Journal v2 weekly upsert error:', err.message);
      res.status(500).json({ error: 'Failed to save weekly review' });
    }
  }
);

router.post('/weekly/generate', auditLog('journal_v2_weekly_generate', 'weekly_reviews'), async (req, res) => {
  const weekStart = req.body?.week_start || weekStartIso();
  try {
    const entries = await pool.query(
      `SELECT entry_text, tags, template_type, fields
         FROM daily_entries
        WHERE user_id=$1 AND archived_at IS NULL
          AND entry_date >= $2::date AND entry_date < ($2::date + INTERVAL '7 days')
        ORDER BY entry_date, created_at`,
      [req.user.id, weekStart]
    );
    const summary = entries.rows.length
      ? `Drafted from ${entries.rows.length} journal entries this week.`
      : 'No daily entries found for this week yet.';
    res.json({
      draft: {
        week_start: weekStart,
        ai_summary: summary,
        wins: [],
        struggles: [],
        learning: '',
        next_week_intention: '',
        source_entries: entries.rows,
      },
    });
  } catch (err) {
    console.error('Journal v2 weekly generate error:', err.message);
    res.status(500).json({ error: 'Failed to generate weekly review draft' });
  }
});

router.put('/weekly/:id',
  validateInput(weeklyReviewUpdateSchema),
  auditLog('journal_v2_weekly_update', 'weekly_reviews'),
  async (req, res) => {
    try {
      const existing = await pool.query(
        `SELECT * FROM weekly_reviews WHERE id=$1 AND user_id=$2 AND archived_at IS NULL`,
        [req.params.id, req.user.id]
      );
      if (!existing.rows.length) return res.status(404).json({ error: 'Weekly review not found' });
      const next = { ...existing.rows[0], ...req.body };
      const { rows } = await pool.query(
        `UPDATE weekly_reviews SET
           ai_summary=$1, user_notes=$2, wins=$3, struggles=$4, learning=$5,
           next_week_intention=$6, fields=$7::jsonb, attachments=$8::jsonb,
           stickers=$9::jsonb, source=$10, updated_at=NOW()
         WHERE id=$11 AND user_id=$12
         RETURNING *`,
        [
          next.ai_summary, next.user_notes, next.wins || [], next.struggles || [],
          next.learning, next.next_week_intention, JSON.stringify(next.fields || {}),
          JSON.stringify(next.attachments || []), JSON.stringify(next.stickers || []),
          next.source, req.params.id, req.user.id,
        ]
      );
      res.json({ review: rows[0] });
    } catch (err) {
      console.error('Journal v2 weekly update error:', err.message);
      res.status(500).json({ error: 'Failed to update weekly review' });
    }
  }
);

router.get('/monthly', auditLog('journal_v2_monthly_list', 'monthly_compasses'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM monthly_compasses
        WHERE user_id=$1 AND archived_at IS NULL
        ORDER BY month_start DESC
        LIMIT $2`,
      [req.user.id, limitNumber(req.query.limit, 12, 60)]
    );
    res.json({ compasses: rows });
  } catch (err) {
    console.error('Journal v2 monthly list error:', err.message);
    res.status(500).json({ error: 'Failed to load monthly compasses' });
  }
});

router.post('/monthly',
  validateInput(monthlyCompassSchema),
  auditLog('journal_v2_monthly_upsert', 'monthly_compasses'),
  async (req, res) => {
    const p = req.body;
    try {
      const { rows } = await pool.query(
        `INSERT INTO monthly_compasses
           (user_id, month_start, theme, goals, achievements, lessons, review,
            cover_image, fields, attachments, stickers, source)
         VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11::jsonb,$12)
         ON CONFLICT (user_id, month_start)
         DO UPDATE SET
           theme=EXCLUDED.theme,
           goals=EXCLUDED.goals,
           achievements=EXCLUDED.achievements,
           lessons=EXCLUDED.lessons,
           review=EXCLUDED.review,
           cover_image=EXCLUDED.cover_image,
           fields=EXCLUDED.fields,
           attachments=EXCLUDED.attachments,
           stickers=EXCLUDED.stickers,
           source=EXCLUDED.source,
           updated_at=NOW()
         RETURNING *`,
        [
          req.user.id, p.month_start, p.theme || null, JSON.stringify(p.goals || []),
          p.achievements || [], p.lessons || [], p.review || null, p.cover_image || null,
          JSON.stringify(p.fields || {}), JSON.stringify(p.attachments || []),
          JSON.stringify(p.stickers || []), p.source,
        ]
      );
      res.status(201).json({ compass: rows[0] });
    } catch (err) {
      console.error('Journal v2 monthly upsert error:', err.message);
      res.status(500).json({ error: 'Failed to save monthly compass' });
    }
  }
);

router.post('/monthly/generate', auditLog('journal_v2_monthly_generate', 'monthly_compasses'), async (req, res) => {
  const monthStart = req.body?.month_start || monthStartIso();
  try {
    const [entries, reviews] = await Promise.all([
      pool.query(
        `SELECT entry_text, tags, template_type, fields
           FROM daily_entries
          WHERE user_id=$1 AND archived_at IS NULL
            AND entry_date >= $2::date AND entry_date < ($2::date + INTERVAL '1 month')
          ORDER BY entry_date, created_at`,
        [req.user.id, monthStart]
      ),
      pool.query(
        `SELECT ai_summary, user_notes, wins, struggles, learning, next_week_intention
           FROM weekly_reviews
          WHERE user_id=$1 AND archived_at IS NULL
            AND week_start >= $2::date AND week_start < ($2::date + INTERVAL '1 month')
          ORDER BY week_start`,
        [req.user.id, monthStart]
      ),
    ]);
    res.json({
      draft: {
        month_start: monthStart,
        theme: '',
        goals: [],
        achievements: [],
        lessons: [],
        review: `Drafted from ${entries.rows.length} daily entries and ${reviews.rows.length} weekly reviews.`,
        source_entries: entries.rows,
        source_reviews: reviews.rows,
      },
    });
  } catch (err) {
    console.error('Journal v2 monthly generate error:', err.message);
    res.status(500).json({ error: 'Failed to generate monthly compass draft' });
  }
});

router.put('/monthly/:id',
  validateInput(monthlyCompassUpdateSchema),
  auditLog('journal_v2_monthly_update', 'monthly_compasses'),
  async (req, res) => {
    try {
      const existing = await pool.query(
        `SELECT * FROM monthly_compasses WHERE id=$1 AND user_id=$2 AND archived_at IS NULL`,
        [req.params.id, req.user.id]
      );
      if (!existing.rows.length) return res.status(404).json({ error: 'Monthly compass not found' });
      const next = { ...existing.rows[0], ...req.body };
      const { rows } = await pool.query(
        `UPDATE monthly_compasses SET
           theme=$1, goals=$2::jsonb, achievements=$3, lessons=$4, review=$5,
           cover_image=$6, fields=$7::jsonb, attachments=$8::jsonb, stickers=$9::jsonb,
           source=$10, updated_at=NOW()
         WHERE id=$11 AND user_id=$12
         RETURNING *`,
        [
          next.theme, JSON.stringify(next.goals || []), next.achievements || [],
          next.lessons || [], next.review, next.cover_image, JSON.stringify(next.fields || {}),
          JSON.stringify(next.attachments || []), JSON.stringify(next.stickers || []),
          next.source, req.params.id, req.user.id,
        ]
      );
      res.json({ compass: rows[0] });
    } catch (err) {
      console.error('Journal v2 monthly update error:', err.message);
      res.status(500).json({ error: 'Failed to update monthly compass' });
    }
  }
);

module.exports = router;
