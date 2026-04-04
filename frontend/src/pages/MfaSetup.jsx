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
      await api.post('/auth/mfa/verify', { token });
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8">

        {/* Header */}
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 text-sm text-slate-400 hover:text-white"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold mb-1">Set Up MFA</h1>
        <p className="text-slate-400 text-sm mb-6">
          Protect your account with an authenticator app like Google Authenticator or Authy.
        </p>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Step 1 — Start */}
        {step === 'start' && (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-800 p-4 text-sm text-slate-300 space-y-2">
              <p>📱 <strong>Step 1:</strong> Install Google Authenticator or Authy on your phone</p>
              <p>📷 <strong>Step 2:</strong> Scan the QR code we generate</p>
              <p>🔢 <strong>Step 3:</strong> Enter the 6-digit code to confirm</p>
            </div>
            <button
              onClick={handleSetup}
              disabled={loading}
              className="w-full rounded-xl bg-teal-500 py-3 font-semibold text-slate-950 hover:bg-teal-400 disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate QR Code'}
            </button>
          </div>
        )}

        {/* Step 2 — Scan QR */}
        {step === 'scan' && (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-slate-400">Scan this QR code with your authenticator app:</p>
              <div className="rounded-xl bg-white p-3">
                <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
              </div>
              <details className="w-full">
                <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-300">
                  Can't scan? Enter code manually
                </summary>
                <p className="mt-2 rounded-lg bg-slate-800 px-3 py-2 font-mono text-xs text-teal-400 break-all">
                  {secret}
                </p>
              </details>
            </div>
            <div className="space-y-3">
              <label className="block text-sm text-slate-400">
                Enter the 6-digit code from your app:
              </label>
              <input
                type="text"
                maxLength={6}
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-center text-2xl font-mono tracking-widest text-white placeholder-slate-600 focus:border-teal-500 focus:outline-none"
              />
              <button
                onClick={handleVerify}
                disabled={loading || token.length !== 6}
                className="w-full rounded-xl bg-teal-500 py-3 font-semibold text-slate-950 hover:bg-teal-400 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify & Enable MFA'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Done */}
        {step === 'done' && (
          <div className="space-y-6 text-center">
            <div className="text-6xl">🛡️</div>
            <div>
              <h2 className="text-xl font-bold text-teal-400">MFA Enabled!</h2>
              <p className="mt-2 text-sm text-slate-400">
                Your account is now protected with multi-factor authentication.
                You'll need your authenticator app every time you sign in.
              </p>
            </div>
            <div className="rounded-xl bg-slate-800 p-4 text-left text-sm text-slate-300">
              <p className="font-semibold text-white mb-2">🔒 Security note:</p>
              <p>This protects your account even if your password is stolen — exactly the vulnerability exploited in the Chase and CIBC phishing attacks analysed in your portfolio.</p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full rounded-xl bg-teal-500 py-3 font-semibold text-slate-950 hover:bg-teal-400"
            >
              Back to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
}