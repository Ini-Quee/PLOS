/**
 * One-time backfill: encrypt existing plaintext OAuth tokens in user_oauth_tokens.
 * Run: node src/scripts/backfillOauthTokens.js
 * DELETE this file after running.
 */
require('dotenv').config();
const { pool } = require('../db/connection');
const { encrypt } = require('../crypto/tokenCipher');

async function backfill() {
  const { rows } = await pool.query(
    `SELECT id, access_token, refresh_token FROM user_oauth_tokens`
  );

  let updated = 0;
  for (const row of rows) {
    const needsEncrypt = row.access_token && !String(row.access_token).startsWith('v1:');
    if (!needsEncrypt) continue;

    await pool.query(
      `UPDATE user_oauth_tokens SET access_token=$1, refresh_token=$2, updated_at=NOW() WHERE id=$3`,
      [encrypt(row.access_token), encrypt(row.refresh_token), row.id]
    );
    updated++;
    console.log(`  encrypted tokens for row ${row.id}`);
  }

  console.log(`Done. ${updated}/${rows.length} rows updated.`);
  await pool.end();
}

backfill().catch((err) => {
  console.error('Backfill failed:', err.message);
  process.exit(1);
});
