const express = require('express');
const { z } = require('zod');
const { pool } = require('../db/connection');
const { authenticate } = require('../middleware/authenticate');
const { validateInput } = require('../middleware/validateInput');
const { auditLog } = require('../middleware/auditLog');
const { attachTier, isPro, FREE_LIMITS } = require('../middleware/checkTier');

const router = express.Router();
router.use(authenticate);

// ─── Validation ────────────────────────────────────────────────────────────────
const writeSchema = z.object({
  journal_type:  z.string().min(1).max(100),
  template_name: z.string().min(1).max(200),
  entry_date:    z.string().optional(),        // ISO date; defaults to today
  fields:        z.record(z.unknown()),        // shape varies per template
  source:        z.enum(['user', 'lumi']).optional(),
});

const userJournalSchema = z.object({
  type_key:         z.string().min(1).max(100),
  label:            z.string().min(1).max(200),
  emoji:            z.string().max(10).optional(),
  color:            z.string().max(7).optional(),
  templates:        z.array(z.unknown()).optional(),
  routing_keywords: z.array(z.string()).optional(),
  display_order:    z.number().int().optional(),
});

// ─── GET /api/journal/pages ────────────────────────────────────────────────────
// Load entries for a journal type, optionally filtered by template + date range.
// Also supports full-text search via ?q= (searches inside fields JSONB as text).
// Used by JournalPage to populate template fields on open, and by search.
router.get('/', async (req, res) => {
  const uid = req.user.id;
  const { journal_type, template_name, date, from, to, limit = 30, q } = req.query;

  try {
    const conditions = ['user_id = $1'];
    const params = [uid];
    let i = 2;

    if (journal_type)  { conditions.push(`journal_type = $${i++}`);             params.push(journal_type); }
    if (template_name) { conditions.push(`template_name = $${i++}`);            params.push(template_name); }
    if (date)          { conditions.push(`entry_date = $${i++}`);               params.push(date); }
    if (from)          { conditions.push(`entry_date >= $${i++}`);              params.push(from); }
    if (to)            { conditions.push(`entry_date <= $${i++}`);              params.push(to); }
    if (q)             { conditions.push(`fields::text ILIKE $${i++}`);         params.push(`%${q}%`); }
    if (req.query.include_archived !== 'true') conditions.push('archived_at IS NULL');

    params.push(Math.min(parseInt(limit), 200));

    const result = await pool.query(
      `SELECT id, journal_type, template_name, entry_date, fields, source, created_at, updated_at
       FROM journal_page_entries
       WHERE ${conditions.join(' AND ')}
       ORDER BY entry_date DESC, updated_at DESC
       LIMIT $${i}`,
      params
    );

    res.json({ entries: result.rows });
  } catch (err) {
    console.error('Journal pages GET error:', err);
    res.status(500).json({ error: 'Failed to load journal page entries' });
  }
});

// ─── GET /api/journal/pages/today ─────────────────────────────────────────────
// Returns all entries for today across all templates — used by Lumi for context.
router.get('/today', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT journal_type, template_name, fields, source, updated_at
       FROM journal_page_entries
       WHERE user_id = $1 AND entry_date = CURRENT_DATE AND archived_at IS NULL
       ORDER BY updated_at DESC`,
      [req.user.id]
    );
    res.json({ entries: result.rows });
  } catch (err) {
    console.error('Journal pages today error:', err);
    res.status(500).json({ error: 'Failed to load today entries' });
  }
});

// ─── POST /api/journal/pages ───────────────────────────────────────────────────
// Upsert a page entry. Lumi and the user both use this endpoint.
// If an entry already exists for this user+journal_type+template_name+entry_date,
// the fields are MERGED (new fields win, existing fields are preserved if not overwritten).
// Side-effect: if journal_type='budget' and template_name='Daily Expenses', each
// non-empty row in fields.rows is upserted into budget_entries (two-way sync).
router.post('/',
  attachTier,
  validateInput(writeSchema),
  auditLog('journal_page_write', 'journal_page_entries'),
  async (req, res) => {
    const uid = req.user.id;
    const { journal_type, template_name, fields, source = 'user' } = req.body;
    const entry_date = req.body.entry_date || new Date().toISOString().slice(0, 10);

    // Free tier: only personal journal type
    if (!isPro(req) && !FREE_LIMITS.journal_types.includes(journal_type)) {
      return res.status(403).json({
        error: `Free accounts can only access the Personal journal. Upgrade to Pro to unlock all 6 journal types.`,
        upgrade: true,
        code: 'JOURNAL_TYPE_LOCKED',
      });
    }

    try {
      const result = await pool.query(
        `INSERT INTO journal_page_entries
           (user_id, journal_type, template_name, entry_date, fields, source)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6)
         ON CONFLICT (user_id, journal_type, template_name, entry_date)
         DO UPDATE SET
           fields     = journal_page_entries.fields || $5::jsonb,
           source     = $6,
           updated_at = NOW()
         RETURNING *`,
        [uid, journal_type, template_name, entry_date, JSON.stringify(fields), source]
      );

      // ── Budget two-way sync: journal → budget_entries ──────────────────────
      if (journal_type === 'budget' && template_name === 'Daily Expenses' && Array.isArray(fields.rows)) {
        // Delete previous journal-sourced entries for this date so re-saves don't duplicate
        await pool.query(
          `DELETE FROM budget_entries
           WHERE user_id=$1 AND entry_date=$2 AND source='journal'`,
          [uid, entry_date]
        ).catch(() => {});

        const validRows = fields.rows.filter(r => r && r.description && r.amount && parseFloat(String(r.amount).replace(/[₦,]/g, '')) > 0);
        for (const row of validRows) {
          const amt = parseFloat(String(row.amount).replace(/[₦,]/g, ''));
          if (isNaN(amt) || amt <= 0) continue;
          await pool.query(
            `INSERT INTO budget_entries (user_id, type, amount, currency, category, note, entry_date, source)
             VALUES ($1,'expense',$2,'₦',$3,$4,$5,'journal')`,
            [uid, amt, row.category || 'other', row.description || '', entry_date]
          ).catch(() => {});
        }
      }

      res.status(201).json({ entry: result.rows[0] });
    } catch (err) {
      console.error('Journal pages POST error:', err);
      res.status(500).json({ error: 'Failed to save journal page entry' });
    }
  }
);

// ─── PUT /api/journal/pages/:id ────────────────────────────────────────────────
// Replace (or merge) fields on an existing entry. Used by the UI on textarea blur.
router.put('/:id',
  auditLog('journal_page_update', 'journal_page_entries'),
  async (req, res) => {
    const uid = req.user.id;
    const { fields, merge = true } = req.body;

    if (!fields || typeof fields !== 'object') {
      return res.status(400).json({ error: 'fields object required' });
    }

    try {
      const op = merge
        ? `fields = journal_page_entries.fields || $2::jsonb`
        : `fields = $2::jsonb`;

      const result = await pool.query(
        `UPDATE journal_page_entries
         SET ${op}, updated_at = NOW(), source = 'user'
         WHERE id = $1 AND user_id = $3
         RETURNING *`,
        [req.params.id, JSON.stringify(fields), uid]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Entry not found' });
      }

      res.json({ entry: result.rows[0] });
    } catch (err) {
      console.error('Journal pages PUT error:', err);
      res.status(500).json({ error: 'Failed to update journal page entry' });
    }
  }
);

// ─── DELETE /api/journal/pages/:id ────────────────────────────────────────────
router.delete('/:id',
  auditLog('journal_page_delete', 'journal_page_entries'),
  async (req, res) => {
    try {
      const result = await pool.query(
        `UPDATE journal_page_entries SET archived_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND user_id = $2 AND archived_at IS NULL RETURNING id`,
        [req.params.id, req.user.id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Entry not found' });
      res.json({ deleted: req.params.id });
    } catch (err) {
      console.error('Journal pages DELETE error:', err);
      res.status(500).json({ error: 'Failed to delete entry' });
    }
  }
);

// ─── GET /api/journal/pages/types ─────────────────────────────────────────────
// Returns user's custom journal types — used by Lumi to learn routing keywords.
router.get('/types', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, type_key, label, emoji, color, templates, routing_keywords, display_order
       FROM user_journal_types
       WHERE user_id = $1 AND is_active = true AND archived_at IS NULL
       ORDER BY display_order, created_at`,
      [req.user.id]
    );
    res.json({ types: result.rows });
  } catch (err) {
    console.error('Journal types GET error:', err);
    res.status(500).json({ error: 'Failed to load journal types' });
  }
});

// ─── POST /api/journal/pages/types ────────────────────────────────────────────
// Create a custom journal type (e.g. "Content Ideas", "Sermon Archive").
router.post('/types',
  validateInput(userJournalSchema),
  auditLog('journal_type_create', 'user_journal_types'),
  async (req, res) => {
    const uid = req.user.id;
    const { type_key, label, emoji, color, templates, routing_keywords, display_order } = req.body;

    try {
      const result = await pool.query(
        `INSERT INTO user_journal_types
           (user_id, type_key, label, emoji, color, templates, routing_keywords, display_order)
         VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8)
         ON CONFLICT (user_id, type_key) DO UPDATE SET
           label             = EXCLUDED.label,
           emoji             = EXCLUDED.emoji,
           color             = EXCLUDED.color,
           templates         = EXCLUDED.templates,
           routing_keywords  = EXCLUDED.routing_keywords,
           display_order     = EXCLUDED.display_order,
           updated_at        = NOW()
         RETURNING *`,
        [
          uid, type_key, label,
          emoji || '📓', color || '#7C3AED',
          JSON.stringify(templates || []),
          JSON.stringify(routing_keywords || []),
          display_order || 0,
        ]
      );
      res.status(201).json({ type: result.rows[0] });
    } catch (err) {
      console.error('Journal types POST error:', err);
      res.status(500).json({ error: 'Failed to create journal type' });
    }
  }
);

// ─── PUT /api/journal/pages/types/:id ─────────────────────────────────────────
// Update a custom journal type — used when Lumi adds a new section via chat.
router.put('/types/:id',
  auditLog('journal_type_update', 'user_journal_types'),
  async (req, res) => {
    const uid = req.user.id;
    const { label, emoji, color, templates, routing_keywords, display_order } = req.body;

    const sets = [];
    const params = [req.params.id, uid];
    let i = 3;

    if (label !== undefined)            { sets.push(`label=$${i++}`);            params.push(label); }
    if (emoji !== undefined)            { sets.push(`emoji=$${i++}`);            params.push(emoji); }
    if (color !== undefined)            { sets.push(`color=$${i++}`);            params.push(color); }
    if (templates !== undefined)        { sets.push(`templates=$${i++}::jsonb`); params.push(JSON.stringify(templates)); }
    if (routing_keywords !== undefined) { sets.push(`routing_keywords=$${i++}::jsonb`); params.push(JSON.stringify(routing_keywords)); }
    if (display_order !== undefined)    { sets.push(`display_order=$${i++}`);   params.push(display_order); }

    if (sets.length === 0) return res.status(400).json({ error: 'Nothing to update' });

    sets.push(`updated_at=NOW()`);

    try {
      const result = await pool.query(
        `UPDATE user_journal_types SET ${sets.join(',')} WHERE id=$1 AND user_id=$2 RETURNING *`,
        params
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Journal type not found' });
      res.json({ type: result.rows[0] });
    } catch (err) {
      console.error('Journal type PUT error:', err);
      res.status(500).json({ error: 'Failed to update journal type' });
    }
  }
);

// ─── DELETE /api/journal/pages/types/:id ──────────────────────────────────────
router.delete('/types/:id',
  auditLog('journal_type_delete', 'user_journal_types'),
  async (req, res) => {
    try {
      await pool.query(
        `UPDATE user_journal_types SET is_active = false, archived_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND user_id = $2`,
        [req.params.id, req.user.id]
      );
      res.json({ archived: req.params.id });
    } catch (err) {
      res.status(500).json({ error: 'Failed to archive journal type' });
    }
  }
);

module.exports = router;
