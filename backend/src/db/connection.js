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

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      if (!file.endsWith('.sql')) continue;

      // Check if already applied — read BEFORE opening transaction for this file
      const { rows } = await client.query(
        'SELECT 1 FROM schema_migrations WHERE filename = $1',
        [file]
      );
      if (rows.length > 0) continue;

      // Run the migration SQL and the tracking INSERT in ONE transaction.
      // If either step fails the whole thing rolls back — state stays consistent.
      await client.query('BEGIN');
      try {
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log('[Migration] applied:', file);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error('[Migration] FAILED:', file, err.message);
        throw err; // propagate — server will not start with a broken migration
      }
    }
  } finally {
    client.release();
  }
}

module.exports = { pool, runMigrations };
