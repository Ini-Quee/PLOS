/**
 * One-command journal diagnosis.
 *
 * Run from the backend folder:
 *   node diagnose.js
 *
 * It will, by itself:
 *   1. Start the backend if it isn't already running.
 *   2. Make a throwaway account and log in.
 *   3. Try to save a journal entry.
 *   4. Print the EXACT error if it fails.
 *   5. Shut the backend back down (only if it started it).
 *
 * Then just copy everything it printed and paste it back.
 */

const { spawn } = require('child_process');
const path = require('path');

const BASE = 'http://localhost:3000';
const EMAIL = `diag_${Date.now()}@example.com`;
const PASSWORD = 'Test1234!';

async function isUp() {
  try {
    await fetch(BASE + '/', { method: 'GET' });
    return true;
  } catch {
    return false;
  }
}

async function waitUntilUp(timeoutMs = 40000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isUp()) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function call(method, path_, body, token) {
  const headers = { 'Content-Type': 'application/json', 'X-Client-Platform': 'ios' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path_, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const raw = await res.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = null; }
  return { status: res.status, data, raw };
}

async function main() {
  console.log('================ JOURNAL DIAGNOSIS ================\n');

  let child = null;
  if (await isUp()) {
    console.log('Backend already running — using it.\n');
  } else {
    console.log('Backend is off. Starting it (this can take ~10 seconds)...\n');
    child = spawn(process.execPath, ['server.js'], { cwd: __dirname, stdio: 'ignore' });
    if (!(await waitUntilUp())) {
      console.log('COULD NOT START THE BACKEND. Paste this whole message back.');
      if (child) child.kill();
      process.exit(0);
    }
    console.log('Backend started.\n');
  }

  try {
    const reg = await call('POST', '/api/auth/register', { name: 'Diag', email: EMAIL, password: PASSWORD });
    console.log('register status:', reg.status);

    const login = await call('POST', '/api/auth/login', { email: EMAIL, password: PASSWORD });
    console.log('login status:', login.status);
    const token = login.data?.accessToken;
    if (!token) {
      console.log('No token from login. Raw login response:\n', login.raw);
      return;
    }

    const save = await call('POST', '/api/journal/pages', {
      journal_type: 'personal',
      template_name: 'Free Write',
      fields: { freewrite: 'diagnosis test entry' },
      entry_date: new Date().toISOString().slice(0, 10),
    }, token);

    console.log('\njournal save status:', save.status);
    console.log('\n>>>>>>>>>> COPY EVERYTHING BELOW THIS LINE >>>>>>>>>>');
    console.log(save.raw || '(empty response)');
    console.log('<<<<<<<<<< COPY EVERYTHING ABOVE THIS LINE <<<<<<<<<<\n');

    if (save.status === 201) {
      console.log('GOOD NEWS: the journal save WORKED. Nothing to fix here.');
    } else {
      console.log('The journal save failed. The text between the lines above tells us why.');
    }
  } catch (e) {
    console.log('Diagnosis script error:', e.message);
  } finally {
    if (child) {
      child.kill();
      console.log('\n(Backend shut back down.)');
    }
  }
}

main();
