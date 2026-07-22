const test = require('node:test');
const assert = require('node:assert/strict');

const ATTACHED_CONVERSATION_TURN = String.raw`::1 - - [17/Jul/2026:15:52:19 +0000] "POST /api/lumi/message HTTP/1.1" - - "http://localhost:5173/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36"
{"level":30,"time":1784303544738,"pid":25880,"hostname":"DESKTOP-KNQ9SNE","userId":"42089680-d517-4da9-8135-9386e8e46b0d","action":"extraction","route":"talk","model":"llama-3.1-8b-instant","msg":"extraction complete"}
{"level":50,"time":1784303544744,"pid":25880,"hostname":"DESKTOP-KNQ9SNE","requestId":"c1bfe4d9-a1ed-4a04-be32-d2acd2e456ac","userId":"42089680-d517-4da9-8135-9386e8e46b0d","err":"reqLogger is not defined","msg":"lumi router error"}`;

function mockModule(modulePath, exports) {
  const resolved = require.resolve(modulePath);
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports,
  };
}

test('routeLumiInput executes and persists every valid action from one extracted multi-intent turn', async () => {
  const originalLocalRouter = process.env.LUMI_LOCAL_ROUTER;
  process.env.LUMI_LOCAL_ROUTER = 'false';

  const routerPath = require.resolve('../../services/lumiRouter');
  const connectionPath = '../../db/connection';
  const aiClientPath = '../../services/aiClient';
  const memorySurfacePath = '../../services/lumiMemorySurface';
  const rateLimiterPath = '../../middleware/rateLimiter';

  const touchedSql = [];
  const pool = {
    query: async (sql, params = []) => {
      touchedSql.push({ sql, params });

      if (/INSERT INTO budget_entries/i.test(sql)) {
        return { rows: [{ id: 'budget-1', amount: params[1], currency: params[2], category: params[3], note: params[4], type: params[5] }] };
      }
      if (/SELECT id FROM habits/i.test(sql)) {
        return { rows: [] };
      }
      if (/INSERT INTO habits/i.test(sql)) {
        return { rows: [{ id: 'habit-1' }] };
      }
      if (/INSERT INTO habit_completions/i.test(sql)) {
        return { rows: [{ id: 'completion-1', habit_id: params[0], completion_date: '2026-07-17' }] };
      }
      if (/INSERT INTO schedules/i.test(sql)) {
        return { rows: [{ id: 'schedule-1', title: params[1] }] };
      }
      if (/INSERT INTO lumi_daily_entries/i.test(sql)) {
        return { rows: [] };
      }
      return { rows: [] };
    },
  };

  const extraction = {
    understanding: 'The user shared several things to log from one conversation.',
    emotion: 'neutral',
    actions: [
      { type: 'budget_entry', amount: 2500, currency: 'NGN', category: 'food', note: 'lunch', entry_type: 'expense' },
      { type: 'habit_log', habit_name: 'Exercise', completed: true },
      { type: 'schedule_item', title: 'Yoga', start_time: '07:00', duration_minutes: 30, category: 'wellness' },
    ],
    lumiResponse: 'Logged the expense, exercise, and yoga plan.',
    needsConfirmation: false,
    confirmPrompt: null,
    pendingJournalContent: null,
  };

  mockModule(connectionPath, { pool });
  mockModule(aiClientPath, {
    getLegacyClient: () => ({
      chat: {
        completions: {
          create: async () => ({
            choices: [{ message: { content: JSON.stringify(extraction) } }],
          }),
        },
      },
    }),
  });
  mockModule(memorySurfacePath, {
    surfaceRelevantMemories: async () => [],
    markMemoriesSurfaced: async () => {},
  });
  mockModule(rateLimiterPath, {
    getRedisClient: async () => null,
  });
  delete require.cache[routerPath];

  try {
    const { routeLumiInput } = require('../../services/lumiRouter');
    const result = await routeLumiInput(
      '42089680-d517-4da9-8135-9386e8e46b0d',
      ATTACHED_CONVERSATION_TURN,
      {},
      'talk',
      { debug() {}, info() {}, warn() {}, error(error) { throw new Error(`unexpected error log: ${JSON.stringify(error)}`); } }
    );

    assert.equal(result.success, true);
    assert.equal(result.saved, true);
    assert.deepEqual(result.savedItems.map((item) => item.type), ['budget_entry', 'habit_log', 'schedule_item']);
    assert.deepEqual(result.executionSummary.map((item) => item.module), ['Budget', 'Habits', 'Planner']);
    assert.deepEqual(result.refresh, ['budget', 'journal', 'dashboard', 'habits', 'schedule']);
    assert.ok(touchedSql.some(({ sql }) => /INSERT INTO budget_entries/i.test(sql)));
    assert.ok(touchedSql.some(({ sql }) => /INSERT INTO habit_completions/i.test(sql)));
    assert.ok(touchedSql.some(({ sql }) => /INSERT INTO schedules/i.test(sql)));
    assert.ok(touchedSql.some(({ sql }) => /INSERT INTO lumi_daily_entries/i.test(sql)));
  } finally {
    if (originalLocalRouter === undefined) {
      delete process.env.LUMI_LOCAL_ROUTER;
    } else {
      process.env.LUMI_LOCAL_ROUTER = originalLocalRouter;
    }
    delete require.cache[routerPath];
  }
});
