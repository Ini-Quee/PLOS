import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import { encryptText, decryptText } from '../lib/encryption';
import { useAtmos } from '../components/Atmosphere';
import LumiBudgetPanel from '../components/budget/LumiBudgetPanel';

// ─── Category config ────────────────────────────────────────────────────────────
const EXPENSE_CATS = [
  { id:'food',       label:'Food & Dining',  icon:'🍔', color:'#E8A450' },
  { id:'transport',  label:'Transport',      icon:'🚗', color:'#5B9CF6' },
  { id:'bills',      label:'Bills',          icon:'💡', color:'#f87171' },
  { id:'shopping',   label:'Shopping',       icon:'🛍️', color:'#9B7FEA' },
  { id:'health',     label:'Health',         icon:'💊', color:'#3ECFAA' },
  { id:'education',  label:'Education',      icon:'📚', color:'#60a5fa' },
  { id:'savings',    label:'Savings',        icon:'🏦', color:'#34d399' },
  { id:'giving',     label:'Giving',         icon:'🤲', color:'#f9a8d4' },
  { id:'other',      label:'Other',          icon:'📦', color:'#6b7280' },
];
const INCOME_CATS = [
  { id:'salary',     label:'Salary',     icon:'💼', color:'#3ECFAA' },
  { id:'freelance',  label:'Freelance',  icon:'💻', color:'#3ECFAA' },
  { id:'business',   label:'Business',   icon:'🏪', color:'#3ECFAA' },
  { id:'gift',       label:'Gift',       icon:'🎁', color:'#3ECFAA' },
  { id:'investment', label:'Investment', icon:'📈', color:'#3ECFAA' },
  { id:'other',      label:'Other',      icon:'💰', color:'#3ECFAA' },
];
const GOAL_EMOJIS = ['🎯','💻','✈️','🏠','🚗','🎓','💍','🏥','📱','🎸','🌴','🐕','📦'];

function catInfo(id) {
  return EXPENSE_CATS.find(c => c.id === id) || INCOME_CATS.find(c => c.id === id) || { label: id, icon:'📦', color:'#6b7280' };
}
function fmt(n) {
  if (n === null || n === undefined || isNaN(n)) return '₦0';
  return '₦' + Number(n).toLocaleString('en-NG', { maximumFractionDigits: 0 });
}
function todayISO() { return new Date().toISOString().slice(0, 10); }
function firstOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`;
}
function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-NG', { weekday:'short', day:'numeric', month:'short' });
}
function weeksLeft(deadline) {
  if (!deadline) return null;
  const diff = new Date(deadline) - new Date();
  return diff > 0 ? Math.ceil(diff / (7*24*3600*1000)) : 0;
}
function pctBar(value, max, color = '#E8A450') {
  const p = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const over = max > 0 && value > max;
  return (
    <div style={{ height:5, background:'rgba(255,255,255,0.07)', borderRadius:3, overflow:'hidden' }}>
      <div style={{ height:'100%', width:`${p}%`, background: over ? '#f87171' : color, borderRadius:3, transition:'width 0.5s ease' }} />
    </div>
  );
}

// ─── CSS variables injected once ────────────────────────────────────────────────
const CSS = `
:root{
  --bg:transparent;
  --bg2:rgba(20,12,6,0.52);
  --bg3:rgba(28,16,8,0.62);
  --bg4:rgba(36,22,10,0.72);
  --border:rgba(255,220,160,0.08);
  --border2:rgba(255,220,160,0.14);
  --text:#F0EAE0;
  --text2:rgba(240,234,224,0.6);
  --text3:rgba(240,234,224,0.35);
  --accent:#C8955C;
  --accent2:#DBA870;
  --teal:#00d4aa;
  --red:#f87171;
  --blue:#7eb5ff;
  --purple:#a5b4fc;
  --radius:14px;
  --sidebar:220px;
  font-family:'Inter',sans-serif
}
*{box-sizing:border-box;margin:0;padding:0}
.pave-sidebar{width:var(--sidebar);background:var(--bg2);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);border-right:1px solid var(--border);display:flex;flex-direction:column;padding:24px 0;position:fixed;height:100vh;z-index:100;top:0;left:0}
.pave-main{margin-left:var(--sidebar);flex:1;min-height:100vh}
.pave-nav-item{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:10px;cursor:pointer;color:var(--text2);font-size:13px;font-weight:500;transition:all 0.15s;margin-bottom:2px}
.pave-nav-item:hover{background:var(--bg3);color:var(--text)}
.pave-nav-item.active{background:rgba(232,164,80,0.12);color:var(--accent)}
.pave-card{background:var(--bg2);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid var(--border);border-radius:var(--radius);padding:20px}
.pave-section{display:none;padding:0 32px 40px}
.pave-section.active{display:block}
.pave-btn{display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:10px;font-size:13px;font-weight:500;cursor:pointer;border:none;font-family:inherit;transition:all 0.15s}
.pave-btn-ghost{background:var(--bg3);color:var(--text2);border:1px solid var(--border2)}
.pave-btn-ghost:hover{color:var(--text);background:var(--bg4)}
.pave-btn-accent{background:var(--accent);color:#1A1000}
.pave-btn-accent:hover{background:var(--accent2)}
.pave-btn-teal{background:rgba(62,207,170,0.12);color:var(--teal);border:1px solid rgba(62,207,170,0.2)}
.pave-btn-teal:hover{background:rgba(62,207,170,0.2)}
.pave-input{width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:9px;padding:10px 14px;color:var(--text);font-size:14px;font-family:inherit;outline:none}
.pave-input:focus{border-color:var(--accent)}
.pave-select{width:100%;background:var(--bg3);border:1px solid var(--border2);border-radius:9px;padding:10px 14px;color:var(--text);font-size:14px;font-family:inherit;outline:none;cursor:pointer}
.pave-table{width:100%;border-collapse:collapse;font-size:13px}
.pave-table th{background:var(--bg3);padding:11px 14px;text-align:left;font-weight:600;font-size:11px;color:var(--text3);letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid var(--border);white-space:nowrap}
.pave-table td{padding:11px 14px;border-bottom:1px solid var(--border);color:var(--text);white-space:nowrap}
.pave-table tr:last-child td{border-bottom:none}
.pave-table tr:hover td{background:var(--bg3)}
.pave-badge{display:inline-block;font-size:10px;font-weight:600;padding:2px 8px;border-radius:6px}
.pave-scroll::-webkit-scrollbar{width:4px}
.pave-scroll::-webkit-scrollbar-thumb{background:var(--bg4);border-radius:2px}
@media(max-width:960px){.pave-sidebar{width:64px}.pave-main{margin-left:64px}.pave-nav-label,.pave-nav-text,.pave-logo-text{display:none}.pave-nav-item{justify-content:center}}
`;

// ─── Encryption helpers ──────────────────────────────────────────────────────────
async function getOrCreateBudgetKey(user) {
  const storageKey = `pave_key_${user?.id || 'anon'}`;
  let key = localStorage.getItem(storageKey);
  if (!key) {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    key = btoa(String.fromCharCode(...arr));
    localStorage.setItem(storageKey, key);
  }
  return key;
}

async function encryptEntry(data, key) {
  const payload = JSON.stringify({
    amount: data.amount,
    note: data.note || '',
    category: data.category || 'other',
  });
  const enc = await encryptText(payload, key);
  return {
    type: data.type,
    encrypted_content: enc.ciphertext,
    encryption_iv: enc.iv,
    encryption_salt: enc.salt,
    entry_date: data.entry_date || todayISO(),
    source: data.source || 'manual',
    currency: data.currency || '₦',
    // plain fields still sent for server-side aggregation
    amount: data.amount,
    category: data.category || 'other',
    note: data.note || '',
  };
}

// ─── Modals ──────────────────────────────────────────────────────────────────────
function AddEntryModal({ open, onClose, onSave, saving }) {
  const [type, setType]   = useState('expense');
  const [form, setForm]   = useState({ amount:'', category:'food', note:'', date: todayISO() });
  const cats = type === 'income' ? INCOME_CATS : EXPENSE_CATS;

  function set(k,v) { setForm(f => ({ ...f, [k]:v })); }

  function submit(e) {
    e.preventDefault();
    if (!form.amount) return;
    onSave({ type, amount: parseFloat(form.amount), category: form.category, note: form.note, entry_date: form.date });
    setForm({ amount:'', category: type==='income'?'salary':'food', note:'', date: todayISO() });
  }

  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:20, padding:28, width:420, maxWidth:'95vw' }}>
        <div style={{ fontSize:17, fontWeight:600, marginBottom:20 }}>Log transaction</div>

        <div style={{ display:'flex', gap:6, marginBottom:16 }}>
          {['expense','income'].map(t => (
            <button key={t} onClick={() => { setType(t); set('category', t==='income'?'salary':'food'); }}
              style={{ flex:1, padding:'9px', borderRadius:9, border:`1px solid ${type===t ? (t==='income'?'var(--teal)':'var(--accent)') : 'var(--border2)'}`, background: type===t ? (t==='income'?'rgba(62,207,170,0.12)':'rgba(232,164,80,0.12)') : 'var(--bg3)', color: type===t ? (t==='income'?'var(--teal)':'var(--accent)') : 'var(--text2)', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:600 }}>
              {t==='income' ? '+ Income' : '− Expense'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:10, overflow:'hidden' }}>
            <span style={{ padding:'0 14px', color:'var(--text2)', fontSize:18, fontWeight:700 }}>₦</span>
            <input type="number" min="1" step="any" placeholder="0.00" value={form.amount} onChange={e => set('amount', e.target.value)} required
              style={{ flex:1, background:'none', border:'none', outline:'none', color:'var(--text)', fontSize:24, fontWeight:700, padding:'12px 0', fontFamily:'inherit' }} />
          </div>

          <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
            {cats.map(c => (
              <button key={c.id} type="button" onClick={() => set('category', c.id)}
                style={{ padding:'5px 11px', borderRadius:20, border:`1px solid ${form.category===c.id ? c.color : 'var(--border)'}`, background: form.category===c.id ? c.color+'22' : 'var(--bg3)', color: form.category===c.id ? c.color : 'var(--text2)', cursor:'pointer', fontSize:11, fontFamily:'inherit', transition:'all 0.12s' }}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>

          <input className="pave-input" placeholder="Note (optional)" value={form.note} onChange={e => set('note', e.target.value)} />
          <input type="date" className="pave-input" value={form.date} onChange={e => set('date', e.target.value)} style={{ colorScheme:'dark' }} />

          <div style={{ display:'flex', gap:8, marginTop:4 }}>
            <button type="button" className="pave-btn pave-btn-ghost" style={{ flex:1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="pave-btn pave-btn-accent" style={{ flex:2, opacity: saving ? 0.6 : 1 }} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddGoalModal({ open, onClose, onSave, saving }) {
  const [form, setForm] = useState({ name:'', emoji:'🎯', target_amount:'', saved_amount:'', deadline:'' });
  function set(k,v) { setForm(f => ({ ...f, [k]:v })); }
  function submit(e) {
    e.preventDefault();
    if (!form.name || !form.target_amount) return;
    onSave({ ...form, target_amount: parseFloat(form.target_amount), saved_amount: form.saved_amount ? parseFloat(form.saved_amount) : 0, deadline: form.deadline || null });
  }
  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:20, padding:28, width:400, maxWidth:'95vw' }}>
        <div style={{ fontSize:17, fontWeight:600, marginBottom:20 }}>New savings goal</div>
        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:4 }}>
            {GOAL_EMOJIS.map(em => (
              <button key={em} type="button" onClick={() => set('emoji', em)}
                style={{ width:34, height:34, borderRadius:8, border:`1px solid ${form.emoji===em ? 'var(--teal)' : 'var(--border)'}`, background: form.emoji===em ? 'rgba(62,207,170,0.12)' : 'var(--bg3)', fontSize:18, cursor:'pointer' }}>
                {em}
              </button>
            ))}
          </div>
          <input className="pave-input" placeholder="Goal name (e.g. Laptop, Holiday)" value={form.name} onChange={e => set('name', e.target.value)} required />
          <div style={{ display:'flex', gap:8 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>Target ₦</div>
              <input type="number" min="1" step="any" className="pave-input" placeholder="0" value={form.target_amount} onChange={e => set('target_amount', e.target.value)} required />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>Already saved ₦</div>
              <input type="number" min="0" step="any" className="pave-input" placeholder="0" value={form.saved_amount} onChange={e => set('saved_amount', e.target.value)} />
            </div>
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>Deadline (optional)</div>
            <input type="date" className="pave-input" value={form.deadline} onChange={e => set('deadline', e.target.value)} style={{ colorScheme:'dark' }} />
          </div>
          <div style={{ display:'flex', gap:8, marginTop:4 }}>
            <button type="button" className="pave-btn pave-btn-ghost" style={{ flex:1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="pave-btn pave-btn-teal" style={{ flex:2, opacity: saving ? 0.6 : 1 }} disabled={saving}>
              {saving ? 'Creating…' : 'Create goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Sidebar nav ─────────────────────────────────────────────────────────────────
const NAV = [
  { id:'home',        icon:'🏠', label:'Dashboard',    group:'Overview'  },
  { id:'expenditure', icon:'📊', label:'Expenditure',  group:'Overview'  },
  { id:'history',     icon:'📋', label:'Full History',  group:'Overview'  },
  { id:'insights',    icon:'✨', label:'AI Insights',   group:'Finance'   },
  { id:'savings',     icon:'🎯', label:'Savings',       group:'Finance'   },
  { id:'budget',      icon:'📁', label:'Budget',        group:'Finance'   },
  { id:'income',      icon:'💰', label:'Income',        group:'Finance'   },
];

// ─── Main component ───────────────────────────────────────────────────────────────
export default function Budget() {
  const navigate    = useNavigate();
  const { user }    = useAuth();
  useAtmos(); // hook into atmosphere so background shows through
  const [section, setSection] = useState('home');

  // Data
  const [summary, setSummary]   = useState({ today:0, monthExpense:0, monthIncome:0, declaredIncome:0, surplus:0, avgDaily:0, daysLeft:0, categories:[], goals:[] });
  const [entries, setEntries]   = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState(null);

  // Modals
  const [showAdd, setShowAdd]       = useState(false);
  const [showGoalModal, setGoalModal] = useState(false);

  // Savings deposit inline
  const [depositTarget, setDepositTarget] = useState(null);
  const [depositAmt, setDepositAmt]       = useState('');

  // Budget goals editor
  const [budgetIncome, setBudgetIncome] = useState('');
  const [budgetLimits, setBudgetLimits] = useState({});
  const [budgetSaved, setBudgetSaved]   = useState(false);

  // History filters
  const [histQuery, setHistQuery]   = useState('');
  const [histType, setHistType]     = useState('all');
  const [histCat, setHistCat]       = useState('all');

  function showToast(msg, err = false) {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 2800);
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, entRes, savRes] = await Promise.all([
        api.get('/budget/summary'),
        api.get('/budget/entries?days=60&limit=200'),
        api.get('/savings'),
      ]);
      setSummary(sumRes.data);
      setEntries(entRes.data.entries || []);
      setSavingsGoals(savRes.data.goals || []);

      const goals = sumRes.data.goals || [];
      const incRow = goals.find(g => g.category === 'total');
      if (incRow?.declared_income > 0) setBudgetIncome(String(incRow.declared_income));
      const lims = {};
      goals.forEach(g => { if (g.category !== 'total' && g.limit > 0) lims[g.category] = String(g.limit); });
      setBudgetLimits(lims);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAddEntry(data) {
    setSaving(true);
    try {
      const key = await getOrCreateBudgetKey(user);
      const encrypted = await encryptEntry(data, key);
      await api.post('/budget/entries', encrypted);
      showToast(data.type === 'income' ? '+ Income logged ✓' : '− Expense saved ✓');
      setShowAdd(false);
      await load();
    } catch { showToast('Failed to save — try again', true); }
    finally { setSaving(false); }
  }

  async function handleDeleteEntry(id) {
    try {
      await api.delete(`/budget/entries/${id}`);
      showToast('Entry removed');
      await load();
    } catch { showToast('Failed to delete', true); }
  }

  async function handleSaveBudget() {
    setSaving(true);
    const month = firstOfMonth();
    const tasks = [];
    if (budgetIncome) tasks.push(api.put('/budget/goals', { month, category:'total', declared_income: parseFloat(budgetIncome), limit_amount:0 }));
    EXPENSE_CATS.forEach(c => {
      if (budgetLimits[c.id]) tasks.push(api.put('/budget/goals', { month, category: c.id, limit_amount: parseFloat(budgetLimits[c.id]), declared_income:0 }));
    });
    try {
      await Promise.all(tasks);
      setBudgetSaved(true);
      setTimeout(() => setBudgetSaved(false), 2500);
      await load();
    } catch { showToast('Failed to save budget', true); }
    finally { setSaving(false); }
  }

  async function handleCreateGoal(data) {
    setSaving(true);
    try {
      await api.post('/savings', data);
      showToast('Savings goal created ✓');
      setGoalModal(false);
      await load();
    } catch { showToast('Failed to create goal', true); }
    finally { setSaving(false); }
  }

  async function handleDeposit() {
    if (!depositAmt || !depositTarget) return;
    setSaving(true);
    try {
      await api.post(`/savings/${depositTarget.id}/deposit`, { amount: parseFloat(depositAmt) });
      showToast(`+${fmt(parseFloat(depositAmt))} added`);
      setDepositTarget(null); setDepositAmt('');
      await load();
    } catch { showToast('Failed to add money', true); }
    finally { setSaving(false); }
  }

  async function handleDeleteGoal(id) {
    try {
      await api.delete(`/savings/${id}`);
      showToast('Goal deleted');
      await load();
    } catch { showToast('Failed to delete', true); }
  }

  // Lumi panel
  const [lumiOpen, setLumiOpen] = useState(false);

  // Computed
  const income        = summary.monthIncome || summary.declaredIncome || 0;
  const spent         = summary.monthExpense || 0;
  const surplus       = income - spent;
  const declaredInc   = summary.declaredIncome || 0;
  const safeToSpend   = declaredInc > 0
    ? Math.max(0, declaredInc - spent - savingsGoals.filter(g => !g.is_complete).reduce((s, g) => s + Number(g.target_amount || 0), 0))
    : null;
  const todayEntries  = entries.filter(e => e.entry_date?.slice(0,10) === todayISO());
  const monthEntries  = entries.filter(e => e.entry_date?.slice(0,7) === todayISO().slice(0,7));
  const spendPct      = income > 0 ? Math.min((spent/income)*100, 100) : 0;
  const daysInMonth   = new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate();
  const projected     = Math.round((summary.avgDaily||0) * daysInMonth);

  const filteredHistory = useMemo(() => {
    return entries
      .filter(e => histType === 'all' || e.type === histType)
      .filter(e => histCat  === 'all' || e.category === histCat)
      .filter(e => {
        if (!histQuery) return true;
        const q = histQuery.toLowerCase();
        return (e.note||'').toLowerCase().includes(q) || (e.category||'').toLowerCase().includes(q);
      });
  }, [entries, histType, histCat, histQuery]);

  const overspendCats = summary.categories?.filter(c => {
    const g = summary.goals?.find(g => g.category === c.category);
    return g?.limit > 0 && c.total > g.limit;
  }) || [];

  const userName = user?.name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // ─── Render helpers ────────────────────────────────────────────────────────────
  function StatCard({ label, value, sub, color, accent, onClick }) {
    return (
      <div className="pave-card" style={{ cursor: onClick ? 'pointer' : 'default', borderColor: accent ? `${accent}33` : undefined }} onClick={onClick}>
        <div style={{ fontSize:10, fontWeight:600, color:'var(--text3)', letterSpacing:'0.6px', textTransform:'uppercase', marginBottom:8 }}>{label}</div>
        <div style={{ fontSize:26, fontWeight:700, letterSpacing:'-0.8px', color: color || 'var(--text)' }}>{value}</div>
        {sub && <div style={{ fontSize:12, color:'var(--text2)', marginTop:4 }}>{sub}</div>}
      </div>
    );
  }

  function TxRow({ e }) {
    const c = catInfo(e.category);
    const [confirming, setConfirming] = useState(false);
    return (
      <tr>
        <td style={{ color:'var(--text2)', fontSize:12 }}>{fmtDate(e.entry_date)}</td>
        <td><strong>{e.note || c.label}</strong></td>
        <td><span className="pave-badge" style={{ background:`${c.color}22`, color: c.color }}>{c.icon} {c.label}</span></td>
        <td style={{ fontFamily:'monospace', fontSize:12, color: e.type==='income' ? 'var(--teal)' : 'var(--accent)' }}>
          {e.type==='income' ? '+' : '−'}{fmt(e.amount)}
        </td>
        <td style={{ fontSize:11, color:'var(--text2)' }}>{e.source || 'manual'}</td>
        <td>
          {confirming
            ? <span>
                <button onClick={() => { handleDeleteEntry(e.id); setConfirming(false); }} style={{ background:'rgba(224,85,85,0.15)', border:'1px solid rgba(224,85,85,0.3)', color:'var(--red)', borderRadius:6, padding:'2px 8px', fontSize:11, cursor:'pointer', fontFamily:'inherit', marginRight:4 }}>Delete?</button>
                <button onClick={() => setConfirming(false)} style={{ background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text2)', borderRadius:6, padding:'2px 8px', fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>No</button>
              </span>
            : <button onClick={() => setConfirming(true)} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:13, padding:'2px 5px' }}>×</button>}
        </td>
      </tr>
    );
  }

  function GoalCard({ g }) {
    const pct  = g.target_amount > 0 ? Math.min((Number(g.saved_amount)/Number(g.target_amount))*100, 100) : 0;
    const circ = 138.2;
    const wl   = weeksLeft(g.deadline);
    const done = g.is_complete || Number(g.saved_amount) >= Number(g.target_amount);
    const [delConfirm, setDelConfirm] = useState(false);

    return (
      <div className="pave-card" style={{ borderColor: done ? 'rgba(62,207,170,0.25)' : undefined }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:600 }}>{done ? '✅' : g.emoji} {g.name}</div>
            {g.deadline && <div style={{ fontSize:11, color:'var(--text2)', marginTop:2 }}>Due {fmtDate(g.deadline)}</div>}
          </div>
          {delConfirm
            ? <div style={{ display:'flex', gap:6 }}>
                <button onClick={() => handleDeleteGoal(g.id)} style={{ background:'rgba(224,85,85,0.15)', border:'1px solid rgba(224,85,85,0.3)', color:'var(--red)', borderRadius:7, padding:'4px 9px', fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>Delete</button>
                <button onClick={() => setDelConfirm(false)} style={{ background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text2)', borderRadius:7, padding:'4px 9px', fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>Keep</button>
              </div>
            : <button onClick={() => setDelConfirm(true)} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:14, padding:'2px 6px' }}>×</button>}
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
          <svg width="60" height="60" viewBox="0 0 60 60" style={{ flexShrink:0 }}>
            <circle cx="30" cy="30" r="22" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6"/>
            <circle cx="30" cy="30" r="22" fill="none" stroke={done ? '#3ECFAA' : '#E8A450'} strokeWidth="6"
              strokeDasharray={circ} strokeDashoffset={circ - (pct/100)*circ}
              strokeLinecap="round" transform="rotate(-90 30 30)" style={{ transition:'stroke-dashoffset 0.6s ease' }}/>
          </svg>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
              <span style={{ fontSize:18, fontWeight:700, color: done ? 'var(--teal)' : 'var(--text)' }}>{fmt(g.saved_amount)}</span>
              <span style={{ fontSize:11, color:'var(--text2)' }}>of {fmt(g.target_amount)}</span>
            </div>
            {pctBar(Number(g.saved_amount), Number(g.target_amount), done ? '#3ECFAA' : '#E8A450')}
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:5, fontSize:11, color:'var(--text2)' }}>
              <span>{Math.round(pct)}% saved</span>
              {done ? <span style={{ color:'var(--teal)' }}>Complete 🎉</span>
                : wl !== null ? <span>{wl > 0 ? `${wl} weeks left` : 'Past deadline'}</span>
                : <span>{fmt(Number(g.target_amount)-Number(g.saved_amount))} to go</span>}
            </div>
          </div>
        </div>

        {!done && (depositTarget?.id === g.id
          ? <div style={{ display:'flex', gap:7 }}>
              <div style={{ flex:1, display:'flex', alignItems:'center', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:9, overflow:'hidden' }}>
                <span style={{ padding:'0 10px', color:'var(--text2)', fontSize:14 }}>₦</span>
                <input type="number" min="1" step="any" placeholder="Amount" autoFocus value={depositAmt} onChange={e => setDepositAmt(e.target.value)} onKeyDown={e => e.key==='Enter' && handleDeposit()}
                  style={{ flex:1, background:'none', border:'none', outline:'none', color:'var(--text)', fontSize:15, fontWeight:700, padding:'9px 0', fontFamily:'inherit' }}/>
              </div>
              <button onClick={() => { setDepositTarget(null); setDepositAmt(''); }} className="pave-btn pave-btn-ghost" style={{ padding:'9px 12px' }}>✕</button>
              <button onClick={handleDeposit} disabled={!depositAmt||saving} className="pave-btn pave-btn-teal" style={{ opacity:(!depositAmt||saving)?0.5:1 }}>Add</button>
            </div>
          : <button onClick={() => { setDepositTarget(g); setDepositAmt(''); }} className="pave-btn pave-btn-teal" style={{ width:'100%', justifyContent:'center' }}>+ Add money to this goal</button>
        )}
      </div>
    );
  }

  // ─── Section: Home Dashboard ───────────────────────────────────────────────────
  function HomeSection() {
    const todaySpend  = summary.today || 0;
    const dailyLimit  = summary.goals?.find(g=>g.category==='total')?.declared_income
      ? Math.round(summary.goals.find(g=>g.category==='total').declared_income / 30) : 0;

    return (
      <div>
        <div style={{ padding:'28px 0 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:20, fontWeight:600, letterSpacing:'-0.4px' }}>{greeting}, {userName} 👋</div>
            <div style={{ fontSize:13, color:'var(--text2)', marginTop:2 }}>{new Date().toLocaleDateString('en-NG',{weekday:'long',day:'numeric',month:'long',year:'numeric'})} · Your money picture</div>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <button className="pave-btn pave-btn-ghost" onClick={() => setSection('income')}>📥 Log income</button>
            <button className="pave-btn pave-btn-ghost" onClick={() => setLumiOpen(true)} style={{ border:'1px solid rgba(200,149,92,0.35)', color:'#C8955C' }}>✨ Ask Lumi</button>
            <button className="pave-btn pave-btn-accent" onClick={() => setShowAdd(true)}>+ Add expense</button>
          </div>
        </div>

        {/* Hero spend card */}
        <div className="pave-card" style={{ marginBottom:20, padding:'28px', borderColor:'rgba(232,164,80,0.15)', background:'linear-gradient(135deg,rgba(232,164,80,0.05) 0%,var(--bg2) 60%)' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
            <div>
              <div style={{ fontSize:10, fontWeight:600, color:'var(--text3)', letterSpacing:'0.6px', textTransform:'uppercase', marginBottom:6 }}>Today's spending</div>
              {todaySpend === 0
                ? <div style={{ fontSize:32, fontWeight:700, color:'var(--text3)', fontStyle:'italic' }}>Nothing logged yet</div>
                : <div style={{ fontSize:44, fontWeight:700, letterSpacing:'-1.5px', color:'var(--accent)' }}>{fmt(todaySpend)}</div>}
              {dailyLimit > 0 && <div style={{ fontSize:12, color:'var(--text2)', marginTop:4 }}>Daily estimate: <strong style={{ color:'var(--text)' }}>{fmt(dailyLimit)}</strong> · <span style={{ color:'var(--teal)' }}>{fmt(Math.max(0, dailyLimit - todaySpend))} remaining</span></div>}
            </div>
            {income > 0 && (
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:10, fontWeight:600, color:'var(--text3)', letterSpacing:'0.6px', textTransform:'uppercase', marginBottom:4 }}>This month</div>
                <div style={{ fontSize:22, fontWeight:600 }}>{fmt(spent)}</div>
                <div style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>of {fmt(income)} income</div>
              </div>
            )}
          </div>
          {dailyLimit > 0 && (
            <div style={{ marginTop:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:11, color:'var(--text3)' }}>
                <span>Daily limit used</span><span>{fmt(todaySpend)} of {fmt(dailyLimit)}</span>
              </div>
              {pctBar(todaySpend, dailyLimit)}
            </div>
          )}
        </div>

        {/* Safe to Spend */}
        <div className="pave-card" style={{ marginBottom:16, padding:'18px 22px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          {safeToSpend === null ? (
            <div style={{ fontSize:13, color:'var(--text3)', fontStyle:'italic' }}>
              Set your monthly income in the <button onClick={() => setSection('budget')} style={{ background:'none', border:'none', color:'var(--accent)', cursor:'pointer', fontSize:13, fontFamily:'inherit', textDecoration:'underline', padding:0 }}>Budget tab</button> to unlock Safe to Spend
            </div>
          ) : (
            <>
              <div>
                <div style={{ fontSize:10, fontWeight:600, color:'var(--text3)', letterSpacing:'0.6px', textTransform:'uppercase', marginBottom:4 }}>Safe to spend this month</div>
                <div style={{ fontSize:44, fontWeight:700, letterSpacing:'-1.5px', color:'#C8955C', lineHeight:1 }}>{fmt(safeToSpend)}</div>
              </div>
              <div style={{ fontSize:12, color:'var(--text3)', maxWidth:160, textAlign:'right', lineHeight:1.5 }}>
                After income, spending &amp; savings goals
              </div>
            </>
          )}
        </div>

        {/* Stat cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
          <StatCard label="This month" value={fmt(spent)} sub={income > 0 ? `${Math.round(spendPct)}% of income` : undefined} color="var(--accent)" />
          <StatCard label="Daily burn" value={fmt(Math.round(summary.avgDaily||0))} sub={summary.daysLeft > 0 ? `${summary.daysLeft} days left in month` : undefined} />
          <StatCard label="Net surplus" value={fmt(Math.abs(surplus))} color={surplus >= 0 ? 'var(--teal)' : 'var(--red)'} sub={income > 0 ? `${Math.abs(Math.round(surplus/income*100))}% savings rate` : undefined} />
          <StatCard label="Budget remaining" value={income > 0 ? fmt(Math.max(0, income - spent)) : '—'} sub={income > 0 ? `of ${fmt(income)} budget` : 'Set income in Budget tab'} />
        </div>

        {/* Categories today */}
        {todayEntries.length > 0 && (
          <div className="pave-card" style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--text3)', letterSpacing:'0.6px', textTransform:'uppercase', marginBottom:14 }}>Today's transactions · {todayEntries.length}</div>
            {todayEntries.map((e,i) => {
              const c = catInfo(e.category);
              return (
                <div key={e.id||i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom: i<todayEntries.length-1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width:34, height:34, borderRadius:10, background:`${c.color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{c.icon}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.note || c.label}</div>
                    <div style={{ fontSize:10, color:'var(--text2)', marginTop:1 }}>{c.label}</div>
                  </div>
                  <div style={{ fontSize:14, fontWeight:700, color: e.type==='income' ? 'var(--teal)' : 'var(--accent)' }}>
                    {e.type==='income' ? '+' : '−'}{fmt(e.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {todayEntries.length === 0 && (
          <div className="pave-card" style={{ marginBottom:20, textAlign:'center', padding:'36px 20px' }}>
            <div style={{ fontSize:28, marginBottom:10 }}>✍️</div>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:6 }}>No transactions yet today</div>
            <div style={{ fontSize:12, color:'var(--text2)', marginBottom:16 }}>Log your first expense to start tracking.</div>
            <button className="pave-btn pave-btn-accent" onClick={() => setShowAdd(true)}>+ Log a transaction</button>
          </div>
        )}

        {/* Overspend alerts */}
        {overspendCats.map(c => {
          const g = summary.goals.find(g => g.category === c.category);
          const ci = catInfo(c.category);
          return (
            <div key={c.category} style={{ background:'rgba(224,85,85,0.08)', border:'1px solid rgba(224,85,85,0.2)', borderRadius:12, padding:14, marginBottom:12 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--red)', marginBottom:4 }}>⚠️ {ci.label} is over budget</div>
              <div style={{ fontSize:12, color:'var(--text2)' }}>You've spent <strong style={{ color:'var(--text)' }}>{fmt(c.total)}</strong> — {fmt(c.total - g.limit)} over your {fmt(g.limit)} limit.</div>
            </div>
          );
        })}

        {/* Savings snapshot */}
        {savingsGoals.filter(g => !g.is_complete).length > 0 && (
          <div className="pave-card" style={{ marginTop:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--text3)', letterSpacing:'0.6px', textTransform:'uppercase' }}>Active savings goals</div>
              <button className="pave-btn pave-btn-ghost" style={{ fontSize:11, padding:'5px 12px' }} onClick={() => setSection('savings')}>View all →</button>
            </div>
            {savingsGoals.filter(g => !g.is_complete).slice(0,2).map(g => {
              const pct = g.target_amount > 0 ? Math.min((Number(g.saved_amount)/Number(g.target_amount))*100, 100) : 0;
              return (
                <div key={g.id} style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, fontSize:13 }}>
                    <span>{g.emoji} {g.name}</span>
                    <span style={{ color:'var(--teal)' }}>{fmt(g.saved_amount)} / {fmt(g.target_amount)}</span>
                  </div>
                  {pctBar(Number(g.saved_amount), Number(g.target_amount), '#3ECFAA')}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ─── Section: Expenditure ──────────────────────────────────────────────────────
  function ExpenditureSection() {
    const lowest  = [...(summary.categories||[])].sort((a,b)=>a.total-b.total)[0];
    const highest = [...(summary.categories||[])].sort((a,b)=>b.total-a.total)[0];

    return (
      <div>
        <div style={{ padding:'28px 0 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:20, fontWeight:600 }}>Expenditure</div>
            <div style={{ fontSize:13, color:'var(--text2)', marginTop:2 }}>How much you're spending — and where it's going</div>
          </div>
          <button className="pave-btn pave-btn-ghost" onClick={() => setSection('history')}>📋 Full history</button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
          <StatCard label="Total today" value={fmt(summary.today||0)} color="var(--accent)" />
          <StatCard label="This month" value={fmt(spent)} />
          <StatCard label="Daily burn" value={fmt(Math.round(summary.avgDaily||0))} sub="30-day avg" />
          <StatCard label="Projected month-end" value={fmt(projected)} color={projected > income && income > 0 ? 'var(--red)' : 'var(--text)'} />
        </div>

        {summary.categories?.length > 0 ? (
          <div className="pave-card" style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--text3)', letterSpacing:'0.6px', textTransform:'uppercase', marginBottom:16 }}>Where your money went this month</div>
            {summary.categories.map(c => {
              const ci   = catInfo(c.category);
              const g    = summary.goals?.find(g => g.category === c.category);
              const pct  = spent > 0 ? Math.round((c.total/spent)*100) : 0;
              return (
                <div key={c.category} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                  <div style={{ width:28, height:28, borderRadius:8, background:`${ci.color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>{ci.icon}</div>
                  <div style={{ fontSize:13, flex:1 }}>{ci.label}</div>
                  <div style={{ flex:2 }}>{pctBar(c.total, g?.limit > 0 ? g.limit : spent, ci.color)}</div>
                  <div style={{ fontSize:13, fontWeight:500, width:80, textAlign:'right', color: g?.limit > 0 && c.total > g.limit ? 'var(--red)' : 'var(--text)' }}>{fmt(c.total)}</div>
                  <div style={{ fontSize:11, color:'var(--text3)', width:32, textAlign:'right' }}>{pct}%</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="pave-card" style={{ marginBottom:20, textAlign:'center', padding:'40px 20px' }}>
            <div style={{ fontSize:28, marginBottom:10 }}>📊</div>
            <div style={{ fontSize:14, color:'var(--text2)' }}>No spending data yet. Log your first expense to see breakdown.</div>
          </div>
        )}

        {(lowest || highest) && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
            {lowest && (
              <div className="pave-card" style={{ borderColor:'rgba(62,207,170,0.2)' }}>
                <div style={{ fontSize:10, fontWeight:600, color:'var(--text3)', letterSpacing:'0.6px', textTransform:'uppercase', marginBottom:10 }}>Lowest spending</div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:24 }}>{catInfo(lowest.category).icon}</span>
                  <div>
                    <div style={{ fontSize:15, fontWeight:600 }}>{catInfo(lowest.category).label}</div>
                    <div style={{ fontSize:12, color:'var(--text2)' }}>{fmt(lowest.total)} this month</div>
                  </div>
                </div>
              </div>
            )}
            {highest && (
              <div className="pave-card" style={{ borderColor:'rgba(224,85,85,0.2)' }}>
                <div style={{ fontSize:10, fontWeight:600, color:'var(--text3)', letterSpacing:'0.6px', textTransform:'uppercase', marginBottom:10 }}>Highest spending</div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:24 }}>{catInfo(highest.category).icon}</span>
                  <div>
                    <div style={{ fontSize:15, fontWeight:600 }}>{catInfo(highest.category).label}</div>
                    <div style={{ fontSize:12, color:'var(--red)' }}>{fmt(highest.total)} this month</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ─── Section: History ──────────────────────────────────────────────────────────
  function HistorySection() {
    const totalExp = filteredHistory.filter(e=>e.type==='expense').reduce((s,e)=>s+Number(e.amount),0);
    const totalInc = filteredHistory.filter(e=>e.type==='income').reduce((s,e)=>s+Number(e.amount),0);
    return (
      <div>
        <div style={{ padding:'28px 0 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:20, fontWeight:600 }}>Full History</div>
            <div style={{ fontSize:13, color:'var(--text2)', marginTop:2 }}>Every transaction, searchable and filterable</div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button
              onClick={() => navigate(`/journal/page?type=budget&template=Daily+Expenses`)}
              style={{ padding:'7px 14px', borderRadius:'var(--radius)', border:'1px solid var(--border)', background:'transparent', color:'var(--text2)', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}
              title="View today's expenses in your Budget Journal"
            >
              📓 Budget Journal
            </button>
            <button className="pave-btn pave-btn-accent" onClick={() => setShowAdd(true)}>+ Add row</button>
          </div>
        </div>

        <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
          <input className="pave-input" placeholder="🔍 Search…" value={histQuery} onChange={e => setHistQuery(e.target.value)} style={{ flex:1, minWidth:180 }} />
          <select className="pave-select" style={{ width:'auto' }} value={histType} onChange={e => setHistType(e.target.value)}>
            <option value="all">All types</option>
            <option value="expense">Expenses</option>
            <option value="income">Income</option>
          </select>
          <select className="pave-select" style={{ width:'auto' }} value={histCat} onChange={e => setHistCat(e.target.value)}>
            <option value="all">All categories</option>
            {EXPENSE_CATS.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            {INCOME_CATS.map(c => <option key={c.id+'_i'} value={c.id}>{c.icon} {c.label}</option>)}
          </select>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:16 }}>
          <StatCard label="Showing" value={`${filteredHistory.length} transactions`} />
          <StatCard label="Total expenses" value={fmt(totalExp)} color="var(--accent)" />
          <StatCard label="Total income" value={fmt(totalInc)} color="var(--teal)" />
        </div>

        {filteredHistory.length === 0 ? (
          <div className="pave-card" style={{ textAlign:'center', padding:'40px 20px' }}>
            <div style={{ fontSize:28, marginBottom:10 }}>🔍</div>
            <div style={{ fontSize:14, color:'var(--text2)' }}>{entries.length === 0 ? 'No transactions yet — log your first one above.' : 'No transactions match your search.'}</div>
          </div>
        ) : (
          <div style={{ overflowX:'auto', borderRadius:'var(--radius)', border:'1px solid var(--border)' }}>
            <table className="pave-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Source</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((e,i) => <TxRow key={e.id||i} e={e} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ─── Section: AI Insights ──────────────────────────────────────────────────────
  function InsightsSection() {
    const savingsRate = income > 0 ? Math.round((surplus/income)*100) : 0;
    let health = 50;
    if (savingsRate > 30) health += 25;
    else if (savingsRate > 15) health += 12;
    else if (savingsRate < 0) health -= 20;
    health -= overspendCats.length * 8;
    health = Math.max(10, Math.min(100, health));
    const hColor = health >= 70 ? 'var(--teal)' : health >= 45 ? 'var(--accent)' : 'var(--red)';
    const hLabel = health >= 70 ? 'Solid' : health >= 45 ? 'Watch a few things' : 'Needs attention';

    return (
      <div>
        <div style={{ padding:'28px 0 20px' }}>
          <div style={{ fontSize:20, fontWeight:600 }}>AI Insights ✨</div>
          <div style={{ fontSize:13, color:'var(--text2)', marginTop:2 }}>What your spending patterns reveal</div>
        </div>

        {/* Health score */}
        <div className="pave-card" style={{ marginBottom:20, display:'flex', alignItems:'center', gap:20 }}>
          <div style={{ position:'relative', width:72, height:72, flexShrink:0 }}>
            <svg width="72" height="72" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7"/>
              <circle cx="36" cy="36" r="28" fill="none" stroke={hColor} strokeWidth="7"
                strokeDasharray={`${175.9*(health/100)} 175.9`} strokeLinecap="round" transform="rotate(-90 36 36)"/>
            </svg>
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, color: hColor }}>{health}</div>
          </div>
          <div>
            <div style={{ fontSize:18, fontWeight:700, color: hColor }}>{hLabel}</div>
            <div style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>Financial health score · {new Date().toLocaleDateString('en-NG',{month:'long',year:'numeric'})}</div>
            <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
              {savingsRate >= 15 && <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:'rgba(62,207,170,0.12)', color:'var(--teal)' }}>✓ Saving {savingsRate}%</span>}
              {overspendCats.map(c => <span key={c.category} style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:'rgba(224,85,85,0.12)', color:'var(--red)' }}>⚠ {catInfo(c.category).label} over</span>)}
              {overspendCats.length===0 && entries.length>0 && <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:'rgba(62,207,170,0.12)', color:'var(--teal)' }}>✓ All within budget</span>}
            </div>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="pave-card" style={{ textAlign:'center', padding:'48px 20px' }}>
            <div style={{ fontSize:32, marginBottom:12 }}>✨</div>
            <div style={{ fontSize:15, fontWeight:600, marginBottom:8 }}>Insights appear as you log</div>
            <div style={{ fontSize:13, color:'var(--text2)' }}>Add a few transactions and come back here to see patterns.</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {summary.avgDaily > 0 && (
              <div className="pave-card">
                <div style={{ display:'flex', gap:12 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:'rgba(224,85,85,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🔥</div>
                  <div>
                    <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'0.6px', textTransform:'uppercase', marginBottom:4 }}>Daily burn rate</div>
                    <div style={{ fontSize:14, lineHeight:1.6 }}>You're spending <strong>{fmt(Math.round(summary.avgDaily))}</strong> per day on average. At this pace, this month will cost about <strong>{fmt(projected)}</strong>.{income>0 ? ` That's ${projected > income ? 'over' : 'within'} your ${fmt(income)} income.` : ''}</div>
                  </div>
                </div>
              </div>
            )}
            {income > 0 && (
              <div className="pave-card">
                <div style={{ display:'flex', gap:12 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background: surplus>=0 ? 'rgba(62,207,170,0.12)' : 'rgba(224,85,85,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{surplus>=0?'🎯':'⚠️'}</div>
                  <div>
                    <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'0.6px', textTransform:'uppercase', marginBottom:4 }}>{surplus>=0?'Investable surplus':'Spending over income'}</div>
                    <div style={{ fontSize:14, lineHeight:1.6 }}>
                      {surplus>=0
                        ? <>After all expenses you have <strong style={{ color:'var(--teal)' }}>{fmt(surplus)}</strong> left — a <strong>{savingsRate}%</strong> savings rate. Consider moving some to a savings goal.</>
                        : <>You've spent <strong style={{ color:'var(--red)' }}>{fmt(Math.abs(surplus))}</strong> more than your declared income this month.</>}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {overspendCats.map(c => {
              const g = summary.goals.find(g=>g.category===c.category);
              const ci = catInfo(c.category);
              return (
                <div key={c.category} className="pave-card" style={{ borderColor:'rgba(224,85,85,0.2)' }}>
                  <div style={{ display:'flex', gap:12 }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:'rgba(224,85,85,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>⚠️</div>
                    <div>
                      <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'0.6px', textTransform:'uppercase', marginBottom:4 }}>{ci.label} over budget</div>
                      <div style={{ fontSize:14, lineHeight:1.6 }}>You've spent <strong>{fmt(c.total)}</strong> on {ci.label} — <strong style={{ color:'var(--red)' }}>{fmt(c.total-g.limit)}</strong> over your {fmt(g.limit)} limit.</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ─── Section: Savings ─────────────────────────────────────────────────────────
  function SavingsSection() {
    return (
      <div>
        <div style={{ padding:'28px 0 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:20, fontWeight:600 }}>Savings 🎯</div>
            <div style={{ fontSize:13, color:'var(--text2)', marginTop:2 }}>Goals you're building toward — money set aside on purpose</div>
          </div>
          <button className="pave-btn pave-btn-accent" onClick={() => setGoalModal(true)}>+ New goal</button>
        </div>
        {savingsGoals.length === 0 ? (
          <div className="pave-card" style={{ textAlign:'center', padding:'60px 20px' }}>
            <div style={{ fontSize:36, marginBottom:12 }}>🎯</div>
            <div style={{ fontSize:16, fontWeight:600, marginBottom:8 }}>No savings goals yet</div>
            <div style={{ fontSize:13, color:'var(--text2)', marginBottom:20 }}>Create your first goal — a laptop, emergency fund, holiday, anything you're building toward.</div>
            <button className="pave-btn pave-btn-teal" onClick={() => setGoalModal(true)}>+ Create first goal</button>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:14 }}>
            {savingsGoals.map(g => <GoalCard key={g.id} g={g} />)}
            <div className="pave-card" style={{ border:'1px dashed var(--border2)', background:'transparent', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:200, gap:10, cursor:'pointer' }} onClick={() => setGoalModal(true)}>
              <div style={{ fontSize:32, opacity:0.3 }}>+</div>
              <div style={{ fontSize:14, color:'var(--text3)' }}>Add a new goal</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Section: Budget goals ─────────────────────────────────────────────────────
  function BudgetSection() {
    const savingsRate = income > 0 ? Math.round(((income-spent)/income)*100) : 0;
    const health = Math.max(10, Math.min(100, 50 + (savingsRate>30?25:savingsRate>15?12:savingsRate<0?-20:0) - overspendCats.length*8));
    const hColor = health>=70?'var(--teal)':health>=45?'var(--accent)':'var(--red)';

    return (
      <div>
        <div style={{ padding:'28px 0 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:20, fontWeight:600 }}>Budget</div>
            <div style={{ fontSize:13, color:'var(--text2)', marginTop:2 }}>{new Date().toLocaleDateString('en-NG',{month:'long',year:'numeric'})} · Set spending limits</div>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:16, padding:16, background:'var(--bg3)', borderRadius:12, marginBottom:20 }}>
          <svg width="56" height="56" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6"/>
            <circle cx="28" cy="28" r="22" fill="none" stroke={hColor} strokeWidth="6"
              strokeDasharray={`${138.2*(health/100)} 138.2`} strokeLinecap="round" transform="rotate(-90 28 28)"/>
          </svg>
          <div>
            <div style={{ fontSize:22, fontWeight:700, color: hColor }}>{health} / 100</div>
            <div style={{ fontSize:12, color:'var(--text2)' }}>Financial health score{overspendCats.length>0 ? ` — ${overspendCats.map(c=>catInfo(c.category).label).join(', ')} over budget` : entries.length>0?' — all within budget':''}</div>
          </div>
        </div>

        <div className="pave-card" style={{ marginBottom:16 }}>
          <div style={{ fontSize:10, fontWeight:600, color:'var(--text3)', letterSpacing:'0.6px', textTransform:'uppercase', marginBottom:10 }}>Monthly income</div>
          <div style={{ fontSize:12, color:'var(--text2)', marginBottom:10 }}>How much do you expect this month? Sets your spending baseline.</div>
          <div style={{ display:'flex', alignItems:'center', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:10, overflow:'hidden', marginBottom:8 }}>
            <span style={{ padding:'0 14px', color:'var(--text2)', fontSize:18, fontWeight:700 }}>₦</span>
            <input type="number" min="0" step="any" placeholder="e.g. 250,000" value={budgetIncome} onChange={e => setBudgetIncome(e.target.value)}
              style={{ flex:1, background:'none', border:'none', outline:'none', color:'var(--text)', fontSize:20, fontWeight:700, padding:'13px 0', fontFamily:'inherit' }} />
          </div>
        </div>

        <div className="pave-card" style={{ marginBottom:16 }}>
          <div style={{ fontSize:10, fontWeight:600, color:'var(--text3)', letterSpacing:'0.6px', textTransform:'uppercase', marginBottom:6 }}>Category limits · optional</div>
          <div style={{ fontSize:12, color:'var(--text2)', marginBottom:16 }}>Leave blank to track without a cap.</div>
          {EXPENSE_CATS.filter(c=>c.id!=='savings').map(c => {
            const current = summary.categories?.find(s=>s.category===c.id)?.total || 0;
            const limit   = parseFloat(budgetLimits[c.id]||0);
            const over    = limit>0 && current>limit;
            return (
              <div key={c.id} style={{ marginBottom:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom: limit>0?6:0 }}>
                  <span style={{ fontSize:18, width:24 }}>{c.icon}</span>
                  <span style={{ fontSize:13, flex:1, color:'var(--text)' }}>{c.label}</span>
                  {current>0 && <span style={{ fontSize:11, color: over?'var(--red)':'var(--text2)' }}>{fmt(current)} spent</span>}
                  <div style={{ display:'flex', alignItems:'center', background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:9, overflow:'hidden', width:130 }}>
                    <span style={{ padding:'0 8px', color:'var(--text2)', fontSize:12 }}>₦</span>
                    <input type="number" min="0" step="any" placeholder="—" value={budgetLimits[c.id]||''}
                      onChange={e => setBudgetLimits(l => ({ ...l, [c.id]: e.target.value }))}
                      style={{ flex:1, background:'none', border:'none', outline:'none', color:'var(--text)', fontSize:13, padding:'9px 0', fontFamily:'inherit' }}/>
                  </div>
                </div>
                {limit>0 && pctBar(current, limit, c.color)}
              </div>
            );
          })}
        </div>

        <button onClick={handleSaveBudget} disabled={saving} className="pave-btn"
          style={{ width:'100%', justifyContent:'center', padding:'14px', borderRadius:12, border:'none', cursor:'pointer', fontWeight:700, fontSize:14, fontFamily:'inherit', transition:'all 0.2s', opacity: saving?0.6:1, background: budgetSaved?'rgba(62,207,170,0.18)':'var(--teal)', color: budgetSaved?'var(--teal)':'#0a0a0a' }}>
          {budgetSaved ? '✓ Saved' : saving ? 'Saving…' : 'Save budget'}
        </button>

        {income > 0 && spent > 0 && (
          <div className="pave-card" style={{ marginTop:16 }}>
            <div style={{ fontSize:10, fontWeight:600, color:'var(--text3)', letterSpacing:'0.6px', textTransform:'uppercase', marginBottom:14 }}>Budget vs actual · {new Date().toLocaleDateString('en-NG',{month:'long',year:'numeric'})}</div>
            {summary.categories?.map(c => {
              const g = summary.goals?.find(g=>g.category===c.category);
              if (!g?.limit) return null;
              return (
                <div key={c.category} style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:13 }}>
                    <span>{catInfo(c.category).icon} {catInfo(c.category).label}</span>
                    <span>{fmt(c.total)} of {fmt(g.limit)} {c.total > g.limit ? <span style={{ color:'var(--red)' }}>↑ Over</span> : <span style={{ color:'var(--teal)' }}>✓ Under</span>}</span>
                  </div>
                  {pctBar(c.total, g.limit, catInfo(c.category).color)}
                </div>
              );
            })}
            <div style={{ borderTop:'1px solid var(--border)', marginTop:12, paddingTop:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:13, color:'var(--text2)' }}>Total budget remaining</span>
              <span style={{ fontSize:20, fontWeight:700, color: surplus>=0?'var(--teal)':'var(--red)' }}>{fmt(Math.abs(surplus))}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Section: Income ──────────────────────────────────────────────────────────
  function IncomeSection() {
    const incomeEntries = entries.filter(e => e.type==='income' && e.entry_date?.slice(0,7) === todayISO().slice(0,7));

    return (
      <div>
        <div style={{ padding:'28px 0 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:20, fontWeight:600 }}>Income 💰</div>
            <div style={{ fontSize:13, color:'var(--text2)', marginTop:2 }}>What comes in — and how it compares to what goes out</div>
          </div>
          <button className="pave-btn pave-btn-accent" onClick={() => setShowAdd(true)}>+ Log income</button>
        </div>

        <div className="pave-card" style={{ marginBottom:20, padding:28, borderColor:'rgba(62,207,170,0.15)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, marginBottom:20 }}>
            <div>
              <div style={{ fontSize:10, fontWeight:600, color:'var(--text3)', letterSpacing:'0.6px', textTransform:'uppercase', marginBottom:6 }}>Total income · {new Date().toLocaleDateString('en-NG',{month:'short',year:'numeric'})}</div>
              {income===0
                ? <div style={{ fontSize:22, color:'var(--text3)', fontStyle:'italic' }}>Not set yet</div>
                : <div style={{ fontSize:36, fontWeight:700, letterSpacing:'-1px', color:'var(--teal)' }}>{fmt(income)}</div>}
              <div style={{ fontSize:12, color:'var(--text2)', marginTop:4 }}>{incomeEntries.length} income {incomeEntries.length===1?'entry':'entries'} this month</div>
            </div>
            <div>
              <div style={{ fontSize:10, fontWeight:600, color:'var(--text3)', letterSpacing:'0.6px', textTransform:'uppercase', marginBottom:6 }}>Total spent</div>
              <div style={{ fontSize:36, fontWeight:700, letterSpacing:'-1px', color:'var(--accent)' }}>{fmt(spent)}</div>
              <div style={{ fontSize:12, color:'var(--text2)', marginTop:4 }}>{income>0 ? `${Math.round(spendPct)}% of income used` : 'Log income to see %'}</div>
            </div>
            <div>
              <div style={{ fontSize:10, fontWeight:600, color:'var(--text3)', letterSpacing:'0.6px', textTransform:'uppercase', marginBottom:6 }}>Net surplus</div>
              <div style={{ fontSize:36, fontWeight:700, letterSpacing:'-1px', color: surplus>=0?'var(--teal)':'var(--red)' }}>{fmt(Math.abs(surplus))}</div>
              <div style={{ fontSize:12, color:'var(--text2)', marginTop:4 }}>{income>0 ? `${Math.abs(Math.round(surplus/income*100))}% of income ${surplus>=0?'saved or available':'overspent'}` : 'Set income in Budget tab'}</div>
            </div>
          </div>
          {income > 0 && spent > 0 && (
            <>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text2)', marginBottom:6 }}>
                <span>Spent: {fmt(spent)}</span><span>Surplus: {fmt(Math.max(0,surplus))}</span>
              </div>
              <div style={{ height:10, background:'var(--bg4)', borderRadius:5, overflow:'hidden', display:'flex' }}>
                <div style={{ width:`${spendPct}%`, height:'100%', background:'var(--accent)', borderRadius:'5px 0 0 5px', transition:'width 0.5s' }}/>
                {surplus>0 && <div style={{ flex:1, height:'100%', background:'var(--teal)', borderRadius:'0 5px 5px 0' }}/>}
              </div>
              <div style={{ display:'flex', gap:16, marginTop:8, fontSize:11, color:'var(--text3)' }}>
                <span>■ Spent ({Math.round(spendPct)}%)</span>
                {surplus>0 && <span style={{ color:'var(--teal)' }}>■ Surplus ({Math.round(surplus/income*100)}%)</span>}
              </div>
            </>
          )}
        </div>

        {incomeEntries.length > 0 ? (
          <div className="pave-card">
            <div style={{ fontSize:10, fontWeight:600, color:'var(--text3)', letterSpacing:'0.6px', textTransform:'uppercase', marginBottom:16 }}>Income sources this month</div>
            {incomeEntries.map((e,i) => {
              const c = catInfo(e.category);
              return (
                <div key={e.id||i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom: i<incomeEntries.length-1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:`${c.color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{c.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:500 }}>{e.note || c.label}</div>
                    <div style={{ fontSize:11, color:'var(--text2)', marginTop:1 }}>{fmtDate(e.entry_date)} · {e.source || 'manual'}</div>
                  </div>
                  <div style={{ fontSize:15, fontWeight:600, color:'var(--teal)' }}>{fmt(e.amount)}</div>
                </div>
              );
            })}
            <div style={{ borderTop:'1px solid var(--border)', marginTop:12, paddingTop:12, display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontSize:13, color:'var(--text2)' }}>Total</span>
              <span style={{ fontSize:18, fontWeight:700, color:'var(--teal)' }}>{fmt(incomeEntries.reduce((s,e)=>s+Number(e.amount),0))}</span>
            </div>
          </div>
        ) : (
          <div className="pave-card" style={{ textAlign:'center', padding:'40px 20px' }}>
            <div style={{ fontSize:28, marginBottom:10 }}>💰</div>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:6 }}>No income logged this month</div>
            <div style={{ fontSize:12, color:'var(--text2)', marginBottom:16 }}>Log your salary, freelance, or any income source.</div>
            <button className="pave-btn pave-btn-teal" onClick={() => setShowAdd(true)}>+ Log income</button>
          </div>
        )}
      </div>
    );
  }

  const SECTION_MAP = {
    home: <HomeSection />,
    expenditure: <ExpenditureSection />,
    history: <HistorySection />,
    insights: <InsightsSection />,
    savings: <SavingsSection />,
    budget: <BudgetSection />,
    income: <IncomeSection />,
  };

  return (
    <>
      <style>{CSS}</style>

      <div style={{ display:'flex', minHeight:'100vh', background:'transparent', color:'var(--text)', position:'relative', zIndex:1 }}>

        {/* ── Sidebar ── */}
        <aside className="pave-sidebar">
          <div style={{ padding:'0 20px 24px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:32, height:32, background:'var(--accent)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>₦</div>
              <div className="pave-logo-text">
                <div style={{ fontSize:15, fontWeight:600, letterSpacing:'-0.3px' }}>Pave</div>
                <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>Financial Intelligence</div>
              </div>
            </div>
          </div>

          {['Overview','Finance'].map(group => (
            <div key={group} style={{ padding:'0 12px', marginBottom:4 }}>
              <div className="pave-nav-label" style={{ fontSize:10, fontWeight:600, color:'var(--text3)', letterSpacing:'0.8px', textTransform:'uppercase', padding:'8px 8px 4px' }}>{group}</div>
              {NAV.filter(n => n.group===group).map(n => (
                <div key={n.id} className={`pave-nav-item${section===n.id?' active':''}`} onClick={() => setSection(n.id)}>
                  <span style={{ width:18, textAlign:'center', fontSize:15 }}>{n.icon}</span>
                  <span className="pave-nav-text">{n.label}</span>
                </div>
              ))}
            </div>
          ))}

          <div style={{ padding:'0 12px', marginBottom:4 }}>
            <div className="pave-nav-label" style={{ fontSize:10, fontWeight:600, color:'var(--text3)', letterSpacing:'0.8px', textTransform:'uppercase', padding:'8px 8px 4px' }}>App</div>
            <div className="pave-nav-item" onClick={() => navigate('/dashboard')}>
              <span style={{ width:18, textAlign:'center', fontSize:15 }}>◈</span>
              <span className="pave-nav-text">Back to PLOS</span>
            </div>
          </div>

          <div style={{ marginTop:'auto', padding:'12px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:10, background:'var(--bg3)', borderRadius:10, cursor:'pointer' }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--purple)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600, color:'#fff', flexShrink:0 }}>
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="pave-nav-text">
                <div style={{ fontSize:13, fontWeight:500 }}>{user?.name?.split(' ')[0] || 'You'}</div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>Secured · AES-256</div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="pave-main">
          {loading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:12 }}>
              <div style={{ fontSize:28 }}>⏳</div>
              <div style={{ fontSize:14, color:'var(--text2)' }}>Loading your financial data…</div>
            </div>
          ) : (
            <div style={{ padding:'0 32px 60px', maxWidth:1200 }}>
              {SECTION_MAP[section] || <HomeSection />}
            </div>
          )}
        </main>
      </div>

      {/* ── Modals ── */}
      <AddEntryModal open={showAdd} onClose={() => setShowAdd(false)} onSave={handleAddEntry} saving={saving} />
      <AddGoalModal  open={showGoalModal} onClose={() => setGoalModal(false)} onSave={handleCreateGoal} saving={saving} />

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position:'fixed', bottom:28, left:'50%', transform:'translateX(-50%)', background: toast.err?'rgba(224,85,85,0.12)':'rgba(62,207,170,0.12)', border:`1px solid ${toast.err?'rgba(224,85,85,0.3)':'rgba(62,207,170,0.3)'}`, color: toast.err?'var(--red)':'var(--teal)', padding:'10px 24px', borderRadius:10, fontSize:13, fontWeight:600, fontFamily:'inherit', zIndex:600, whiteSpace:'nowrap', animation:'slideUp 0.2s ease' }}>
          {toast.msg}
        </div>
      )}

      <style>{`@keyframes slideUp{from{opacity:0;transform:translate(-50%,8px)}to{opacity:1;transform:translate(-50%,0)}}`}</style>

      {/* ── Lumi Budget Panel ── */}
      <LumiBudgetPanel
        open={lumiOpen}
        onClose={() => setLumiOpen(false)}
        onEntryLogged={load}
      />
    </>
  );
}
