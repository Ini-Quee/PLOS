import { useState } from 'react'
import { useAuth } from '../lib/auth'
import api from '../lib/api'
import DemoTour from './DemoTour'

export default function DemoBanner() {
  const { user } = useAuth()
  const [resetting, setResetting] = useState(false)
  const [msg, setMsg] = useState('')
  const [showTour, setShowTour] = useState(false)

  if (!user?.is_demo) return null

  async function handleReset() {
    if (resetting) return
    setResetting(true)
    setMsg('')
    try {
      await api.post('/demo/reset')
      setMsg('Reset!')
      setTimeout(() => { setMsg(''); window.location.reload() }, 1000)
    } catch {
      setMsg('Failed')
    }
    setResetting(false)
  }

  const BANNER_HEIGHT = 32;

  return (
    <>
      {/* Spacer so content isn't hidden behind the fixed banner */}
      <div style={{ height: BANNER_HEIGHT }} />
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
        background: 'linear-gradient(90deg, rgba(139,92,246,0.92), rgba(200,149,92,0.8))',
        backdropFilter: 'blur(8px)',
        padding: '6px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 12, color: '#fff', fontFamily: 'inherit',
      }}>
        <span>🎬 <strong>Investor Demo</strong> — live demo account with seed data</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {msg && <span style={{ fontSize: 11, opacity: 0.85 }}>{msg}</span>}
          <button
            onClick={() => setShowTour(true)}
            style={{
              padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
              background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.5)',
              color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            🗺 Tour
          </button>
          <button
            onClick={handleReset}
            disabled={resetting}
            style={{
              padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.35)',
              color: '#fff', cursor: resetting ? 'wait' : 'pointer', fontFamily: 'inherit',
            }}
          >
            {resetting ? '…' : '↺ Reset'}
          </button>
        </div>
      </div>

      {showTour && <DemoTour onClose={() => setShowTour(false)} />}
    </>
  )
}
