import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAtmos } from '../components/Atmosphere';
import { C } from '../components/layout/SidebarLayout';

// ─── Category config ───────────────────────────────────────────────────────────
const EXPENSE_CATS = [
  { id: 'food',        label: 'Food',         icon: '🍽️' },
  { id: 'transport',   label: 'Transport',    icon: '🚗' },
  { id: 'bills',       label: 'Bills',        icon: '💡' },
  { id: 'shopping',    label: 'Shopping',     icon: '🛍️' },
  { id: 'health',      label: 'Health',       icon: '💊' },
  { id: 'education',   label: 'Education',    icon: '📚' },
  { id: 'savings',     label: 'Savings',      icon: '🏦' },
  { id: 'giving',      label: 'Giving',       icon: '🤲' },
  { id: 'other',       label: 'Other',        icon: '📦' },
];

const INCOME_CATS = [
  { id: 'salary',      label: 'Salary',       icon: '💼' },
  { id: 'freelance',   label: 'Freelance',    icon: '💻' },
  { id: 'business',    label: 'Business',     icon: '🏪' },
  { id: 'gift',        label: 'Gift',         icon: '🎁' },
  { id: 'investment',  label: 'Investment',   icon: '📈' },
  { id: 'other',       label: 'Other',        icon: '💰' },
];

function catIcon(id) {
  return (
    EXPENSE_CATS.find(c => c.id === id)?.icon ||
    INCOME_CATS.find(c => c.id === id)?.icon ||
    '📦'
  );
}

function fmt(n) {
  if (n === null || n === undefined) return '₦0';
  return '₦' + Number(n).toLocaleString('en-NG', { maximumFractionDigits: 0 });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function firstOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

// ─── Shared glass panel ────────────────────────────────────────────────────────
function Panel({ children, style }) {
  return (
    <div style={{
      background: 'rgba(10,12,24,0.55)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Progress bar ──────────────────────────────────────────────────────────────
function Bar({ pct, color = C.teal }) {
  const capped = Math.min(pct, 100);
  const over   = pct > 100;
  return (
    <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{
        height: '100%',
        width: `${capped}%`,
        background: over ? '#f87171' : color,
        borderRadius: 4,
        transition: 'width 0.5s ease',
      }} />
    </div>
  );
}

// ─── Today tab ────────────────────────────────────────────────────────────────
function TodayTab({ summary, entries, onAdd, saving }) {
  const [form, setForm] = useState({
    type: 'expense',
    amount: '',
    category: 'food',
    note: '',
    entry_date: todayISO(),
  });

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function submit(e) {
    e.preventDefault();
    if (!form.amount) return;
    onAdd({ ...form, amount: parseFloat(form.amount) });
    setForm(f => ({ ...f, amount: '', note: '' }));
  }

  const cats = form.type === 'income' ? INCOME_CATS : EXPENSE_CATS;

  // Today's entries only
  const todayEntries = entries.filter(e => e.entry_date?.slice(0, 10) === todayISO());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Hero number */}
      <Panel style={{ padding: '28px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: C.muted, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>Today's Spend</div>
        <div style={{ fontSize: 52, fontWeight: 700, color: C.teal, fontFamily: "'DM Serif Display', serif", lineHeight: 1 }}>
          {fmt(summary.today)}
        </div>
        {summary.avgDaily > 0 && (
          <div style={{ fontSize: 13, color: C.muted, marginTop: 10 }}>
            {summary.today <= summary.avgDaily
              ? `✓ Below your ₦${Number(summary.avgDaily).toLocaleString('en-NG', { maximumFractionDigits: 0 })} daily average`
              : `↑ ₦${Number(summary.today - summary.avgDaily).toLocaleString('en-NG', { maximumFractionDigits: 0 })} above your daily average`}
          </div>
        )}
      </Panel>

      {/* Quick-add form */}
      <Panel style={{ padding: 20 }}>
        <div style={{ fontSize: 12, color: C.muted, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 14 }}>Log a Transaction</div>

        {/* Type toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {['expense', 'income'].map(t => (
            <button key={t} onClick={() => { set('type', t); set('category', t === 'income' ? 'salary' : 'food'); }}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                background: form.type === t
                  ? (t === 'income' ? 'rgba(0,212,170,0.18)' : 'rgba(248,113,113,0.18)')
                  : 'rgba(255,255,255,0.05)',
                color: form.type === t
                  ? (t === 'income' ? C.teal : '#f87171')
                  : C.muted,
                transition: 'all 0.15s',
              }}>
              {t === 'income' ? '+ Income' : '− Expense'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Amount */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, overflow: 'hidden' }}>
            <span style={{ padding: '0 14px', color: C.muted, fontSize: 16, fontWeight: 700 }}>₦</span>
            <input
              type="number" min="1" step="any" placeholder="0.00"
              value={form.amount} onChange={e => set('amount', e.target.value)}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: C.text, fontSize: 18, fontWeight: 600, padding: '12px 0', fontFamily: 'inherit' }}
            />
          </div>

          {/* Category chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {cats.map(c => (
              <button key={c.id} type="button" onClick={() => set('category', c.id)}
                style={{
                  padding: '5px 11px', borderRadius: 20, border: '1px solid',
                  cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
                  background: form.category === c.id ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.04)',
                  borderColor: form.category === c.id ? C.teal : 'rgba(255,255,255,0.08)',
                  color: form.category === c.id ? C.teal : C.muted,
                  transition: 'all 0.12s',
                }}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>

          {/* Note */}
          <input
            type="text" placeholder="Note (optional)"
            value={form.note} onChange={e => set('note', e.target.value)}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: '10px 14px', color: C.text, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
          />

          {/* Date */}
          <input
            type="date" value={form.entry_date} onChange={e => set('entry_date', e.target.value)}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: '10px 14px', color: C.muted, fontSize: 13, fontFamily: 'inherit', outline: 'none', colorScheme: 'dark' }}
          />

          <button type="submit" disabled={!form.amount || saving}
            style={{
              padding: '12px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: C.teal, color: '#0a0a0a', fontWeight: 700, fontSize: 14,
              fontFamily: 'inherit', opacity: (!form.amount || saving) ? 0.5 : 1, transition: 'opacity 0.15s',
            }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </form>
      </Panel>

      {/* Today's transactions */}
      {todayEntries.length > 0 && (
        <Panel style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>Today</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {todayEntries.map(e => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>{catIcon(e.category)}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>
                    {e.note || EXPENSE_CATS.find(c => c.id === e.category)?.label || e.category}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted }}>{e.category}</div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: e.type === 'income' ? C.teal : '#f87171' }}>
                  {e.type === 'income' ? '+' : '−'}{fmt(e.amount)}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

// ─── Month tab ─────────────────────────────────────────────────────────────────
function MonthTab({ summary, entries }) {
  const totalSpend = summary.monthExpense || 0;
  const income     = summary.monthIncome || summary.declaredIncome || 0;
  const surplus    = income - totalSpend;
  const daysLeft   = summary.daysLeft || 0;
  const projected  = (summary.avgDaily || 0) * (30 - daysLeft + (new Date().getDate()));

  // Group entries by date for the feed
  const byDate = {};
  entries.forEach(e => {
    const d = e.entry_date?.slice(0, 10) || '';
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(e);
  });
  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a)).slice(0, 7);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Scorecard row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Panel style={{ padding: '18px 16px' }}>
          <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 6 }}>Spent</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#f87171', fontFamily: "'DM Serif Display', serif" }}>{fmt(totalSpend)}</div>
        </Panel>
        <Panel style={{ padding: '18px 16px' }}>
          <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 6 }}>Income In</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.teal, fontFamily: "'DM Serif Display', serif" }}>{fmt(income)}</div>
        </Panel>
        <Panel style={{ padding: '18px 16px' }}>
          <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 6 }}>
            {surplus >= 0 ? 'Surplus' : 'Deficit'}
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: surplus >= 0 ? C.teal : '#f87171', fontFamily: "'DM Serif Display', serif" }}>
            {fmt(Math.abs(surplus))}
          </div>
        </Panel>
        <Panel style={{ padding: '18px 16px' }}>
          <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 6 }}>Days Left</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.cream, fontFamily: "'DM Serif Display', serif" }}>{daysLeft}</div>
        </Panel>
      </div>

      {/* Projected burn */}
      {summary.avgDaily > 0 && (
        <Panel style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>
            At your current pace, this month will cost ~<strong style={{ color: C.cream }}>{fmt(projected)}</strong>
          </div>
          <Bar pct={income > 0 ? (totalSpend / income) * 100 : 0} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
            <span style={{ fontSize: 11, color: C.muted }}>0</span>
            <span style={{ fontSize: 11, color: C.muted }}>{fmt(income)}</span>
          </div>
        </Panel>
      )}

      {/* Category breakdown */}
      {summary.categories?.length > 0 && (
        <Panel style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 14 }}>Where it went</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {summary.categories.map(c => {
              const goal = summary.goals?.find(g => g.category === c.category);
              const limit = goal?.limit || 0;
              const pct   = limit > 0 ? (c.total / limit) * 100 : 0;
              return (
                <div key={c.category}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 13, color: C.text }}>
                      {catIcon(c.category)} {EXPENSE_CATS.find(x => x.id === c.category)?.label || c.category}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.cream }}>
                      {fmt(c.total)}{limit > 0 ? ` / ${fmt(limit)}` : ''}
                    </span>
                  </div>
                  {limit > 0 && <Bar pct={pct} />}
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {/* Recent feed */}
      {sortedDates.length > 0 && (
        <Panel style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>Recent</div>
          {sortedDates.map(date => (
            <div key={date} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>
                {new Date(date + 'T00:00:00').toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'short' })}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {byDate[date].map(e => (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 18 }}>{catIcon(e.category)}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: C.text }}>{e.note || e.category}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: e.type === 'income' ? C.teal : '#f87171' }}>
                      {e.type === 'income' ? '+' : '−'}{fmt(e.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Panel>
      )}
    </div>
  );
}

// ─── Budgets tab ───────────────────────────────────────────────────────────────
function BudgetsTab({ summary, onSaveGoal, saving }) {
  const month = firstOfMonth();

  const [income, setIncome] = useState('');
  const [limits, setLimits] = useState({});
  const [saved, setSaved]   = useState(false);

  // Pre-fill from existing goals
  useEffect(() => {
    if (!summary.goals) return;
    const incomeRow = summary.goals.find(g => g.category === 'total');
    if (incomeRow?.declared_income > 0) setIncome(String(incomeRow.declared_income));
    const lims = {};
    summary.goals.forEach(g => { if (g.category !== 'total') lims[g.category] = String(g.limit); });
    setLimits(lims);
  }, [summary.goals]);

  async function save() {
    const tasks = [];
    if (income) {
      tasks.push(onSaveGoal({ month, category: 'total', declared_income: parseFloat(income), limit_amount: 0 }));
    }
    EXPENSE_CATS.forEach(c => {
      if (limits[c.id]) {
        tasks.push(onSaveGoal({ month, category: c.id, limit_amount: parseFloat(limits[c.id]), declared_income: 0 }));
      }
    });
    await Promise.all(tasks);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Income declaration */}
      <Panel style={{ padding: 20 }}>
        <div style={{ fontSize: 12, color: C.muted, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 14 }}>
          Monthly Income
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 10 }}>
          How much do you expect to receive this month? This sets your baseline.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, overflow: 'hidden' }}>
          <span style={{ padding: '0 14px', color: C.muted, fontSize: 16, fontWeight: 700 }}>₦</span>
          <input
            type="number" min="0" step="any" placeholder="e.g. 250000"
            value={income} onChange={e => setIncome(e.target.value)}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: C.text, fontSize: 18, fontWeight: 600, padding: '12px 0', fontFamily: 'inherit' }}
          />
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>
          Irregular income? Enter your lowest expected amount — Lumi will treat the rest as bonus.
        </div>
      </Panel>

      {/* Per-category limits */}
      <Panel style={{ padding: 20 }}>
        <div style={{ fontSize: 12, color: C.muted, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 }}>
          Spending Limits (optional)
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>
          Set a monthly cap per category. Leave blank to track without a limit.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {EXPENSE_CATS.filter(c => c.id !== 'savings').map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{c.icon}</span>
              <span style={{ fontSize: 13, color: C.text, flex: 1 }}>{c.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, overflow: 'hidden', width: 130 }}>
                <span style={{ padding: '0 8px', color: C.muted, fontSize: 13 }}>₦</span>
                <input
                  type="number" min="0" step="any" placeholder="—"
                  value={limits[c.id] || ''}
                  onChange={e => setLimits(l => ({ ...l, [c.id]: e.target.value }))}
                  style={{ width: '100%', background: 'none', border: 'none', outline: 'none', color: C.text, fontSize: 13, padding: '9px 0', fontFamily: 'inherit' }}
                />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <button onClick={save} disabled={saving}
        style={{
          padding: '14px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
          background: saved ? 'rgba(0,212,170,0.25)' : C.teal,
          color: saved ? C.teal : '#0a0a0a',
          fontWeight: 700, fontSize: 15, fontFamily: 'inherit',
          transition: 'all 0.2s', opacity: saving ? 0.6 : 1,
        }}>
        {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save Budget'}
      </button>
    </div>
  );
}

// ─── Main Budget page ──────────────────────────────────────────────────────────
export default function Budget() {
  const navigate  = useNavigate();
  const { palette } = useAtmos();

  const [tab,     setTab]     = useState('today');
  const [summary, setSummary] = useState({ today: 0, monthExpense: 0, monthIncome: 0, declaredIncome: 0, surplus: 0, avgDaily: 0, daysLeft: 0, categories: [], goals: [] });
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, entRes] = await Promise.all([
        api.get('/budget/summary'),
        api.get('/budget/entries?days=31&limit=100'),
      ]);
      setSummary(sumRes.data);
      setEntries(entRes.data.entries || []);
    } catch {
      // Show zeros — user just hasn't logged anything yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(data) {
    setSaving(true);
    try {
      await api.post('/budget/entries', data);
      showToast(data.type === 'income' ? '+ Income logged' : '− Expense logged');
      await load();
    } catch {
      showToast('Failed to save — please try again', true);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveGoal(data) {
    try {
      await api.put('/budget/goals', data);
      await load();
    } catch {
      showToast('Failed to save goal', true);
    }
  }

  function showToast(msg, error = false) {
    setToast({ msg, error });
    setTimeout(() => setToast(null), 2800);
  }

  const TABS = [
    { id: 'today', label: 'Today' },
    { id: 'month', label: 'This Month' },
    { id: 'budgets', label: 'Budgets' },
  ];

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(8,8,18,0.7)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '14px 20px 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <button onClick={() => navigate('/dashboard')}
            style={{ background: 'none', border: 'none', color: C.muted, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
            ← Back
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.cream, fontFamily: "'DM Serif Display', serif" }}>
              💰 Budget
            </div>
            <div style={{ fontSize: 12, color: C.muted }}>
              {new Date().toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: '10px 0', background: 'none', border: 'none',
                cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                color: tab === t.id ? C.teal : C.muted,
                borderBottom: `2px solid ${tab === t.id ? C.teal : 'transparent'}`,
                marginBottom: -1, transition: 'all 0.15s',
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px 100px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: C.muted, fontSize: 14 }}>Loading…</div>
        ) : (
          <>
            {tab === 'today'   && <TodayTab   summary={summary} entries={entries} onAdd={handleAdd}       saving={saving} />}
            {tab === 'month'   && <MonthTab   summary={summary} entries={entries} />}
            {tab === 'budgets' && <BudgetsTab summary={summary} onSaveGoal={handleSaveGoal} saving={saving} />}
          </>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: toast.error ? 'rgba(248,113,113,0.12)' : 'rgba(0,212,170,0.12)',
          border: `1px solid ${toast.error ? 'rgba(248,113,113,0.3)' : 'rgba(0,212,170,0.3)'}`,
          color: toast.error ? '#f87171' : C.teal,
          padding: '10px 22px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          fontFamily: 'inherit', zIndex: 200,
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
