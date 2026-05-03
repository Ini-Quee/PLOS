import { useState } from 'react';
import { C } from '../layout/SidebarLayout';
import api from '../../lib/api';

const EMOJI_OPTIONS = ['📓','📔','📒','📕','📗','📘','📙','🗒️','📋','📖','✍️','💡','🌿','🎯','💰','🌸','🔥','⭐','🎨','🧠','💼','🏆','🌙','☀️','🦋','🌊','🗺️','🔑'];
const COLOR_OPTIONS = [
  '#7C3AED','#3B82F6','#10B981','#F59E0B','#EF4444','#EC4899',
  '#8B5CF6','#06B6D4','#84CC16','#F97316','#6366F1','#14B8A6',
];
const FIELD_TYPES = ['text', 'textarea', 'list', 'checkbox', 'number'];

const STEPS = ['Name & Icon', 'Sections', 'Lumi Keywords', 'Review'];

export default function CreateBookWizard({ onClose, onCreated }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Step 1 state
  const [label, setLabel] = useState('');
  const [emoji, setEmoji] = useState('📓');
  const [color, setColor] = useState('#7C3AED');

  // Step 2 state — list of templates (sections)
  // Each template: { name: string, fields: [{key, label, type, placeholder}] }
  const [templates, setTemplates] = useState([
    { name: 'Main Page', fields: [{ key: 'content', label: 'Notes', type: 'textarea', placeholder: 'Write here…' }] }
  ]);
  const [activeTmpl, setActiveTmpl] = useState(0);

  // Step 3 state
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState([]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const typeKey = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'custom';

  function addTemplate() {
    setTemplates(prev => [...prev, { name: 'New Section', fields: [{ key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Write here…' }] }]);
    setActiveTmpl(templates.length);
  }

  function removeTemplate(i) {
    if (templates.length <= 1) return;
    setTemplates(prev => prev.filter((_, idx) => idx !== i));
    setActiveTmpl(Math.max(0, activeTmpl - 1));
  }

  function setTemplateName(i, name) {
    setTemplates(prev => prev.map((t, idx) => idx === i ? { ...t, name } : t));
  }

  function addField(tmplIdx) {
    setTemplates(prev => prev.map((t, idx) => idx === tmplIdx
      ? { ...t, fields: [...t.fields, { key: `field_${t.fields.length}`, label: 'New Field', type: 'text', placeholder: '' }] }
      : t
    ));
  }

  function removeField(tmplIdx, fieldIdx) {
    setTemplates(prev => prev.map((t, idx) => idx === tmplIdx
      ? { ...t, fields: t.fields.filter((_, fi) => fi !== fieldIdx) }
      : t
    ));
  }

  function setField(tmplIdx, fieldIdx, key, value) {
    setTemplates(prev => prev.map((t, idx) => {
      if (idx !== tmplIdx) return t;
      const fields = t.fields.map((f, fi) => fi === fieldIdx ? { ...f, [key]: value } : f);
      return { ...t, fields };
    }));
  }

  function addKeyword() {
    const kw = keywordInput.trim();
    if (!kw || keywords.includes(kw)) { setKeywordInput(''); return; }
    setKeywords(prev => [...prev, kw]);
    setKeywordInput('');
  }

  function removeKeyword(kw) {
    setKeywords(prev => prev.filter(k => k !== kw));
  }

  // ── Save ─────────────────────────────────────────────────────────────────────
  async function handleCreate() {
    if (!label.trim()) { setError('Book name is required.'); setStep(0); return; }
    setSaving(true);
    setError('');
    try {
      const res = await api.post('/journal/pages/types', {
        type_key: typeKey,
        label: label.trim(),
        emoji,
        color,
        templates,
        routing_keywords: keywords,
        display_order: 100,
      });
      onCreated?.(res.data?.type);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create journal. Please try again.');
      setSaving(false);
    }
  }

  // ── Styles ───────────────────────────────────────────────────────────────────
  const S = {
    overlay: {
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      animation: 'fadeIn 0.2s ease',
    },
    modal: {
      background: C.bg2, border: `1px solid ${C.border}`,
      borderRadius: 20, width: '100%', maxWidth: 600, maxHeight: '90vh',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      animation: 'scaleIn 0.25s ease',
    },
    header: {
      padding: '20px 24px 0',
      background: `linear-gradient(135deg, ${color}22, transparent)`,
    },
    body: { flex: 1, overflowY: 'auto', padding: '20px 24px' },
    footer: { padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', gap: 10 },
    label: { fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6, display: 'block' },
    input: {
      width: '100%', padding: '10px 14px', borderRadius: 10,
      background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border2}`,
      color: C.text, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
    },
    btn: (variant) => ({
      padding: '10px 22px', borderRadius: 10, fontSize: 13, fontWeight: 600,
      cursor: 'pointer', fontFamily: 'inherit', border: 'none',
      background: variant === 'primary' ? color : variant === 'ghost' ? 'transparent' : 'rgba(255,255,255,0.07)',
      color: variant === 'primary' ? '#fff' : C.muted,
      border: variant === 'ghost' ? `1px solid ${C.border2}` : 'none',
    }),
    chip: {
      padding: '4px 10px', borderRadius: 20, fontSize: 12,
      background: `${color}22`, border: `1px solid ${color}44`,
      color, display: 'inline-flex', alignItems: 'center', gap: 6,
    },
    sectionTab: (active) => ({
      padding: '6px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
      background: active ? `${color}22` : 'rgba(255,255,255,0.04)',
      border: `1px solid ${active ? color + '44' : C.border2}`,
      color: active ? color : C.muted, fontFamily: 'inherit',
    }),
  };

  // ── Step renderers ────────────────────────────────────────────────────────────
  function Step1() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={S.label}>Book Name</label>
          <input style={S.input} placeholder="e.g. Content Ideas, Travel Log, Study Notes…"
            value={label} onChange={e => setLabel(e.target.value)} autoFocus />
        </div>

        <div>
          <label style={S.label}>Icon</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {EMOJI_OPTIONS.map(e => (
              <button key={e} onClick={() => setEmoji(e)} style={{
                width: 38, height: 38, borderRadius: 8, fontSize: 20,
                border: emoji === e ? `2px solid ${color}` : `1px solid ${C.border2}`,
                background: emoji === e ? `${color}22` : 'rgba(255,255,255,0.04)',
                cursor: 'pointer',
              }}>{e}</button>
            ))}
          </div>
        </div>

        <div>
          <label style={S.label}>Color</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {COLOR_OPTIONS.map(c => (
              <div key={c} onClick={() => setColor(c)} style={{
                width: 32, height: 32, borderRadius: '50%', background: c, cursor: 'pointer',
                border: color === c ? `3px solid #fff` : `2px solid transparent`,
                boxSizing: 'border-box',
              }} />
            ))}
          </div>
        </div>

        {/* Preview */}
        {label && (
          <div style={{ padding: '14px 16px', borderRadius: 12, background: color, display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
            <span style={{ fontSize: 28 }}>{emoji}</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{label}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Your new journal book</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function Step2() {
    const tmpl = templates[activeTmpl] || templates[0];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>
          Define the sections (pages) of your journal and what fields each section has.
        </div>

        {/* Section tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {templates.map((t, i) => (
            <button key={i} onClick={() => setActiveTmpl(i)} style={S.sectionTab(i === activeTmpl)}>
              {t.name}
            </button>
          ))}
          <button onClick={addTemplate} style={{ ...S.sectionTab(false), borderStyle: 'dashed' }}>+ Add section</button>
        </div>

        {/* Active section editor */}
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 16, border: `1px solid ${C.border2}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <input
              value={tmpl.name}
              onChange={e => setTemplateName(activeTmpl, e.target.value)}
              style={{ ...S.input, width: 'auto', flex: 1, marginRight: 10 }}
              placeholder="Section name"
            />
            {templates.length > 1 && (
              <button onClick={() => removeTemplate(activeTmpl)}
                style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '6px 12px', color: '#f87171', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                Remove
              </button>
            )}
          </div>

          <div style={{ fontSize: 11, color: C.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fields</div>
          {tmpl.fields.map((field, fi) => (
            <div key={fi} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <input
                value={field.label}
                onChange={e => setField(activeTmpl, fi, 'label', e.target.value)}
                style={{ ...S.input, fontSize: 12 }}
                placeholder="Field name"
              />
              <select
                value={field.type}
                onChange={e => setField(activeTmpl, fi, 'type', e.target.value)}
                style={{ ...S.input, fontSize: 12 }}
              >
                {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input
                value={field.placeholder || ''}
                onChange={e => setField(activeTmpl, fi, 'placeholder', e.target.value)}
                style={{ ...S.input, fontSize: 12 }}
                placeholder="Placeholder"
              />
              {tmpl.fields.length > 1 && (
                <button onClick={() => removeField(activeTmpl, fi)}
                  style={{ background: 'transparent', border: 'none', color: C.muted, fontSize: 18, cursor: 'pointer', padding: '2px 6px', lineHeight: 1 }}>
                  ×
                </button>
              )}
            </div>
          ))}
          <button onClick={() => addField(activeTmpl)}
            style={{ ...S.btn('ghost'), fontSize: 12, padding: '7px 14px', marginTop: 4 }}>
            + Add field
          </button>
        </div>
      </div>
    );
  }

  function Step3() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
          Tell Lumi what phrases should route content to this journal. When you say something containing these words, Lumi will write it here automatically.
        </div>

        <div>
          <label style={S.label}>Add keyword or phrase</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              style={{ ...S.input, flex: 1 }}
              placeholder="e.g. content idea, video script, post idea…"
              value={keywordInput}
              onChange={e => setKeywordInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addKeyword()}
            />
            <button onClick={addKeyword} style={S.btn('primary')}>Add</button>
          </div>
        </div>

        {keywords.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {keywords.map(kw => (
              <span key={kw} style={S.chip}>
                {kw}
                <span onClick={() => removeKeyword(kw)} style={{ cursor: 'pointer', opacity: 0.7, fontSize: 14 }}>×</span>
              </span>
            ))}
          </div>
        )}

        {keywords.length === 0 && (
          <div style={{ padding: '20px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: `1px dashed ${C.border2}`, textAlign: 'center', fontSize: 12, color: C.muted }}>
            No keywords yet — Lumi won't auto-route to this journal until you add some.
            <br />You can always add them later by telling Lumi to update your journal.
          </div>
        )}

        <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', fontSize: 12, color: 'rgba(165,180,252,0.8)', lineHeight: 1.6 }}>
          ✨ You can also tell Lumi later: <em>"Add a Lifestyle section to my {label || 'journal'}"</em> or <em>"Update my {label || 'journal'} to include travel content"</em> and Lumi will add new sections automatically.
        </div>
      </div>
    );
  }

  function Step4() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Book preview */}
        <div style={{ padding: '20px 18px', borderRadius: 12, background: color, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg,rgba(0,0,0,0.04) 0px,rgba(0,0,0,0.04) 1px,transparent 1px,transparent 24px)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 36 }}>{emoji}</span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{label || 'My Journal'}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>
                {templates.length} section{templates.length !== 1 ? 's' : ''} · {keywords.length} Lumi keyword{keywords.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Sections summary */}
        <div>
          <div style={S.label}>Sections</div>
          {templates.map((t, i) => (
            <div key={i} style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border2}`, marginBottom: 6 }}>
              <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{t.name}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                {t.fields.map(f => f.label).join(' · ')}
              </div>
            </div>
          ))}
        </div>

        {/* Keywords summary */}
        {keywords.length > 0 && (
          <div>
            <div style={S.label}>Lumi keywords</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {keywords.map(kw => <span key={kw} style={S.chip}>{kw}</span>)}
            </div>
          </div>
        )}

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontSize: 13 }}>
            {error}
          </div>
        )}
      </div>
    );
  }

  const stepContent = [Step1, Step2, Step3, Step4];
  const StepComponent = stepContent[step];

  const canNext = () => {
    if (step === 0) return label.trim().length > 0;
    return true;
  };

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>
        {/* Header */}
        <div style={S.header}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0 16px' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Create New Journal</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>Step {step + 1} of 4 — {STEPS[step]}</div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: C.muted, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>

          {/* Progress dots */}
          <div style={{ display: 'flex', gap: 6, paddingBottom: 16 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{
                height: 3, flex: 1, borderRadius: 2,
                background: i <= step ? color : 'rgba(255,255,255,0.1)',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={S.body}>
          <StepComponent />
        </div>

        {/* Footer */}
        <div style={S.footer}>
          <button
            onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}
            style={S.btn('ghost')}
          >
            {step === 0 ? 'Cancel' : '← Back'}
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {step < 3 ? (
              <button
                onClick={() => canNext() && setStep(s => s + 1)}
                disabled={!canNext()}
                style={{ ...S.btn('primary'), opacity: canNext() ? 1 : 0.4 }}
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleCreate}
                disabled={saving}
                style={{ ...S.btn('primary'), minWidth: 120 }}
              >
                {saving ? 'Creating…' : `Create ${label || 'Journal'}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
