import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function MfaSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState('start');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSetup() {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/mfa/setup');
      setQrCode(res.data.qrCode);
      setSecret(res.data.secret);
      setStep('scan');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start MFA setup');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/mfa/verify', { code: token });
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0D0D0D',
      color: '#F5F0E8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        borderRadius: '16px',
        border: '1px solid #2E2E2E',
        backgroundColor: '#1A1A1A',
        padding: '32px',
      }}>
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            marginBottom: '24px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#A89880',
            fontSize: '14px',
            cursor: 'pointer',
            fontFamily: "'Inter', sans-serif",
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: 0,
          }}
        >
          ← Back to Dashboard
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(245, 166, 35, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 0 24px rgba(245, 166, 35, 0.25)',
          }}>
            <span style={{ fontSize: '32px' }}>🛡️</span>
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            margin: '0 0 8px 0',
            fontFamily: "'DM Serif Display', serif",
            color: '#F5F0E8',
          }}>
            Set Up MFA
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#A89880',
            margin: 0,
            fontFamily: "'Inter', sans-serif",
            lineHeight: 1.5,
          }}>
            Protect your account with an authenticator app like Google Authenticator or Authy.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginBottom: '16px',
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid rgba(224, 82, 82, 0.3)',
            backgroundColor: 'rgba(224, 82, 82, 0.1)',
            color: '#E05252',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}

        {/* Step 1 — Start */}
        {step === 'start' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: '#242424',
              border: '1px solid #2E2E2E',
            }}>
              <p style={{
                margin: '0 0 12px 0',
                fontSize: '14px',
                color: '#F5F0E8',
                fontFamily: "'Inter', sans-serif",
              }}>
                📱 <strong>Step 1:</strong> Install Google Authenticator or Authy on your phone
              </p>
              <p style={{
                margin: '0 0 12px 0',
                fontSize: '14px',
                color: '#F5F0E8',
                fontFamily: "'Inter', sans-serif",
              }}>
                📷 <strong>Step 2:</strong> Scan the QR code we generate
              </p>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: '#F5F0E8',
                fontFamily: "'Inter', sans-serif",
              }}>
                🔢 <strong>Step 3:</strong> Enter the 6-digit code to confirm
              </p>
            </div>
            <button
              onClick={handleSetup}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#F5A623',
                color: '#0D0D0D',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = '#E09415';
                  e.target.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#F5A623';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              {loading ? 'Generating...' : 'Generate QR Code'}
            </button>
          </div>
        )}

        {/* Step 2 — Scan QR */}
        {step === 'scan' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}>
              <p style={{
                fontSize: '14px',
                color: '#A89880',
                margin: 0,
                fontFamily: "'Inter', sans-serif",
              }}>
                Scan this QR code with your authenticator app:
              </p>
              <div style={{
                borderRadius: '12px',
                backgroundColor: '#FFFFFF',
                padding: '12px',
                border: '1px solid #2E2E2E',
              }}>
                <img src={qrCode} alt="MFA QR Code" style={{ width: '192px', height: '192px' }} />
              </div>
              <details style={{ width: '100%' }}>
                <summary style={{
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: '#6B5F52',
                  fontFamily: "'Inter', sans-serif",
                }}>
                  Can't scan? Enter code manually
                </summary>
                <p style={{
                  margin: '12px 0 0 0',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: '#242424',
                  fontFamily: "ui-monospace, monospace",
                  fontSize: '12px',
                  color: '#F5A623',
                  wordBreak: 'break-all',
                }}>
                  {secret}
                </p>
              </details>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{
                fontSize: '14px',
                color: '#A89880',
                fontFamily: "'Inter', sans-serif",
              }}>
                Enter the 6-digit code from your app:
              </label>
              <input
                type="text"
                maxLength={6}
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid #2E2E2E',
                  backgroundColor: '#242424',
                  color: '#F5F0E8',
                  fontSize: '24px',
                  fontFamily: "ui-monospace, monospace",
                  textAlign: 'center',
                  letterSpacing: '8px',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#F5A623';
                  e.target.style.boxShadow = '0 0 0 2px rgba(245, 166, 35, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#2E2E2E';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                onClick={handleVerify}
                disabled={loading || token.length !== 6}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#F5A623',
                  color: '#0D0D0D',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: loading || token.length !== 6 ? 'not-allowed' : 'pointer',
                  opacity: loading || token.length !== 6 ? 0.6 : 1,
                  fontFamily: "'Inter', sans-serif",
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!loading && token.length === 6) {
                    e.target.style.backgroundColor = '#E09415';
                    e.target.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#F5A623';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                {loading ? 'Verifying...' : 'Verify & Enable MFA'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Done */}
        {step === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'rgba(76, 175, 125, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <span style={{ fontSize: '40px' }}>🛡️</span>
            </div>
            <h2 style={{
              fontSize: '22px',
              fontWeight: 700,
              margin: '0 0 12px 0',
              fontFamily: "'DM Serif Display', serif",
              color: '#4CAF7D',
            }}>
              MFA Enabled!
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#A89880',
              margin: '0 0 24px 0',
              fontFamily: "'Inter', sans-serif",
              lineHeight: 1.5,
            }}>
              Your account is now protected with multi-factor authentication.
              You'll need your authenticator app every time you sign in.
            </p>
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: '#242424',
              border: '1px solid #2E2E2E',
              marginBottom: '24px',
              textAlign: 'left',
            }}>
              <p style={{
                margin: '0 0 8px 0',
                fontSize: '14px',
                fontWeight: 600,
                color: '#F5F0E8',
                fontFamily: "'Inter', sans-serif",
              }}>
                🔒 Security note:
              </p>
              <p style={{
                margin: 0,
                fontSize: '13px',
                color: '#A89880',
                fontFamily: "'Inter', sans-serif",
                lineHeight: 1.5,
              }}>
                This protects your account even if your password is stolen — exactly the vulnerability exploited in the Chase and CIBC phishing attacks analysed in your portfolio.
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#F5A623',
                color: '#0D0D0D',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#E09415';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#F5A623';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
