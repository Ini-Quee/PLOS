/**
 * Central structured logger. JSON lines to stdout.
 * SECURITY: only allowlisted fields may be logged. Never log raw user content.
 * Allowed: requestId, userId, route, intent, action, resource, where, err, status, ms, ip
 */
let pino;
try { pino = require('pino'); } catch { pino = null; }

const ALLOWED = new Set([
  'requestId','userId','route','intent','action','resource',
  'where','err','status','ms','ip','event','count',
]);

function redact(obj = {}) {
  const out = {};
  for (const k of Object.keys(obj)) {
    if (ALLOWED.has(k)) out[k] = obj[k];
  }
  return out;
}

const base = pino
  ? pino({ level: process.env.LOG_LEVEL || 'info' })
  : {
      info:  (o, m) => console.log(JSON.stringify({ level: 'info',  ...redact(o), msg: m })),
      warn:  (o, m) => console.warn(JSON.stringify({ level: 'warn',  ...redact(o), msg: m })),
      error: (o, m) => console.error(JSON.stringify({ level: 'error', ...redact(o), msg: m })),
    };

module.exports = {
  info:  (fields, msg) => base.info(redact(fields), msg),
  warn:  (fields, msg) => base.warn(redact(fields), msg),
  error: (fields, msg) => base.error(redact(fields), msg),
};
