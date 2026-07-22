const { pool } = require('../db/connection');
const logger = require('../lib/logger');

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

async function executeAction(userId, action, actionLogId = null, reqLogger = logger) {
  const p = action.payload || {};
  const t = action.target || {};
  switch (action.type) {
    case 'create_journal_entry': {
      const { rows } = await pool.query(
        `INSERT INTO journal_page_entries
           (user_id, journal_type, template_name, entry_date, fields, source)
         VALUES ($1,$2,$3,$4,$5::jsonb,'lumi')
         ON CONFLICT (user_id, journal_type, template_name, entry_date)
         DO UPDATE SET fields=journal_page_entries.fields || $5::jsonb, source='lumi', updated_at=NOW(), archived_at=NULL
         RETURNING *`,
        [userId, p.journal_type, p.template_name, p.entry_date || todayIso(), JSON.stringify(p.fields || {})]
      );
      return rows[0];
    }
    case 'append_journal_entry': {
      const { rows } = await pool.query(
        `UPDATE journal_page_entries
            SET fields=fields || $1::jsonb, source='lumi', updated_at=NOW()
          WHERE id=$2 AND user_id=$3 AND archived_at IS NULL
          RETURNING *`,
        [JSON.stringify(p.fields || {}), p.entry_id, userId]
      );
      return rows[0];
    }
    case 'update_journal_entry': {
      const { rows } = await pool.query(
        `UPDATE journal_page_entries
            SET fields=$1::jsonb, source='lumi', updated_at=NOW()
          WHERE id=$2 AND user_id=$3 AND archived_at IS NULL
          RETURNING *`,
        [JSON.stringify(p.fields || {}), p.entry_id, userId]
      );
      return rows[0];
    }
    case 'archive_journal_entry': {
      const { rows } = await pool.query(
        `UPDATE journal_page_entries
            SET archived_at=NOW(), archived_by_lumi_action_id=$1, updated_at=NOW()
          WHERE id=$2 AND user_id=$3 AND archived_at IS NULL
          RETURNING id`,
        [actionLogId, p.entry_id, userId]
      );
      return rows[0];
    }
    case 'update_journal_type': {
      const fields = [];
      const values = [p.journal_type_id, userId];
      let i = 3;
      for (const key of ['label', 'emoji', 'color', 'templates', 'routing_keywords', 'display_order']) {
        if (p[key] !== undefined) {
          const cast = ['templates', 'routing_keywords'].includes(key) ? '::jsonb' : '';
          fields.push(`${key}=$${i++}${cast}`);
          values.push(['templates', 'routing_keywords'].includes(key) ? JSON.stringify(p[key]) : p[key]);
        }
      }
      if (!fields.length) return null;
      fields.push('updated_at=NOW()');
      const { rows } = await pool.query(
        `UPDATE user_journal_types SET ${fields.join(', ')}
          WHERE id=$1 AND user_id=$2 AND is_active=true RETURNING *`,
        values
      );
      return rows[0];
    }
    case 'archive_journal_type': {
      const { rows } = await pool.query(
        `UPDATE user_journal_types
            SET is_active=false, archived_at=NOW(), archived_by_lumi_action_id=$1, updated_at=NOW()
          WHERE id=$2 AND user_id=$3 RETURNING id`,
        [actionLogId, p.journal_type_id, userId]
      );
      return rows[0];
    }
    case 'create_schedule_item': {
      const { rows } = await pool.query(
        `INSERT INTO schedules
          (user_id,title,description,start_time,duration_minutes,repeat_pattern,repeat_days,category,colour,is_high_priority,target_date,is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true)
         RETURNING *`,
        [
          userId, p.title, p.description || null, p.start_time,
          p.duration_minutes || 60, p.repeat_pattern || 'none', p.repeat_days || null,
          p.category || 'personal', p.colour || '#F5A623', !!p.is_high_priority, p.target_date || null,
        ]
      );
      return rows[0];
    }
    case 'update_schedule_item': {
      const existing = t.record || {};
      const next = { ...existing, ...p };
      const { rows } = await pool.query(
        `UPDATE schedules SET
           title=$1, description=$2, start_time=$3, duration_minutes=$4, repeat_pattern=$5,
           repeat_days=$6, category=$7, colour=$8, is_high_priority=$9, is_active=$10,
           target_date=$11, updated_at=NOW()
         WHERE id=$12 AND user_id=$13
         RETURNING *`,
        [
          next.title, next.description || null, next.start_time, next.duration_minutes || 60,
          next.repeat_pattern || 'none', next.repeat_days || null, next.category || 'personal',
          next.colour || '#F5A623', !!next.is_high_priority, next.is_active !== false,
          next.target_date || null, p.schedule_id, userId,
        ]
      );
      return rows[0];
    }
    case 'complete_schedule_item':
    case 'uncomplete_schedule_item': {
      if (action.type === 'uncomplete_schedule_item') {
        await pool.query(
          `DELETE FROM schedule_completions WHERE schedule_id=$1 AND user_id=$2 AND completion_date=CURRENT_DATE`,
          [p.schedule_id, userId]
        );
        return { id: p.schedule_id, completed: false };
      }
      const { rows } = await pool.query(
        `INSERT INTO schedule_completions (schedule_id,user_id,completion_date,notes)
         VALUES ($1,$2,CURRENT_DATE,$3)
         ON CONFLICT (schedule_id, completion_date)
         DO UPDATE SET completed_at=NOW(), notes=EXCLUDED.notes
         RETURNING *`,
        [p.schedule_id, userId, p.notes || null]
      );
      return rows[0];
    }
    case 'archive_schedule_item': {
      const { rows } = await pool.query(
        `UPDATE schedules SET is_active=false, updated_at=NOW()
          WHERE id=$1 AND user_id=$2 RETURNING id`,
        [p.schedule_id, userId]
      );
      return rows[0];
    }
    case 'create_habit': {
      const { rows } = await pool.query(
        `INSERT INTO habits (user_id,title,emoji,category,target_days,identity_label)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [userId, p.title, p.emoji || '✅', p.category || 'personal', p.target_days || [0,1,2,3,4,5,6], p.identity_label || '']
      );
      return rows[0];
    }
    case 'update_habit': {
      const existing = t.record || {};
      const next = { ...existing, ...p };
      const { rows } = await pool.query(
        `UPDATE habits SET title=$1, emoji=$2, category=$3, target_days=$4, identity_label=$5, updated_at=NOW()
          WHERE id=$6 AND user_id=$7 AND is_active=true RETURNING *`,
        [next.title, next.emoji || '✅', next.category || 'personal', next.target_days || [0,1,2,3,4,5,6], next.identity_label || '', p.habit_id, userId]
      );
      return rows[0];
    }
    case 'log_habit_completion':
    case 'undo_habit_completion': {
      if (action.type === 'undo_habit_completion') {
        await pool.query(
          `DELETE FROM habit_completions WHERE habit_id=$1 AND user_id=$2 AND completion_date=CURRENT_DATE`,
          [p.habit_id, userId]
        );
        return { id: p.habit_id, completed: false };
      }
      const { rows } = await pool.query(
        `INSERT INTO habit_completions (habit_id,user_id,completion_date,identity_score)
         VALUES ($1,$2,CURRENT_DATE,$3)
         ON CONFLICT (habit_id, completion_date)
         DO UPDATE SET identity_score=EXCLUDED.identity_score
         RETURNING *`,
        [p.habit_id, userId, p.identity_score ?? null]
      );
      return rows[0];
    }
    case 'revive_habit': {
      const { rows } = await pool.query(
        `UPDATE habits SET revival_tokens=GREATEST(COALESCE(revival_tokens, 0)-1, 0), updated_at=NOW()
          WHERE id=$1 AND user_id=$2 AND COALESCE(revival_tokens, 0) > 0 RETURNING id, revival_tokens`,
        [p.habit_id, userId]
      );
      if (rows.length) {
        await pool.query(
          `INSERT INTO habit_completions (habit_id,user_id,completion_date)
           VALUES ($1,$2,CURRENT_DATE - 1)
           ON CONFLICT (habit_id, completion_date) DO NOTHING`,
          [p.habit_id, userId]
        );
      }
      return rows[0] || null;
    }
    case 'archive_habit': {
      const { rows } = await pool.query(
        `UPDATE habits SET is_active=false, updated_at=NOW()
          WHERE id=$1 AND user_id=$2 RETURNING id`,
        [p.habit_id, userId]
      );
      return rows[0];
    }
    case 'create_budget_entry': {
      const { rows } = await pool.query(
        `INSERT INTO budget_entries (user_id,type,amount,currency,category,note,entry_date,source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'lumi') RETURNING *`,
        [userId, p.type || 'expense', Number(p.amount), p.currency || '₦', p.category || 'other', p.note || null, p.entry_date || todayIso()]
      );
      return rows[0];
    }
    case 'update_budget_entry': {
      const existing = t.record || {};
      const next = { ...existing, ...p };
      const { rows } = await pool.query(
        `UPDATE budget_entries SET type=$1, amount=$2, currency=$3, category=$4, note=$5, entry_date=$6
          WHERE id=$7 AND user_id=$8 AND archived_at IS NULL RETURNING *`,
        [next.type || 'expense', Number(next.amount), next.currency || '₦', next.category || 'other', next.note || null, next.entry_date || existing.entry_date, p.entry_id, userId]
      );
      return rows[0];
    }
    case 'archive_budget_entry': {
      const { rows } = await pool.query(
        `UPDATE budget_entries SET archived_at=NOW(), archived_by_lumi_action_id=$1
          WHERE id=$2 AND user_id=$3 AND archived_at IS NULL RETURNING id`,
        [actionLogId, p.entry_id, userId]
      );
      return rows[0];
    }
    case 'create_goal': {
      const { rows } = await pool.query(
        `INSERT INTO year_goals (user_id,title,description,year,quarter,month,week)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [userId, p.title, p.description || null, p.year || new Date().getFullYear(), p.quarter || null, p.month || null, p.week || null]
      );
      return rows[0];
    }
    case 'update_goal':
    case 'complete_goal': {
      const existing = t.record || {};
      const next = action.type === 'complete_goal'
        ? { ...existing, is_complete: true, completed_at: new Date().toISOString() }
        : { ...existing, ...p };
      const { rows } = await pool.query(
        `UPDATE year_goals SET title=$1, description=$2, year=$3, quarter=$4, month=$5, week=$6,
             is_complete=$7, completed_at=$8, updated_at=NOW()
          WHERE id=$9 AND user_id=$10 AND archived_at IS NULL RETURNING *`,
        [next.title, next.description || null, next.year || new Date().getFullYear(), next.quarter || null, next.month || null, next.week || null, !!next.is_complete, next.completed_at || null, p.goal_id, userId]
      );
      return rows[0];
    }
    case 'archive_goal': {
      const { rows } = await pool.query(
        `UPDATE year_goals SET archived_at=NOW(), archived_by_lumi_action_id=$1, updated_at=NOW()
          WHERE id=$2 AND user_id=$3 AND archived_at IS NULL RETURNING id`,
        [actionLogId, p.goal_id, userId]
      );
      return rows[0];
    }
    case 'create_memory': {
      const { rows } = await pool.query(
        `INSERT INTO lumi_memories (user_id,memory_type,memory_category,content,importance,source)
         VALUES ($1,$2,$3,$4,$5,'chat') RETURNING id, memory_type, memory_category, content`,
        [userId, p.memory_type || 'fact', p.memory_category || p.memory_type || 'fact', p.content, Math.min(10, Math.max(1, Number(p.importance || 5)))]
      );
      return rows[0];
    }
    case 'update_memory': {
      const existing = t.record || {};
      const next = { ...existing, ...p };
      const { rows } = await pool.query(
        `UPDATE lumi_memories SET memory_type=$1, memory_category=$2, content=$3, importance=$4, updated_at=NOW()
          WHERE id=$5 AND user_id=$6 RETURNING id, memory_type, memory_category, content`,
        [next.memory_type || 'fact', next.memory_category || next.memory_type || 'fact', next.content, Math.min(10, Math.max(1, Number(next.importance || 5))), p.memory_id, userId]
      );
      return rows[0];
    }
    case 'forget_memory': {
      const { rows } = await pool.query(
        `DELETE FROM lumi_memories WHERE id=$1 AND user_id=$2 RETURNING id`,
        [p.memory_id, userId]
      );
      return rows[0];
    }
    default:
      throw new Error(`Unsupported Lumi action: ${action.type}`);
  }
}

module.exports = { executeAction };
