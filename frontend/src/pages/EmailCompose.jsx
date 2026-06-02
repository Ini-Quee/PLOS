import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SidebarLayout, { C } from '../components/layout/SidebarLayout'
import api from '../lib/api'
import { useToast } from '../hooks/useToast'

const SAGE = 'var(--color-primary)'
const GLASS = {
  background: 'rgba(20,12,6,0.55)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  border: '1px solid rgba(122,139,82,0.15)',
  borderRadius: 14,
}

function EmailBlock({ block, index, onChange, onRemove, onSend, sending }) {
  return (
    <div style={{ ...GLASS, padding: '20px 22px', marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Email {index + 1}</div>
        {index > 0 && (
          <button onClick={() => onRemove(index)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>✕</button>
        )}
      </div>

      {/* Context paste */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: 6 }}>Paste client context (notes, email thread, brief)</label>
        <textarea
          value={block.context}
          onChange={e => onChange(index, 'context', e.target.value)}
          placeholder={'e.g. "Met with Jane at Acme Corp — jane@acme.com. She wants a proposal by Friday. Key CTA: schedule a follow-up call."'}
          rows={3}
          style={{
            width: '100%', padding: '10px 13px', borderRadius: 10,
            border: '1px solid rgba(122,139,82,0.2)', background: 'rgba(8,5,3,0.5)',
            color: C.cream || '#EAE0D5', fontSize: 13, fontFamily: 'inherit',
            outline: 'none', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box',
          }}
        />
        <button
          onClick={() => onChange(index, '__extract', true)}
          disabled={block.extracting || !block.context.trim()}
          style={{
            marginTop: 8, padding: '7px 18px', borderRadius: 8, border: 'none',
            background: block.extracting ? 'rgba(122,139,82,0.3)' : 'rgba(122,139,82,0.85)',
            color: '#080503', fontSize: 12, fontWeight: 700,
            cursor: block.extracting || !block.context.trim() ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {block.extracting ? 'Extracting…' : 'Extract →'}
        </button>
      </div>

      {/* Extracted fields */}
      {block.extracted && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Field label="To" value={block.to} onChange={v => onChange(index, 'to', v)} placeholder="recipient@email.com" />
          <Field label="Subject" value={block.subject} onChange={v => onChange(index, 'subject', v)} placeholder="Email subject" />
          <div>
            <label style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: 5 }}>Body</label>
            <textarea
              value={block.body}
              onChange={e => onChange(index, 'body', e.target.value)}
              rows={5}
              style={{
                width: '100%', padding: '10px 13px', borderRadius: 10,
                border: '1px solid rgba(122,139,82,0.15)', background: 'rgba(8,5,3,0.5)',
                color: C.cream || '#EAE0D5', fontSize: 13, fontFamily: 'inherit',
                outline: 'none', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box',
              }}
            />
          </div>
          {block.cta && (
            <div style={{ fontSize: 11, color: C.muted, padding: '8px 12px', borderRadius: 8, background: 'rgba(122,139,82,0.06)', border: '1px solid rgba(122,139,82,0.12)' }}>
              CTA: {block.cta}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => onSend(index)}
              disabled={sending === index || !block.to || !block.body}
              style={{
                padding: '9px 20px', borderRadius: 10, border: 'none',
                background: sending === index ? 'rgba(122,139,82,0.4)' : 'rgba(122,139,82,0.85)',
                color: '#080503', fontSize: 13, fontWeight: 700,
                cursor: (sending === index || !block.to || !block.body) ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {sending === index ? 'Sending…' : 'Send →'}
            </button>
            {block.sent && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#00d4aa' }}>
                ✓ Sent
              </div>
            )}
            {block.error && (
              <div style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: '#f87171' }}>
                {block.error}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: 5 }}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '9px 13px', borderRadius: 10,
          border: '1px solid rgba(122,139,82,0.15)', background: 'rgba(8,5,3,0.5)',
          color: C.cream || '#EAE0D5', fontSize: 13, fontFamily: 'inherit',
          outline: 'none', boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

function emptyBlock() {
  return { context: '', to: '', subject: '', body: '', cta: '', extracted: false, extracting: false, sent: false, error: '' }
}

export default function EmailCompose() {
  const [blocks, setBlocks] = useState([emptyBlock()])
  const [sending, setSending] = useState(null)
  const [sendingAll, setSendingAll] = useState(false)
  const toast = useToast()
  const navigate = useNavigate()

  function updateBlock(index, field, value) {
    if (field === '__extract') {
      extractBlock(index)
      return
    }
    setBlocks(prev => prev.map((b, i) => i === index ? { ...b, [field]: value } : b))
  }

  async function extractBlock(index) {
    const block = blocks[index]
    if (!block.context.trim()) return
    setBlocks(prev => prev.map((b, i) => i === index ? { ...b, extracting: true } : b))
    try {
      const r = await api.post('/gmail/extract', { context: block.context })
      setBlocks(prev => prev.map((b, i) => i === index ? {
        ...b, extracting: false, extracted: true,
        to: r.data.to || b.to,
        subject: r.data.subject || b.subject,
        body: r.data.body || b.body,
        cta: r.data.cta || '',
      } : b))
    } catch (err) {
      setBlocks(prev => prev.map((b, i) => i === index ? { ...b, extracting: false, error: 'Extraction failed — check context and try again' } : b))
    }
  }

  async function sendBlock(index) {
    const block = blocks[index]
    if (!block.to || !block.body) return
    setSending(index)
    setBlocks(prev => prev.map((b, i) => i === index ? { ...b, error: '' } : b))
    try {
      await api.post('/gmail/send', { to: block.to, subject: block.subject, body: block.body })
      setBlocks(prev => prev.map((b, i) => i === index ? { ...b, sent: true } : b))
      toast.success(`Email sent to ${block.to} ✓`)
    } catch (err) {
      const msg = err.response?.data?.error || 'Send failed'
      setBlocks(prev => prev.map((b, i) => i === index ? { ...b, error: msg } : b))
      toast.error(msg)
    }
    setSending(null)
  }

  async function sendAll() {
    setSendingAll(true)
    for (let i = 0; i < blocks.length; i++) {
      if (blocks[i].extracted && !blocks[i].sent && blocks[i].to) {
        await sendBlock(i)
      }
    }
    setSendingAll(false)
  }

  function removeBlock(index) {
    setBlocks(prev => prev.filter((_, i) => i !== index))
  }

  const readyCount = blocks.filter(b => b.extracted && !b.sent && b.to).length

  return (
    <SidebarLayout>
      <div style={{ padding: '24px 28px', maxWidth: 720 }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.cream || '#EAE0D5', marginBottom: 6 }}>
            Smart Email
          </div>
          <div style={{ fontSize: 13, color: C.muted }}>
            Paste client notes — IniQ reads the context, finds the email, and writes the email for you.
          </div>
        </div>

        {/* Email blocks */}
        {blocks.map((block, i) => (
          <EmailBlock
            key={i}
            block={block}
            index={i}
            onChange={updateBlock}
            onRemove={removeBlock}
            onSend={sendBlock}
            sending={sending}
          />
        ))}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
          <button
            onClick={() => setBlocks(prev => [...prev, emptyBlock()])}
            style={{
              padding: '9px 18px', borderRadius: 10,
              border: '1px solid rgba(122,139,82,0.3)', background: 'rgba(122,139,82,0.08)',
              color: 'var(--color-primary)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            + Add another client
          </button>

          {readyCount > 1 && (
            <button
              onClick={sendAll}
              disabled={sendingAll}
              style={{
                padding: '9px 22px', borderRadius: 10, border: 'none',
                background: sendingAll ? 'rgba(122,139,82,0.4)' : 'rgba(122,139,82,0.85)',
                color: '#080503', fontSize: 13, fontWeight: 700,
                cursor: sendingAll ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}
            >
              {sendingAll ? 'Sending all…' : `Send all ${readyCount} →`}
            </button>
          )}
        </div>

        {/* Gmail not connected warning */}
        <div style={{ marginTop: 28, padding: '12px 16px', borderRadius: 10, background: 'rgba(122,139,82,0.06)', border: '1px solid rgba(122,139,82,0.12)', fontSize: 12, color: C.muted }}>
          Gmail must be connected to send. <span onClick={() => navigate('/dashboard')} style={{ color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline' }}>Connect on Dashboard →</span>
        </div>
      </div>
    </SidebarLayout>
  )
}
