import { useNavigate } from 'react-router-dom'

const S = {
  page: {
    minHeight: '100vh',
    background: '#0a0a14',
    color: '#e8e8f0',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    padding: '48px 24px',
  },
  wrap: { maxWidth: 720, margin: '0 auto' },
  back: {
    background: 'none', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, padding: '8px 16px', color: 'rgba(255,255,255,0.45)',
    fontSize: 13, cursor: 'pointer', marginBottom: 40, fontFamily: 'inherit',
  },
  h1: { fontSize: 32, fontWeight: 800, marginBottom: 8, color: '#e8e8f0' },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 40 },
  h2: { fontSize: 18, fontWeight: 700, marginTop: 36, marginBottom: 12, color: '#C8955C' },
  p:  { fontSize: 14, lineHeight: 1.8, color: 'rgba(255,255,255,0.65)', marginBottom: 14 },
  ul: { paddingLeft: 20, marginBottom: 14 },
  li: { fontSize: 14, lineHeight: 1.8, color: 'rgba(255,255,255,0.65)', marginBottom: 6 },
  hr: { border: 'none', borderTop: '1px solid rgba(255,255,255,0.07)', margin: '36px 0' },
}

export default function PrivacyPolicy() {
  const navigate = useNavigate()
  const lastUpdated = 'May 2026'

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <button style={S.back} onClick={() => navigate(-1)}>← Back</button>

        <h1 style={S.h1}>Privacy Policy</h1>
        <p style={S.sub}>Last updated: {lastUpdated}</p>

        <p style={S.p}>
          IniQ ("we", "our", "us") is a personal life planning application. This policy explains what data
          we collect, how we use it, and your rights over it.
        </p>

        <h2 style={S.h2}>What we collect</h2>
        <ul style={S.ul}>
          <li style={S.li}><strong>Account information</strong> — your name and email address when you register</li>
          <li style={S.li}><strong>Journal entries</strong> — text you write in any journal template</li>
          <li style={S.li}><strong>Habits and schedules</strong> — habit names, completion dates, identity scores</li>
          <li style={S.li}><strong>Budget data</strong> — expense and income entries you log</li>
          <li style={S.li}><strong>Savings goals</strong> — goal names and amounts you set</li>
          <li style={S.li}><strong>Lumi conversations</strong> — messages you send to Lumi and her responses</li>
          <li style={S.li}><strong>Lumi memories</strong> — facts Lumi extracts from your conversations to personalise future responses</li>
          <li style={S.li}><strong>Push notification tokens</strong> — if you enable notifications, your device subscription endpoint</li>
          <li style={S.li}><strong>Google OAuth tokens</strong> — if you connect Google, an access token to send Gmail on your behalf</li>
        </ul>

        <h2 style={S.h2}>How we use your data</h2>
        <ul style={S.ul}>
          <li style={S.li}>To provide the app — your data is displayed back to you and used to personalise Lumi's responses</li>
          <li style={S.li}>To send habit reminder notifications you have opted in to</li>
          <li style={S.li}>To send accountability partner emails you have explicitly set up</li>
          <li style={S.li}>We do not sell your data to third parties</li>
          <li style={S.li}>We do not use your data for advertising</li>
        </ul>

        <h2 style={S.h2}>AI processing</h2>
        <p style={S.p}>
          IniQ uses Google Gemini or Groq (depending on configuration) to power Lumi. When you send a message
          to Lumi, your message and relevant context from your account are sent to the AI provider to generate
          a response. We do not use your data to train AI models. Refer to{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer"
            style={{ color: '#C8955C' }}>Google's Privacy Policy</a>{' '}
          and{' '}
          <a href="https://groq.com/privacy-policy/" target="_blank" rel="noopener noreferrer"
            style={{ color: '#C8955C' }}>Groq's Privacy Policy</a>{' '}
          for their data practices.
        </p>

        <h2 style={S.h2}>Google account data</h2>
        <p style={S.p}>
          If you connect your Google account, IniQ only uses your Gmail access to send emails you
          explicitly request through the app. We store your OAuth access token securely in our database.
          You can disconnect your Google account at any time in Settings.
        </p>
        <p style={S.p}>
          IniQ's use of Google user data complies with the{' '}
          <a href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank" rel="noopener noreferrer" style={{ color: '#C8955C' }}>
            Google API Services User Data Policy
          </a>, including the Limited Use requirements.
        </p>

        <h2 style={S.h2}>Data storage and security</h2>
        <ul style={S.ul}>
          <li style={S.li}>All data is stored in a PostgreSQL database with row-level access controls</li>
          <li style={S.li}>All API communication uses HTTPS in production</li>
          <li style={S.li}>Authentication uses JWT tokens stored in HTTP-only cookies</li>
          <li style={S.li}>We do not store payment information</li>
        </ul>

        <h2 style={S.h2}>Your rights</h2>
        <ul style={S.ul}>
          <li style={S.li}><strong>Access</strong> — you can export your data by contacting us</li>
          <li style={S.li}><strong>Deletion</strong> — you can delete your account and all associated data from Settings</li>
          <li style={S.li}><strong>Lumi memory</strong> — you can view and delete individual Lumi memories from the Lumi page</li>
          <li style={S.li}><strong>Notifications</strong> — you can turn off push notifications in your browser settings at any time</li>
        </ul>

        <h2 style={S.h2}>Children</h2>
        <p style={S.p}>
          IniQ is not intended for users under 13 years of age. We do not knowingly collect data from children.
        </p>

        <h2 style={S.h2}>Changes to this policy</h2>
        <p style={S.p}>
          We may update this policy as the app evolves. We will update the "last updated" date at the top.
          Continued use of IniQ after changes constitutes acceptance of the updated policy.
        </p>

        <hr style={S.hr} />

        <p style={{ ...S.p, color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>
          Questions? Contact us at{' '}
          <a href="mailto:privacy@plos.app" style={{ color: '#C8955C' }}>privacy@plos.app</a>
        </p>
      </div>
    </div>
  )
}
