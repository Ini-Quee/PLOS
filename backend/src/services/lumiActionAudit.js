const { randomUUID } = require('crypto');
const { pool } = require('../db/connection');
const { redactPreview } = require('./lumiActionPreview');

function summarizePayload(payload = {}) {
  const copy = { ...payload };
  for (const key of ['content', 'body', 'narrative']) {
    if (copy[key] && String(copy[key]).length > 160) copy[key] = `${String(copy[key]).slice(0, 160)}...`;
  }
  if (copy.fields) {
    copy.fields = JSON.parse(JSON.stringify(copy.fields));
    for (const key of Object.keys(copy.fields)) {
      if (typeof copy.fields[key] === 'string' && copy.fields[key].length > 160) {
        copy.fields[key] = `${copy.fields[key].slice(0, 160)}...`;
      }
    }
  }
  return copy;
}

async function logProposedActions(userId, actions = []) {
  const proposalId = randomUUID();
  const logged = [];
  for (const action of actions) {
    const actionId = action.id || randomUUID();
    await pool.query(
      `INSERT INTO lumi_action_log
         (user_id, proposal_id, action_id, action_type, domain, operation, status,
          confirmation_level, target, action_data, payload_summary, preview_summary)
       VALUES ($1,$2,$3,$4,$5,$6,'proposed',$7,$8::jsonb,$9::jsonb,$10::jsonb,$11::jsonb)`,
      [
        userId,
        proposalId,
        actionId,
        action.type,
        action.domain,
        action.operation,
        action.confirmationLevel,
        JSON.stringify(action.targetSummary || {}),
        JSON.stringify({ ...action, id: actionId }),
        JSON.stringify(summarizePayload(action.payload || {})),
        JSON.stringify(redactPreview(action.preview || {})),
      ]
    );
    logged.push({ ...action, id: actionId });
  }
  return { proposalId, actions: logged };
}

async function loadProposedActions(userId, proposalId, actionIds = []) {
  const params = [userId, proposalId];
  let clause = '';
  if (actionIds.length > 0) {
    params.push(actionIds);
    clause = 'AND action_id = ANY($3::uuid[])';
  }
  const { rows } = await pool.query(
    `SELECT * FROM lumi_action_log
      WHERE user_id=$1 AND proposal_id=$2 AND status='proposed' ${clause}
      ORDER BY created_at ASC`,
    params
  );
  return rows;
}

async function markActionStatus(userId, actionId, status, error = null) {
  const fields = {
    confirmed: 'confirmed_at',
    executed: 'executed_at',
    failed: 'executed_at',
    cancelled: 'cancelled_at',
  };
  const timeField = fields[status];
  await pool.query(
    `UPDATE lumi_action_log
        SET status=$1, error=$2, ${timeField || 'executed_at'}=NOW()
      WHERE user_id=$3 AND action_id=$4`,
    [status, error, userId, actionId]
  );
}

async function cancelProposal(userId, proposalId, reason = null) {
  const { rowCount } = await pool.query(
    `UPDATE lumi_action_log
        SET status='cancelled', error=$3, cancelled_at=NOW()
      WHERE user_id=$1 AND proposal_id=$2 AND status='proposed'`,
    [userId, proposalId, reason]
  );
  return rowCount;
}

module.exports = {
  cancelProposal,
  loadProposedActions,
  logProposedActions,
  markActionStatus,
  summarizePayload,
};
