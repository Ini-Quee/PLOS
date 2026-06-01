/**
 * AES-256-GCM envelope encryption for secrets at rest (OAuth tokens).
 * Key comes from env TOKEN_ENC_KEY (64 hex chars = 32 bytes). Key lives OUTSIDE the DB by design.
 * Format: v1:<iv_hex>:<tag_hex>:<ciphertext_hex>
 */
const crypto = require('crypto');

function key() {
  const k = process.env.TOKEN_ENC_KEY || '';
  if (!/^[0-9a-fA-F]{64}$/.test(k)) {
    throw new Error('TOKEN_ENC_KEY must be 64 hex chars (32 bytes)');
  }
  return Buffer.from(k, 'hex');
}

function encrypt(plain) {
  if (plain == null) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const ct = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString('hex')}:${tag.toString('hex')}:${ct.toString('hex')}`;
}

function decrypt(blob) {
  if (blob == null) return null;
  const parts = String(blob).split(':');
  if (parts[0] !== 'v1' || parts.length !== 4) return blob; // tolerate legacy plaintext during migration
  const [, ivH, tagH, ctH] = parts;
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(ivH, 'hex'));
  decipher.setAuthTag(Buffer.from(tagH, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(ctH, 'hex')), decipher.final()]).toString('utf8');
}

module.exports = { encrypt, decrypt };
