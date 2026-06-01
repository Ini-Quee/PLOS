/**
 * Pre-P-01c this fails (returns all rows) and documents F-01.
 * Post-P-01c it must pass via FORCE RLS.
 *
 * The gap: journal_page_entries has ENABLE ROW LEVEL SECURITY but not FORCE.
 * The application pool connects as a superuser, so PostgreSQL bypasses
 * the RLS policy entirely. An unscoped SELECT inside withUserContext returns
 * every tenant's rows, not just the current user's.
 *
 * This test proves the gap by dropping to a non-superuser role (rls_test_user)
 * inside the transaction. Without FORCE RLS, even the non-superuser sees all
 * rows because the policy only fires for non-owners in the non-FORCE case.
 * With FORCE RLS, the policy fires for everyone including owners.
 *
 * P-01c must add: ALTER TABLE journal_page_entries FORCE ROW LEVEL SECURITY;
 * Once that lands, this test turns green.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '..', '.env') });
const test = require('node:test');
const assert = require('node:assert/strict');
const { pool } = require('../../db/connection');
const { withUserContext } = require('../../db/withUserContext');

// Unique prefix so parallel runs never collide
const PREFIX = `ti_${Date.now()}`;

const userA = { id: null, email: `${PREFIX}_a@test.local`, name: 'Tenant A' };
const userB = { id: null, email: `${PREFIX}_b@test.local`, name: 'Tenant B' };

async function ensureTestRole(client) {
  // Create a non-superuser role for RLS testing (idempotent)
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rls_test_user') THEN
        CREATE ROLE rls_test_user NOLOGIN;
      END IF;
    END $$;
    GRANT SELECT ON journal_page_entries TO rls_test_user;
  `);
}

async function setup(client) {
  const a = await client.query(
    `INSERT INTO users (email, password_hash, name)
     VALUES ($1, 'x', $2) RETURNING id`,
    [userA.email, userA.name]
  );
  userA.id = a.rows[0].id;

  const b = await client.query(
    `INSERT INTO users (email, password_hash, name)
     VALUES ($1, 'x', $2) RETURNING id`,
    [userB.email, userB.name]
  );
  userB.id = b.rows[0].id;

  await client.query(
    `INSERT INTO journal_page_entries
       (user_id, journal_type, template_name, entry_date, fields, source)
     VALUES ($1, 'personal', 'Classic Diary', CURRENT_DATE, '{"body":"A"}', 'user')`,
    [userA.id]
  );

  await client.query(
    `INSERT INTO journal_page_entries
       (user_id, journal_type, template_name, entry_date, fields, source)
     VALUES ($1, 'personal', 'Classic Diary', CURRENT_DATE, '{"body":"B"}', 'user')`,
    [userB.id]
  );
}

async function cleanup(client) {
  await client.query(
    `DELETE FROM journal_page_entries WHERE user_id IN ($1, $2)`,
    [userA.id, userB.id]
  );
  await client.query(
    `DELETE FROM users WHERE id IN ($1, $2)`,
    [userA.id, userB.id]
  );
}

test('F-01: unscoped query inside withUserContext must return ONLY current user rows', async () => {
  const client = await pool.connect();
  try {
    await ensureTestRole(client);
    await setup(client);

    // ---------------------------------------------------------------
    // The critical query: SELECT COUNT(*) with NO WHERE user_id clause.
    //
    // We SET ROLE to a non-superuser inside the transaction so that
    // PostgreSQL actually evaluates the RLS policy. The pool normally
    // connects as superuser, which bypasses RLS even with FORCE.
    //
    // After FORCE RLS (033): even the table owner role is subject to
    // the policy, so this query returns only B's row (count === 1).
    // ---------------------------------------------------------------
    const result = await withUserContext(userB.id, async (ctx) => {
      await ctx.query('SET LOCAL ROLE rls_test_user');
      return ctx.query('SELECT COUNT(*)::int AS cnt FROM journal_page_entries');
    });

    const count = result.rows[0].cnt;

    assert.equal(count, 1,
      `F-01 TENANT LEAK: withUserContext(${userB.id.slice(0,8)}…) ` +
      `returned ${count} rows instead of 1. ` +
      `RLS is not FORCEd — all tenants are visible.`
    );
  } finally {
    await cleanup(client);
    client.release();
    await pool.end();
  }
});
