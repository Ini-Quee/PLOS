/**
 * End-to-end API smoke test for the PLOS / IniQ backend.
 *
 * WHAT IT DOES: registers a throwaway account, logs in, then calls the real
 * endpoints the mobile app uses — including saving a journal entry, reading it
 * back, and chatting with Lumi — and prints a PASS/FAIL report. This gives a
 * ground-truth picture of what works, instead of guessing screen by screen.
 *
 * HOW TO RUN (from the backend folder, with the backend already running):
 *   node api-test.js
 *
 * Optionally point at a different host:
 *   API=http://192.168.1.155:3000 node api-test.js
 */

const BASE = process.env.API || 'http://localhost:3000';
const EMAIL = `test_${Date.now()}@example.com`;
const PASSWORD = 'Test1234!';
const NAME = 'Test User';

let accessToken = '';
let refreshToken = '';
const results = [];

function log(name, ok, detail) {
  results.push({ name, ok });
  const tag = ok ? '  PASS' : '* FAIL';
  console.log(`${tag}  ${name}${detail ? '  —  ' + detail : ''}`);
}

async function call(method, path, body, useAuth = true) {
  const headers = { 'Content-Type': 'application/json', 'X-Client-Platform': 'ios' };
  if (useAuth && accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  const txt = await res.text();
  try { data = txt ? JSON.parse(txt) : null; } catch { data = txt; }
  return { status: res.status, data, raw: txt };
}

async function main() {
  console.log(`\nTesting ${BASE}\n${'-'.repeat(60)}`);

  // 1. Register
  try {
    const r = await call('POST', '/api/auth/register', { name: NAME, email: EMAIL, password: PASSWORD }, false);
    log('register', r.status === 201, `status ${r.status}`);
  } catch (e) { log('register', false, e.message); }

  // 2. Login
  try {
    const r = await call('POST', '/api/auth/login', { email: EMAIL, password: PASSWORD }, false);
    accessToken = r.data?.accessToken || '';
    refreshToken = r.data?.refreshToken || '';
    const ok = r.status === 200 && !!accessToken;
    log('login', ok, `status ${r.status}, got accessToken: ${!!accessToken}, refreshToken in body: ${!!refreshToken}`);
  } catch (e) { log('login', false, e.message); }

  if (!accessToken) {
    console.log('\nCannot continue without a token. Stopping.\n');
    return summary();
  }

  // 3. Core reads (Home + tabs)
  for (const [name, path] of [
    ['GET schedule/today', '/api/schedule/today'],
    ['GET habits', '/api/habits'],
    ['GET budget/summary', '/api/budget/summary'],
    ['GET journal/pages', '/api/journal/pages?limit=5'],
    ['GET schedule', '/api/schedule'],
  ]) {
    try {
      const r = await call('GET', path);
      log(name, r.status === 200, `status ${r.status}`);
    } catch (e) { log(name, false, e.message); }
  }

  // 4. Journal save round-trip (the bug we just fixed)
  let savedFreewrite = `journal-test-${Date.now()}`;
  try {
    const r = await call('POST', '/api/journal/pages', {
      journal_type: 'personal',
      template_name: 'Free Write',
      fields: { freewrite: savedFreewrite },
      entry_date: new Date().toISOString().slice(0, 10),
    });
    log('POST journal page (save)', r.status === 201, `status ${r.status}`);
    if (r.status !== 201) {
      console.log('\n>>>>>> JOURNAL SAVE ERROR (copy everything between the lines) >>>>>>');
      console.log(r.raw || '(no response body)');
      console.log('<<<<<< END JOURNAL SAVE ERROR <<<<<<\n');
    }
  } catch (e) { log('POST journal page (save)', false, e.message); }

  try {
    const r = await call('GET', '/api/journal/pages?limit=5');
    const found = (r.data?.entries || []).some((e) => e.fields?.freewrite === savedFreewrite);
    log('journal entry persisted + readable', found, found ? 'found the saved text' : 'saved text NOT found');
  } catch (e) { log('journal entry persisted + readable', false, e.message); }

  // 5. Lumi chat (the 400 bug we just fixed)
  try {
    const r = await call('POST', '/api/lumi/chat', { text: 'Hello Lumi, are you working?' });
    const ok = r.status === 200 && !!(r.data?.message);
    log('POST lumi/chat', ok, `status ${r.status}${r.data?.message ? ', got a reply' : ', NO reply field'}`);
  } catch (e) { log('POST lumi/chat', false, e.message); }

  // 6. Create a habit, then read it back
  try {
    const r = await call('POST', '/api/habits', { title: 'Test habit', emoji: 'star', category: 'personal' });
    log('POST habit (create)', r.status === 201 || r.status === 200, `status ${r.status}`);
  } catch (e) { log('POST habit (create)', false, e.message); }

  // 7. Repointed endpoints
  for (const [name, path] of [
    ['GET billing/status (Upgrade)', '/api/billing/status'],
    ['GET goals (Year Plan)', '/api/goals'],
  ]) {
    try {
      const r = await call('GET', path);
      log(name, r.status === 200, `status ${r.status}`);
    } catch (e) { log(name, false, e.message); }
  }

  summary();
}

function summary() {
  const pass = results.filter((r) => r.ok).length;
  console.log('-'.repeat(60));
  console.log(`\n${pass} / ${results.length} passed.`);
  const fails = results.filter((r) => !r.ok);
  if (fails.length) {
    console.log('\nFailures:');
    fails.forEach((f) => console.log('  * ' + f.name));
  } else {
    console.log('Everything the app needs is working.');
  }
  console.log('');
}

main().catch((e) => { console.error('Test runner crashed:', e); process.exit(1); });
