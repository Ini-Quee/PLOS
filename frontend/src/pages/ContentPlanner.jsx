import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarLayout, { C } from '../components/layout/SidebarLayout';
import api from '../lib/api';

const PLATFORMS = {
  instagram: { label: 'Instagram', icon: '📸', color: '#E4405F' },
  twitter:   { label: 'Twitter/X', icon: '🐦', color: '#1DA1F2' },
  linkedin:  { label: 'LinkedIn',  icon: '💼', color: '#0A66C2' },
  tiktok:    { label: 'TikTok',    icon: '🎵', color: '#010101' },
  facebook:  { label: 'Facebook',  icon: '👥', color: '#1877F2' },
  blog:      { label: 'Blog',      icon: '✍️', color: '#C8955C' },
  email:     { label: 'Email',     icon: '📧', color: '#6366F1' },
  youtube:   { label: 'YouTube',   icon: '▶️', color: '#FF0000' },
};

const CATEGORIES = ['lifestyle', 'business', 'faith', 'fitness', 'food', 'travel', 'education', 'entertainment', 'personal', 'other'];

const STATUS_COLORS = {
  scheduled: '#F59E0B', posted: '#10B981', cancelled: 'rgba(255,255,255,0.3)',
};

export default function ContentPlanner() {
  const navigate   = useNavigate();
  const [view, setView]         = useState('list');    // 'list' | 'calendar'
  const [posts, setPosts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [calMonth, setCalMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [calPosts, setCalPosts] = useState([]);

  // Modals
  const [showAdd, setShowAdd]           = useState(false);
  const [showImport, setShowImport]     = useState(false);
  const [showBulkResult, setShowBulkResult] = useState(null);

  // Add form
  const [form, setForm] = useState({ platform:'instagram', content:'', title:'', category:'lifestyle', scheduled_for:'', media_url:'' });

  // Lumi import
  const [importText, setImportText]   = useState('');
  const [importParsed, setImportParsed] = useState(null);
  const [importing, setImporting]     = useState(false);

  // Filters
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [filterStatus, setFilterStatus]     = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/content/posts');
      setPosts(res.data.posts || []);
    } catch {}
    setLoading(false);
  }, []);

  const loadCalendar = useCallback(async () => {
    try {
      const res = await api.get(`/content/posts/calendar?month=${calMonth}`);
      setCalPosts(res.data.posts || []);
    } catch {}
  }, [calMonth]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (view === 'calendar') loadCalendar(); }, [view, loadCalendar]);

  async function addPost(e) {
    e.preventDefault();
    try {
      await api.post('/content/posts', { ...form, source: 'user' });
      setShowAdd(false);
      setForm({ platform:'instagram', content:'', title:'', category:'lifestyle', scheduled_for:'', media_url:'' });
      load();
    } catch (err) {
      alert('Failed to schedule post.');
    }
  }

  async function markPosted(id) {
    try {
      await api.post(`/content/posts/${id}/mark-posted`);
      load();
    } catch {}
  }

  async function deletePost(id) {
    if (!window.confirm('Cancel this post?')) return;
    try {
      await api.delete(`/content/posts/${id}`);
      load();
    } catch {}
  }

  async function parseWithLumi() {
    if (!importText.trim()) return;
    setImporting(true);
    try {
      const res = await api.post('/content/posts/import-from-lumi', { text: importText });
      setImportParsed(res.data.posts || []);
    } catch {
      alert('Could not parse content. Try a clearer format.');
    }
    setImporting(false);
  }

  async function confirmImport() {
    if (!importParsed?.length) return;
    try {
      const res = await api.post('/content/posts/bulk', { posts: importParsed.map(p => ({ ...p, source: 'import' })) });
      setShowBulkResult(res.data);
      setShowImport(false);
      setImportText('');
      setImportParsed(null);
      load();
    } catch {
      alert('Import failed. Please try again.');
    }
  }

  // ── Filtered list ─────────────────────────────────────────────────────────────
  const filtered = posts.filter(p => {
    if (filterPlatform !== 'all' && p.platform !== filterPlatform) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    return true;
  });

  const byDate = filtered.reduce((acc, p) => {
    const d = new Date(p.scheduled_for).toDateString();
    if (!acc[d]) acc[d] = [];
    acc[d].push(p);
    return acc;
  }, {});
  const dates = Object.keys(byDate).sort((a, b) => new Date(a) - new Date(b));

  // ── Calendar grid ─────────────────────────────────────────────────────────────
  const [cy, cm] = calMonth.split('-').map(Number);
  const daysInMonth = new Date(cy, cm, 0).getDate();
  const firstDow = new Date(cy, cm - 1, 1).getDay();
  const calCells = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const postsByDay = calPosts.reduce((acc, p) => {
    const d = new Date(p.scheduled_for).getDate();
    if (!acc[d]) acc[d] = [];
    acc[d].push(p);
    return acc;
  }, {});
  const today = new Date();
  const todayNum = (cy === today.getFullYear() && cm === today.getMonth() + 1) ? today.getDate() : null;

  return (
    <SidebarLayout>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ padding: '28px 32px 60px' }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:24 }}>
          <div>
            <div style={{ fontSize:11, color: C.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>📣 Content</div>
            <div style={{ fontSize:26, fontWeight:800 }}>Content Planner</div>
            <div style={{ fontSize:12, color: C.muted, marginTop:4 }}>{posts.filter(p=>p.status==='scheduled').length} scheduled · {posts.filter(p=>p.status==='posted').length} posted</div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setShowImport(true)}
              style={{ padding:'9px 16px', borderRadius:10, border:`1px solid ${C.border2}`, background:'rgba(165,180,252,0.08)', color:'#a5b4fc', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              ✨ Lumi Import
            </button>
            <button onClick={() => setShowAdd(true)}
              style={{ padding:'9px 16px', borderRadius:10, border:'none', background: C.amber, color:'#000', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              + Schedule Post
            </button>
          </div>
        </div>

        {/* View toggle + filters */}
        <div style={{ display:'flex', gap:8, marginBottom:20, alignItems:'center', flexWrap:'wrap' }}>
          {['list','calendar'].map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{ padding:'6px 16px', borderRadius:20, fontSize:12, cursor:'pointer', fontFamily:'inherit', fontWeight:500,
                background: view===v ? 'rgba(200,149,92,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${view===v ? C.amber+'50' : C.border2}`,
                color: view===v ? C.amber : C.muted }}>
              {v === 'list' ? '☰ List' : '📅 Calendar'}
            </button>
          ))}
          <div style={{ flex:1 }} />
          <select value={filterPlatform} onChange={e=>setFilterPlatform(e.target.value)}
            style={{ padding:'6px 10px', borderRadius:8, background:'rgba(255,255,255,0.05)', border:`1px solid ${C.border2}`, color: C.text, fontSize:12, fontFamily:'inherit' }}>
            <option value="all">All platforms</option>
            {Object.entries(PLATFORMS).map(([k,p]) => <option key={k} value={k}>{p.icon} {p.label}</option>)}
          </select>
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
            style={{ padding:'6px 10px', borderRadius:8, background:'rgba(255,255,255,0.05)', border:`1px solid ${C.border2}`, color: C.text, fontSize:12, fontFamily:'inherit' }}>
            <option value="all">All statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="posted">Posted</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* ── LIST VIEW ── */}
        {view === 'list' && (
          loading ? <div style={{ textAlign:'center', padding:60, color: C.muted }}>Loading…</div>
          : dates.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 20px' }}>
              <div style={{ fontSize:32, marginBottom:12 }}>📅</div>
              <div style={{ fontSize:15, color: C.warm }}>No content scheduled yet</div>
              <div style={{ fontSize:12, color: C.muted, marginTop:6 }}>Schedule a post or use Lumi Import to bring in your content plan</div>
            </div>
          ) : dates.map(date => (
            <div key={date} style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, color: C.muted, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10, paddingBottom:6, borderBottom:`1px solid ${C.border}` }}>
                {new Date(date).toLocaleDateString('en-NG', { weekday:'long', day:'numeric', month:'long' })}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {byDate[date].map(post => {
                  const plat = PLATFORMS[post.platform] || PLATFORMS.blog;
                  const time = new Date(post.scheduled_for).toLocaleTimeString('en-NG', { hour:'numeric', minute:'2-digit', hour12:true });
                  return (
                    <div key={post.id} style={{ padding:'14px 16px', borderRadius:12, background: C.bg3, border:`1px solid ${C.border2}`, borderLeft:`3px solid ${plat.color}`, display:'flex', gap:14, alignItems:'flex-start', opacity: post.status==='cancelled' ? 0.4 : 1 }}>
                      <span style={{ fontSize:22, flexShrink:0 }}>{plat.icon}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4, flexWrap:'wrap' }}>
                          {post.title && <span style={{ fontSize:13, fontWeight:600, color: C.text }}>{post.title}</span>}
                          <span style={{ fontSize:10, padding:'2px 8px', borderRadius:10, background:`${plat.color}22`, color: plat.color }}>{plat.label}</span>
                          {post.category && <span style={{ fontSize:10, padding:'2px 8px', borderRadius:10, background:'rgba(255,255,255,0.05)', color: C.muted }}>{post.category}</span>}
                          <span style={{ fontSize:10, padding:'2px 8px', borderRadius:10, background:`${STATUS_COLORS[post.status] || C.muted}22`, color: STATUS_COLORS[post.status] || C.muted }}>{post.status}</span>
                          <span style={{ fontSize:10, color: C.muted, marginLeft:'auto' }}>{time}</span>
                        </div>
                        <div style={{ fontSize:13, color: C.warm, lineHeight:1.6, whiteSpace:'pre-wrap', display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                          {post.content}
                        </div>
                        {post.media_url && <div style={{ fontSize:11, color:'#a5b4fc', marginTop:4 }}>📎 {post.media_url.slice(0,60)}</div>}
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
                        {post.status === 'scheduled' && (
                          <>
                            <button onClick={() => { navigator.clipboard?.writeText(post.content); }}
                              style={{ padding:'5px 10px', borderRadius:7, border:`1px solid ${C.border2}`, background:'transparent', color: C.muted, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
                              Copy
                            </button>
                            <button onClick={() => markPosted(post.id)}
                              style={{ padding:'5px 10px', borderRadius:7, border:`1px solid ${C.teal}44`, background:`${C.teal}11`, color: C.teal, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                              Posted ✓
                            </button>
                          </>
                        )}
                        <button onClick={() => deletePost(post.id)}
                          style={{ padding:'5px 10px', borderRadius:7, border:'1px solid rgba(248,113,113,0.2)', background:'transparent', color:'#f87171', fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {/* ── CALENDAR VIEW ── */}
        {view === 'calendar' && (
          <div>
            <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:16 }}>
              <button onClick={() => { const d = new Date(cy, cm-2, 1); setCalMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`); }}
                style={{ padding:'6px 12px', borderRadius:8, border:`1px solid ${C.border2}`, background:'transparent', color: C.muted, cursor:'pointer', fontFamily:'inherit' }}>‹</button>
              <div style={{ fontSize:15, fontWeight:600, minWidth:140, textAlign:'center' }}>
                {new Date(cy, cm-1).toLocaleDateString('en-NG', { month:'long', year:'numeric' })}
              </div>
              <button onClick={() => { const d = new Date(cy, cm, 1); setCalMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`); }}
                style={{ padding:'6px 12px', borderRadius:8, border:`1px solid ${C.border2}`, background:'transparent', color: C.muted, cursor:'pointer', fontFamily:'inherit' }}>›</button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:8 }}>
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                <div key={d} style={{ fontSize:10, color: C.muted, textAlign:'center', padding:'4px 0' }}>{d}</div>
              ))}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
              {calCells.map((d, i) => {
                if (!d) return <div key={i} />;
                const dayPosts = postsByDay[d] || [];
                const isToday = d === todayNum;
                return (
                  <div key={i} style={{ minHeight:80, padding:6, borderRadius:8, background: isToday ? 'rgba(200,149,92,0.12)' : 'rgba(255,255,255,0.03)', border:`1px solid ${isToday ? C.amber+'44' : C.border2}` }}>
                    <div style={{ fontSize:12, fontWeight: isToday ? 700 : 400, color: isToday ? C.amber : C.muted, marginBottom:4 }}>{d}</div>
                    {dayPosts.slice(0,3).map((p, pi) => {
                      const plat = PLATFORMS[p.platform] || PLATFORMS.blog;
                      return (
                        <div key={pi} title={p.content?.slice(0,80)} style={{ fontSize:10, padding:'2px 5px', borderRadius:4, background:`${plat.color}22`, color: plat.color, marginBottom:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                          {plat.icon} {p.title || p.content?.slice(0,20) || 'Post'}
                        </div>
                      );
                    })}
                    {dayPosts.length > 3 && <div style={{ fontSize:9, color: C.muted }}>+{dayPosts.length-3} more</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ADD POST MODAL ── */}
        {showAdd && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
            onClick={e => e.target===e.currentTarget && setShowAdd(false)}>
            <form onSubmit={addPost} style={{ background: C.bg2, border:`1px solid ${C.border}`, borderRadius:16, padding:24, width:'100%', maxWidth:480 }}>
              <div style={{ fontSize:16, fontWeight:700, marginBottom:16 }}>Schedule Post</div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                <div>
                  <label style={{ fontSize:11, color: C.muted, display:'block', marginBottom:4 }}>Platform</label>
                  <select value={form.platform} onChange={e=>setForm({...form,platform:e.target.value})}
                    style={{ width:'100%', padding:'9px 10px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:`1px solid ${C.border2}`, color: C.text, fontSize:13, fontFamily:'inherit' }}>
                    {Object.entries(PLATFORMS).map(([k,p]) => <option key={k} value={k}>{p.icon} {p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:11, color: C.muted, display:'block', marginBottom:4 }}>Category</label>
                  <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}
                    style={{ width:'100%', padding:'9px 10px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:`1px solid ${C.border2}`, color: C.text, fontSize:13, fontFamily:'inherit' }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom:10 }}>
                <label style={{ fontSize:11, color: C.muted, display:'block', marginBottom:4 }}>Title / Caption headline</label>
                <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Short description…"
                  style={{ width:'100%', padding:'9px 12px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:`1px solid ${C.border2}`, color: C.text, fontSize:13, fontFamily:'inherit', boxSizing:'border-box' }} />
              </div>

              <div style={{ marginBottom:10 }}>
                <label style={{ fontSize:11, color: C.muted, display:'block', marginBottom:4 }}>Post content *</label>
                <textarea value={form.content} onChange={e=>setForm({...form,content:e.target.value})} placeholder="What's on your mind?" rows={4} required
                  style={{ width:'100%', padding:'9px 12px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:`1px solid ${C.border2}`, color: C.text, fontSize:13, fontFamily:'inherit', resize:'vertical', boxSizing:'border-box' }} />
              </div>

              <div style={{ marginBottom:10 }}>
                <label style={{ fontSize:11, color: C.muted, display:'block', marginBottom:4 }}>Schedule date & time *</label>
                <input type="datetime-local" value={form.scheduled_for} onChange={e=>setForm({...form,scheduled_for:e.target.value})} required
                  style={{ width:'100%', padding:'9px 12px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:`1px solid ${C.border2}`, color: C.text, fontSize:13, fontFamily:'inherit', boxSizing:'border-box', colorScheme:'dark' }} />
              </div>

              <div style={{ marginBottom:18 }}>
                <label style={{ fontSize:11, color: C.muted, display:'block', marginBottom:4 }}>Media URL (optional)</label>
                <input value={form.media_url} onChange={e=>setForm({...form,media_url:e.target.value})} placeholder="Google Drive link, image URL…"
                  style={{ width:'100%', padding:'9px 12px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:`1px solid ${C.border2}`, color: C.text, fontSize:13, fontFamily:'inherit', boxSizing:'border-box' }} />
              </div>

              <div style={{ display:'flex', gap:10 }}>
                <button type="button" onClick={() => setShowAdd(false)}
                  style={{ flex:1, padding:11, borderRadius:10, border:`1px solid ${C.border2}`, background:'transparent', color: C.muted, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
                <button type="submit"
                  style={{ flex:1, padding:11, borderRadius:10, border:'none', background: C.amber, color:'#000', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Schedule</button>
              </div>
            </form>
          </div>
        )}

        {/* ── LUMI IMPORT MODAL ── */}
        {showImport && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
            onClick={e => e.target===e.currentTarget && setShowImport(false)}>
            <div style={{ background: C.bg2, border:`1px solid rgba(165,180,252,0.25)`, borderRadius:16, padding:24, width:'100%', maxWidth:560 }}>
              <div style={{ fontSize:16, fontWeight:700, marginBottom:6 }}>✨ Lumi Import</div>
              <div style={{ fontSize:12, color: C.muted, marginBottom:16, lineHeight:1.6 }}>
                Paste your content plan in any format. Lumi will extract each post's platform, content, date, and category.
                <br />
                <strong style={{ color: C.warm }}>Example:</strong> "Instagram lifestyle post about morning routine — Friday May 10 at 3pm"
              </div>

              <textarea value={importText} onChange={e=>setImportText(e.target.value)}
                placeholder="Paste your content list here…&#10;&#10;You can include 1 post or an entire year's worth."
                rows={7}
                style={{ width:'100%', padding:'10px 12px', borderRadius:10, background:'rgba(255,255,255,0.05)', border:`1px solid ${C.border2}`, color: C.text, fontSize:13, fontFamily:'inherit', resize:'vertical', boxSizing:'border-box', lineHeight:1.6 }} />

              {importParsed && (
                <div style={{ marginTop:14, marginBottom:14 }}>
                  <div style={{ fontSize:12, color:'#a5b4fc', fontWeight:600, marginBottom:8 }}>Found {importParsed.length} posts — review before importing:</div>
                  <div style={{ maxHeight:200, overflowY:'auto', display:'flex', flexDirection:'column', gap:6 }}>
                    {importParsed.map((p, i) => {
                      const plat = PLATFORMS[p.platform] || PLATFORMS.blog;
                      return (
                        <div key={i} style={{ display:'flex', gap:8, fontSize:12, color: C.text, padding:'6px 10px', borderRadius:8, background:'rgba(255,255,255,0.04)', alignItems:'flex-start' }}>
                          <span style={{ flexShrink:0 }}>{plat.icon}</span>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontWeight:500, color: C.warm }}>{p.title || p.content?.slice(0,40)}</div>
                            <div style={{ color: C.muted, fontSize:11 }}>
                              {plat.label} · {p.category} · {p.scheduled_for ? new Date(p.scheduled_for).toLocaleDateString('en-NG') : 'No date'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ display:'flex', gap:10, marginTop:16 }}>
                <button onClick={() => { setShowImport(false); setImportText(''); setImportParsed(null); }}
                  style={{ flex:1, padding:11, borderRadius:10, border:`1px solid ${C.border2}`, background:'transparent', color: C.muted, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
                {!importParsed ? (
                  <button onClick={parseWithLumi} disabled={!importText.trim() || importing}
                    style={{ flex:2, padding:11, borderRadius:10, border:'none', background: importText.trim() ? '#a5b4fc' : 'rgba(255,255,255,0.06)', color: importText.trim() ? '#000' : C.muted, fontWeight:700, cursor: importText.trim() ? 'pointer' : 'default', fontFamily:'inherit' }}>
                    {importing ? 'Parsing…' : '✨ Parse with Lumi'}
                  </button>
                ) : (
                  <>
                    <button onClick={() => setImportParsed(null)}
                      style={{ flex:1, padding:11, borderRadius:10, border:`1px solid ${C.border2}`, background:'transparent', color: C.muted, cursor:'pointer', fontFamily:'inherit' }}>Re-parse</button>
                    <button onClick={confirmImport}
                      style={{ flex:2, padding:11, borderRadius:10, border:'none', background: C.amber, color:'#000', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                      Import {importParsed.length} posts ✓
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── BULK IMPORT RESULT ── */}
        {showBulkResult && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
            onClick={() => setShowBulkResult(null)}>
            <div style={{ background: C.bg2, border:`1px solid ${C.teal}44`, borderRadius:16, padding:28, textAlign:'center', maxWidth:360 }}>
              <div style={{ fontSize:36, marginBottom:12 }}>🎉</div>
              <div style={{ fontSize:16, fontWeight:700, color: C.teal, marginBottom:8 }}>{showBulkResult.message}</div>
              <div style={{ fontSize:12, color: C.muted }}>{showBulkResult.created} posts added to your content calendar.</div>
              <button onClick={() => setShowBulkResult(null)} style={{ marginTop:20, padding:'10px 24px', borderRadius:10, border:'none', background: C.teal, color:'#000', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Done</button>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
