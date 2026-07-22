const { Pool } = require('pg');
const fs   = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('PostgreSQL connection error:', err);
  process.exit(1);
});

async function runMigrations() {
  const client = await pool.connect();
  try {
    // Create tracking table outside of a migration transaction so it always exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename   TEXT        PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    console.log('--- Initial schema_migrations state ---');
    const initialMigrations = await client.query('SELECT filename FROM schema_migrations ORDER BY filename;');
    if (initialMigrations.rows.length === 0) {
      console.log('(empty)');
    } else {
      console.log(initialMigrations.rows.map(r => r.filename));
    }
    console.log('------------------------------------');

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      if (!file.endsWith('.sql')) continue;

      console.log(`\nProcessing: ${file}`);

      // Check if already applied — read BEFORE opening transaction for this file
      const { rows } = await client.query(
        'SELECT 1 FROM schema_migrations WHERE filename = $1',
        [file]
      );
      const alreadyApplied = rows.length > 0;
      console.log(`Already applied: ${alreadyApplied}`);

      if (alreadyApplied) {
        console.log('SKIPPED');
        continue;
      }

      // Run the migration SQL and the tracking INSERT in ONE transaction.
      // If either step fails the whole thing rolls back — state stays consistent.
      console.log('BEGIN');
      await client.query('BEGIN');
      try {
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)', [file]
        );
        await client.query('COMMIT');
        console.log('COMMIT');
        console.log(`[Migration] applied: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[Migration] FAILED: ${file}`);
        console.error('--- PostgreSQL Error ---');
        console.error(err);
        console.error('------------------------');

        const usersTableCheck = await client.query("SELECT to_regclass('public.users');");
        console.log('\n--- Final state of public.users table ---');
        console.log(usersTableCheck.rows[0]);
        console.log('---------------------------------------');

        throw err; // propagate — server will not start with a broken migration
      }
    }
  } finally {
    client.release();
  }
}

module.exports = { pool, runMigrations };
