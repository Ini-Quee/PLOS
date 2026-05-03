const express = require('express');
const { z } = require('zod');
const { pool } = require('../db/connection');
const { authenticate } = require('../middleware/authenticate');
const { validateInput } = require('../middleware/validateInput');
const { rateLimiter } = require('../middleware/rateLimiter');
const { auditLog } = require('../middleware/auditLog');

const router = express.Router();
router.use(authenticate);

// ─── Validation schemas ────────────────────────────────────────────────────────

const entrySchema = z.object({
  type:       z.enum(['expense', 'income']),
  amount:     z.number().positive(),
  currency:   z.string().max(5).optional(),
  category:   z.string().max(50).optional(),
  note:       z.string().max(500).optional(),
  entry_date: z.string().optional(),   // ISO date string; defaults to today
  source:     z.enum(['manual', 'voice', 'lumi']).optional(),
});

const goalSchema = z.object({
  month:            z.string(),              // 'YYYY-MM-01'
  declared_income:  z.number().min(0).optional(),
  category:         z.string().max(50).optional(),
  limit_amount:     z.number().min(0).optional(),
});

// ─── GET /budget/summary ───────────────────────────────────────────────────────
// Returns: today's spend, this-month spend, this-month income, category breakdown,
//          declared income, per-category limits, days left in month, daily average.
router.get('/summary', async (req, res) => {
  const uid = req.user.id;
  try {
    const [todayRow, monthRows, incomeRow, goalsRows, avgRow] = await Promise.all([
      // Today's total expense
      pool.query(
        `SELECT COALESCE(SUM(amount),0) AS total
         FROM budget_entries
         WHERE user_id=$1 AND type='expense' AND entry_date=CURRENT_DATE`,
        [uid]
      ),
      // This month expenses by category
      pool.query(
        `SELECT category, SUM(amount) AS total
         FROM budget_entries
         WHERE user_id=$1 AND type='expense'
           AND DATE_TRUNC('month', entry_date)=DATE_TRUNC('month', CURRENT_DATE)
         GROUP BY category
         ORDER BY total DESC`,
        [uid]
      ),
      // This month income
      pool.query(
        `SELECT COALESCE(SUM(amount),0) AS total
         FROM budget_entries
         WHERE user_id=$1 AND type='income'
           AND DATE_TRUNC('month', entry_date)=DATE_TRUNC('month', CURRENT_DATE)`,
        [uid]
      ),
      // Budget goals for this month
      pool.query(
        `SELECT category, limit_amount, declared_income
         FROM budget_goals
         WHERE user_id=$1
           AND DATE_TRUNC('month', month)=DATE_TRUNC('month', CURRENT_DATE)`,
        [uid]
      ),
      // 30-day daily average (expense)
      pool.query(
        `SELECT COALESCE(SUM(amount),0)/30 AS avg_daily
         FROM budget_entries
         WHERE user_id=$1 AND type='expense'
           AND entry_date >= CURRENT_DATE - INTERVAL '30 days'`,
        [uid]
      ),
    ]);

    const daysInMonth = new Date(
      new Date().getFullYear(), new Date().getMonth() + 1, 0
    ).getDate();
    const dayOfMonth = new Date().getDate();
    const daysLeft   = daysInMonth - dayOfMonth;

    const monthlyExpense = monthRows.rows.reduce((s, r) => s + parseFloat(r.total), 0);
    const declaredIncome = goalsRows.rows.find(r => r.category === 'total')?.declared_income || 0;

    res.json({
      today:          parseFloat(todayRow.rows[0].total),
      monthExpense:   monthlyExpense,
      monthIncome:    parseFloat(incomeRow.rows[0].total),
      declaredIncome: parseFloat(declaredIncome),
      surplus:        parseFloat(declaredIncome) - monthlyExpense,
      avgDaily:       parseFloat(avgRow.rows[0].avg_daily),
      daysLeft,
      categories:     monthRows.rows.map(r => ({ category: r.category, total: parseFloat(r.total) })),
      goals:          goalsRows.rows.map(r => ({
        category:     r.category,
        limit:        parseFloat(r.limit_amount),
        declared_income: parseFloat(r.declared_income || 0),
      })),
    });
  } catch (err) {
    console.error('Budget summary error:', err);
    res.status(500).json({ error: 'Failed to load budget summary' });
  }
});

// ─── GET /budget/entries ───────────────────────────────────────────────────────
// Query params: type (expense|income), days (default 30), limit (default 50)
router.get('/entries', async (req, res) => {
  const uid  = req.user.id;
  const days  = Math.min(parseInt(req.query.days  || '30', 10), 365);
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
  const type  = req.query.type; // optional filter

  try {
    const params = [uid, days, limit];
    const typeClause = type ? `AND type=$4` : '';
    if (type) params.push(type);

    const result = await pool.query(
      `SELECT id, type, amount, currency, category, note, entry_date, source, created_at
       FROM budget_entries
       WHERE user_id=$1
         AND entry_date >= CURRENT_DATE - ($2 || ' days')::INTERVAL
         ${typeClause}
       ORDER BY entry_date DESC, created_at DESC
       LIMIT $3`,
      params
    );
    res.json({ entries: result.rows });
  } catch (err) {
    console.error('Budget entries error:', err);
    res.status(500).json({ error: 'Failed to load entries' });
  }
});

// ─── POST /budget/entries ──────────────────────────────────────────────────────
// Side-effect: if type='expense', the new row is merged into the budget/Daily Expenses
// journal page entry for that date (two-way sync).
router.post(
  '/entries',
  rateLimiter(200, 900, 'budget_create'),
  validateInput(entrySchema),
  auditLog('budget_entry_create', 'budget_entries'),
  async (req, res) => {
    const uid = req.user.id;
    const { type, amount, currency, category, note, entry_date, source } = req.body;
    const eDate = entry_date || new Date().toISOString().slice(0, 10);
    try {
      const result = await pool.query(
        `INSERT INTO budget_entries (user_id, type, amount, currency, category, note, entry_date, source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING id, type, amount, currency, category, note, entry_date, source, created_at`,
        [uid, type, amount, currency || '₦', category || 'other', note || null,
         eDate, source || 'manual']
      );
      const entry = result.rows[0];

      // ── Budget two-way sync: budget_entries → journal Daily Expenses ────────
      // Only sync expenses (not income) and skip journal-sourced entries to avoid loops.
      if (type === 'expense' && source !== 'journal') {
        const newRow = {
          description: note || category || 'Expense',
          category:    category || 'other',
          amount:      String(amount),
        };

        // Load today's existing journal page fields (if any)
        const existing = await pool.query(
          `SELECT id, fields FROM journal_page_entries
           WHERE user_id=$1 AND journal_type='budget' AND template_name='Daily Expenses' AND entry_date=$2
           LIMIT 1`,
          [uid, eDate]
        ).catch(() => ({ rows: [] }));

        const existingRows = Array.isArray(existing.rows[0]?.fields?.rows)
          ? existing.rows[0].fields.rows
          : [];

        const mergedRows = [...existingRows, newRow];

        await pool.query(
          `INSERT INTO journal_page_entries
             (user_id, journal_type, template_name, entry_date, fields, source)
           VALUES ($1,'budget','Daily Expenses',$2,$3::jsonb,'budget_app')
           ON CONFLICT (user_id, journal_type, template_name, entry_date)
           DO UPDATE SET
             fields     = $3::jsonb,
             source     = 'budget_app',
             updated_at = NOW()`,
          [uid, eDate, JSON.stringify({ rows: mergedRows })]
        ).catch(err => console.warn('[Budget sync→journal]', err.message));
      }

      res.status(201).json({ entry });
    } catch (err) {
      console.error('Budget create error:', err);
      res.status(500).json({ error: 'Failed to save entry' });
    }
  }
);

// ─── DELETE /budget/entries/:id ────────────────────────────────────────────────
router.delete('/entries/:id', auditLog('budget_entry_delete', 'budget_entries'), async (req, res) => {
  const uid = req.user.id;
  try {
    const result = await pool.query(
      `DELETE FROM budget_entries WHERE id=$1 AND user_id=$2 RETURNING id`,
      [req.params.id, uid]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Entry not found' });
    res.json({ deleted: req.params.id });
  } catch (err) {
    console.error('Budget delete error:', err);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

// ─── PUT /budget/goals ─────────────────────────────────────────────────────────
router.put(
  '/goals',
  validateInput(goalSchema),
  auditLog('budget_goal_upsert', 'budget_goals'),
  async (req, res) => {
    const uid = req.user.id;
    const { month, declared_income, category, limit_amount } = req.body;
    const cat = category || 'total';
    try {
      const result = await pool.query(
        `INSERT INTO budget_goals (user_id, month, category, limit_amount, declared_income)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (user_id, month, category)
         DO UPDATE SET
           limit_amount    = EXCLUDED.limit_amount,
           declared_income = EXCLUDED.declared_income,
           updated_at      = NOW()
         RETURNING *`,
        [uid, month, cat, limit_amount ?? 0, declared_income ?? 0]
      );
      res.json({ goal: result.rows[0] });
    } catch (err) {
      console.error('Budget goals error:', err);
      res.status(500).json({ error: 'Failed to save goal' });
    }
  }
);

module.exports = router;
