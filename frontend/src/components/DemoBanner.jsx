import { useState } from 'react'
import { useAuth } from '../lib/auth'
import api from '../lib/api'

export default function DemoBanner() {
  const { user } = useAuth()
  const [resetting, setResetting] = useState(false)
  const [msg, setMsg] = useState('')

  if (!user?.is_demo) return null

  async function handleReset() {
    if (resetting) return
    setResetting(true)
    setMsg('')
    try {
      await api.post('/demo/reset')
      setMsg('Demo data reset!')
      setTimeout(() => { setMsg(''); window.location.reload(); }, 1200)
    } catch {
      setMsg('Reset failed — try again')
    }
    setResetting(false)
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: 'linear-gradient(90deg, rgba(139,92,246,0.9), rgba(245,166,35,0.7))',
      backdropFilter: 'blur(8px)',
      padding: '6px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontSize: 12, color: '#fff', fontFamily: 'inherit',
    }}>
      <span>🎬 <strong>Investor Demo Mode</strong> — this is a live demo account with seed data</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {msg && <span style={{ fontSize: 11, opacity: 0.85 }}>{msg}</span>}
        <button
          onClick={handleReset}
          disabled={resetting}
          style={{
            padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
            background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)',
            color: '#fff', cursor: resetting ? 'wait' : 'pointer', fontFamily: 'inherit',
          }}
        >
          {resetting ? 'Resetting…' : '↺ Reset Demo'}
        </button>
      </div>
    </div>
  )
}
