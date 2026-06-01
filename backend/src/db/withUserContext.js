/**
 * Runs fn with a pooled client that has app.current_user_id set (transaction-local).
 * Drops to plos_app role inside the transaction so FORCE RLS policies are enforced
 * (superuser always bypasses RLS, even with FORCE).
 *
 * Usage: await withUserContext(userId, async (client) => client.query(...));
 */
const { pool } = require('./connection');

async function withUserContext(userId, fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.current_user_id', $1, true)", [String(userId)]);
    await client.query('SET LOCAL ROLE plos_app');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
module.exports = { withUserContext };
