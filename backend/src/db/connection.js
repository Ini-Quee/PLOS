const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('PostgreSQL connection error:', err);
  process.exit(1);
});

async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      if (file.endsWith('.sql')) {
        const { rows } = await client.query(
          'SELECT 1 FROM schema_migrations WHERE filename = $1',
          [file]
        );

        if (rows.length > 0) {
          console.log('Migration already applied:', file);
          continue;
        }

        try {
          const sql = fs.readFileSync(
            path.join(migrationsDir, file),
            'utf8'
          );
          await client.query(sql);
          await client.query(
            'INSERT INTO schema_migrations (filename) VALUES ($1)',
            [file]
          );
          console.log('Migration applied:', file);
        } catch (err) {
          console.error('Migration failed:', file, err);
          throw err;
        }
      }
    }
  } finally {
    client.release();
  }
}

module.exports = { pool, runMigrations };
