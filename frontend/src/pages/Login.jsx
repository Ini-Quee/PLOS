import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
    mfaCode: '',
  });
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(
        form.email,
        form.password,
        requiresMfa ? form.mfaCode : undefined
      );

      if (result.requiresMfa) {
        setRequiresMfa(true);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(
        err.response?.data?.error || 'Login failed. Please try again.'
      );
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
        {/* Logo/Brand */}
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
            <span style={{ fontSize: '32px' }}>✨</span>
          </div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 700,
            margin: '0 0 8px 0',
            fontFamily: "'DM Serif Display', serif",
            color: '#F5F0E8',
          }}>
            PLOS
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#A89880',
            margin: 0,
            fontFamily: "'Inter', sans-serif",
          }}>
            Your daily life companion
          </p>
        </div>

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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              color: '#A89880',
              fontFamily: "'Inter', sans-serif",
            }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid #2E2E2E',
                backgroundColor: '#242424',
                color: '#F5F0E8',
                fontSize: '14px',
                fontFamily: "'Inter', sans-serif",
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
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              color: '#A89880',
              fontFamily: "'Inter', sans-serif",
            }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid #2E2E2E',
                backgroundColor: '#242424',
                color: '#F5F0E8',
                fontSize: '14px',
                fontFamily: "'Inter', sans-serif",
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
          </div>

          {requiresMfa && (
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                color: '#A89880',
                fontFamily: "'Inter', sans-serif",
              }}>
                MFA Code
              </label>
              <input
                type="text"
                name="mfaCode"
                value={form.mfaCode}
                onChange={handleChange}
                maxLength={6}
                required
                placeholder="000000"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid #2E2E2E',
                  backgroundColor: '#242424',
                  color: '#F5F0E8',
                  fontSize: '14px',
                  fontFamily: "'Inter', sans-serif",
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
            </div>
          )}

          <button
            type="submit"
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
              marginTop: '8px',
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
            {loading
              ? 'Signing in...'
              : requiresMfa
              ? 'Verify MFA'
              : 'Sign In'}
          </button>
        </form>

        <p style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '14px',
          color: '#A89880',
          fontFamily: "'Inter', sans-serif",
        }}>
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            style={{
              color: '#F5A623',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
