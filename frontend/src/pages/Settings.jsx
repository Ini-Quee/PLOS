import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState('dark');

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div 
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a0f1e',
        color: '#ffffff',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div 
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px',
          }}
        >
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              color: '#94a3b8',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            ← Back to Dashboard
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#00bfa5',
              border: 'none',
              borderRadius: '8px',
              color: '#0a0f1e',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>

        <h1 style={{ margin: '0 0 32px 0', fontSize: '32px', fontWeight: 700 }}>
          Settings
        </h1>

        {/* Settings Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Appearance */}
          <div 
            style={{
              backgroundColor: '#111827',
              borderRadius: '12px',
              border: '1px solid #1e293b',
              padding: '24px',
            }}
          >
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>
              Appearance
            </h2>
            <div style={{ borderTop: '1px solid #1e293b', paddingTop: '16px' }}>
              <label style={{ display: 'block', marginBottom: '12px', color: '#94a3b8', fontSize: '14px' }}>
                Theme
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setTheme('dark')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: theme === 'dark' ? '#00bfa5' : '#1a2235',
                    border: 'none',
                    borderRadius: '8px',
                    color: theme === 'dark' ? '#0a0f1e' : '#ffffff',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: theme === 'dark' ? 600 : 400,
                  }}
                >
                  Dark
                </button>
                <button
                  onClick={() => setTheme('light')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: theme === 'light' ? '#00bfa5' : '#1a2235',
                    border: 'none',
                    borderRadius: '8px',
                    color: theme === 'light' ? '#0a0f1e' : '#ffffff',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: theme === 'light' ? 600 : 400,
                  }}
                >
                  Light
                </button>
              </div>
              
              <div style={{ marginTop: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input type="checkbox" style={{ width: '20px', height: '20px' }} />
                  <span style={{ color: '#ffffff', fontSize: '14px' }}>
                    Enable LivingBackground animation
                  </span>
                </label>
                <p style={{ margin: '8px 0 0 32px', color: '#475569', fontSize: '13px' }}>
                  Animated nature elements in the background (requires refresh)
                </p>
              </div>
            </div>
          </div>

          {/* Account */}
          <div 
            style={{
              backgroundColor: '#111827',
              borderRadius: '12px',
              border: '1px solid #1e293b',
              padding: '24px',
            }}
          >
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>
              Account
            </h2>
            <div style={{ borderTop: '1px solid #1e293b', paddingTop: '16px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '14px' }}>
                  Name
                </label>
                <input
                  type="text"
                  defaultValue={user?.name || ''}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#1a2235',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '14px' }}>
                  Email
                </label>
                <input
                  type="email"
                  defaultValue={user?.email || ''}
                  disabled
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#1a2235',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    color: '#475569',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <button
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#00bfa5',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#0a0f1e',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Change Password
              </button>
            </div>
          </div>

          {/* Security */}
          <div 
            style={{
              backgroundColor: '#111827',
              borderRadius: '12px',
              border: '1px solid #1e293b',
              padding: '24px',
            }}
          >
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>
              Security
            </h2>
            <div style={{ borderTop: '1px solid #1e293b', paddingTop: '16px' }}>
              <div 
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  backgroundColor: '#1a2235',
                  borderRadius: '8px',
                }}
              >
                <div>
                  <p style={{ margin: '0 0 4px 0', color: '#ffffff', fontSize: '14px', fontWeight: 500 }}>
                    Multi-Factor Authentication
                  </p>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>
                    {user?.mfaEnabled ? '✅ Enabled' : '❌ Not enabled'}
                  </p>
                </div>
                <button
                  onClick={() => navigate('/mfa-setup')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    border: '1px solid #00bfa5',
                    borderRadius: '8px',
                    color: '#00bfa5',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  {user?.mfaEnabled ? 'Manage' : 'Set Up'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
