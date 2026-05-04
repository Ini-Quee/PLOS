import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function OnboardingModal({ userName, onDone }) {
  const [step, setStep] = useState(1)
  const navigate = useNavigate()

  function finish() {
    localStorage.setItem('plos_onboarded', 'true')
    onDone()
  }

  function goToLumi() {
    localStorage.setItem('plos_onboarded', 'true')
    onDone()
    navigate('/talk-to-lumi')
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', backdropFilter:'blur(12px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'rgba(9,14,20,0.97)', border:'1px solid rgba(200,149,92,0.2)', borderRadius:24, padding:'48px 40px', maxWidth:480, width:'100%', textAlign:'center' }}>
        {step === 1 && (
          <>
            <div style={{ width:36, height:36, borderRadius:'50%', background:'radial-gradient(circle at 35% 35%, #ffbe4d, #F5A623, rgba(245,166,35,0.4))', margin:'0 auto 24px', animation:'breathe 3s ease-in-out infinite', boxShadow:'0 0 20px rgba(245,166,35,0.3)' }} />
            <div style={{ fontSize:28, fontWeight:800, color:'#e8f0e9' }}>
              Welcome to PLOS, {userName?.split(' ')[0] || 'there'} 👋
            </div>
            <div style={{ fontSize:14, color:'rgba(255,255,255,0.5)', lineHeight:1.7, margin:'16px 0 32px' }}>
              PLOS is your personal life operating system. Lumi — your AI companion — will help you plan, journal, and stay on track.
            </div>
            <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
              <button
                onClick={() => setStep(2)}
                style={{ padding:'12px 28px', borderRadius:24, border:'none', background:'rgba(200,149,92,0.85)', color:'#000', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}
              >
                Let's go →
              </button>
              <button
                onClick={finish}
                style={{ padding:'12px 28px', borderRadius:24, border:'1px solid rgba(255,255,255,0.15)', background:'transparent', color:'rgba(255,255,255,0.5)', fontSize:14, fontWeight:500, cursor:'pointer', fontFamily:'inherit' }}
              >
                Skip for now
              </button>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <div style={{ fontSize:48, marginBottom:16 }}>✨</div>
            <div style={{ fontSize:24, fontWeight:700, color:'#e8f0e9' }}>
              Start with a life audit
            </div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.45)', lineHeight:1.7, margin:'16px 0 28px' }}>
              Lumi will interview you across 8 areas of your life — morning, work, meals, health, faith, family, creativity, and sleep — then build your complete weekly schedule in one session.
            </div>
            <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
              <button
                onClick={goToLumi}
                style={{ padding:'12px 28px', borderRadius:24, border:'none', background:'rgba(200,149,92,0.85)', color:'#000', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}
              >
                Start Life Audit with Lumi →
              </button>
              <button
                onClick={finish}
                style={{ padding:'12px 28px', borderRadius:24, border:'1px solid rgba(255,255,255,0.15)', background:'transparent', color:'rgba(255,255,255,0.5)', fontSize:14, fontWeight:500, cursor:'pointer', fontFamily:'inherit' }}
              >
                I'll do it later
              </button>
            </div>
          </>
        )}
      </div>
      <style>{`
        @keyframes breathe { 0%,100% { transform:scale(1); box-shadow:0 0 20px rgba(245,166,35,0.3) } 50% { transform:scale(1.08); box-shadow:0 0 35px rgba(245,166,35,0.5) } }
      `}</style>
    </div>
  )
}
