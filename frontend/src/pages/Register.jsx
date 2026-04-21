import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field error when user types
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }

  function validateForm() {
    const errors = {};

    // Name validation
    if (!form.name.trim()) {
      errors.name = 'Name is required';
    } else if (form.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!form.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!form.password) {
      errors.password = 'Password is required';
    } else {
      if (form.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      }
      if (!/[A-Z]/.test(form.password)) {
        errors.password = errors.password || 'Password must contain at least one uppercase letter';
      }
      if (!/[a-z]/.test(form.password)) {
        errors.password = errors.password || 'Password must contain at least one lowercase letter';
      }
      if (!/[0-9]/.test(form.password)) {
        errors.password = errors.password || 'Password must contain at least one number';
      }
      if (!/[^A-Za-z0-9]/.test(form.password)) {
        errors.password = errors.password || 'Password must contain at least one special character';
      }
    }

    // Confirm password validation
    if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Validate all fields
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const responseData = await register(form.email, form.password, form.name);
      
      // Navigate to MFA setup with user data
      navigate('/mfa-setup', { 
        state: { 
          user: responseData.user,
          fromRegistration: true 
        } 
      });
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err.response?.data?.error || 'Registration failed. Please try again.';
      
      // Check for specific error types
      if (errorMessage.toLowerCase().includes('email')) {
        setFieldErrors((prev) => ({ ...prev, email: errorMessage }));
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }

  // Get password strength indicator
  function getPasswordStrength(password) {
    if (!password) return { strength: 0, label: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['#E05252', '#E05252', '#F5A623', '#4CAF7D', '#4CAF7D'];
    
    return { 
      strength, 
      label: labels[strength - 1] || '',
      color: colors[strength - 1] || '#6B5F52'
    };
  }

  const passwordStrength = getPasswordStrength(form.password);

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
            Create account
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#A89880',
            margin: 0,
            fontFamily: "'Inter', sans-serif",
          }}>
            Set up your PLOS account
          </p>
        </div>

        {/* General Error */}
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
          {/* Name Field */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              color: '#A89880',
              fontFamily: "'Inter', sans-serif",
            }}>
              Name
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: `1px solid ${fieldErrors.name ? '#E05252' : '#2E2E2E'}`,
                backgroundColor: '#242424',
                color: '#F5F0E8',
                fontSize: '14px',
                fontFamily: "'Inter', sans-serif",
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                opacity: loading ? 0.6 : 1,
              }}
              onFocus={(e) => {
                if (!fieldErrors.name) {
                  e.target.style.borderColor = '#F5A623';
                  e.target.style.boxShadow = '0 0 0 2px rgba(245, 166, 35, 0.2)';
                }
              }}
              onBlur={(e) => {
                e.target.style.borderColor = fieldErrors.name ? '#E05252' : '#2E2E2E';
                e.target.style.boxShadow = 'none';
              }}
            />
            {fieldErrors.name && (
              <p style={{
                margin: '4px 0 0 0',
                fontSize: '12px',
                color: '#E05252',
                fontFamily: "'Inter', sans-serif",
              }}>
                {fieldErrors.name}
              </p>
            )}
          </div>

          {/* Email Field */}
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
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: `1px solid ${fieldErrors.email ? '#E05252' : '#2E2E2E'}`,
                backgroundColor: '#242424',
                color: '#F5F0E8',
                fontSize: '14px',
                fontFamily: "'Inter', sans-serif",
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                opacity: loading ? 0.6 : 1,
              }}
              onFocus={(e) => {
                if (!fieldErrors.email) {
                  e.target.style.borderColor = '#F5A623';
                  e.target.style.boxShadow = '0 0 0 2px rgba(245, 166, 35, 0.2)';
                }
              }}
              onBlur={(e) => {
                e.target.style.borderColor = fieldErrors.email ? '#E05252' : '#2E2E2E';
                e.target.style.boxShadow = 'none';
              }}
            />
            {fieldErrors.email && (
              <p style={{
                margin: '4px 0 0 0',
                fontSize: '12px',
                color: '#E05252',
                fontFamily: "'Inter', sans-serif",
              }}>
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
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
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: `1px solid ${fieldErrors.password ? '#E05252' : '#2E2E2E'}`,
                backgroundColor: '#242424',
                color: '#F5F0E8',
                fontSize: '14px',
                fontFamily: "'Inter', sans-serif",
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                opacity: loading ? 0.6 : 1,
              }}
              onFocus={(e) => {
                if (!fieldErrors.password) {
                  e.target.style.borderColor = '#F5A623';
                  e.target.style.boxShadow = '0 0 0 2px rgba(245, 166, 35, 0.2)';
                }
              }}
              onBlur={(e) => {
                e.target.style.borderColor = fieldErrors.password ? '#E05252' : '#2E2E2E';
                e.target.style.boxShadow = 'none';
              }}
            />
            {fieldErrors.password && (
              <p style={{
                margin: '4px 0 0 0',
                fontSize: '12px',
                color: '#E05252',
                fontFamily: "'Inter', sans-serif",
              }}>
                {fieldErrors.password}
              </p>
            )}
            {/* Password strength indicator */}
            {form.password && (
              <div style={{ marginTop: '8px' }}>
                <div style={{
                  display: 'flex',
                  gap: '4px',
                  marginBottom: '4px',
                }}>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      style={{
                        flex: 1,
                        height: '4px',
                        backgroundColor: level <= passwordStrength.strength ? passwordStrength.color : '#2E2E2E',
                        borderRadius: '2px',
                        transition: 'background-color 0.2s',
                      }}
                    />
                  ))}
                </div>
                <p style={{
                  margin: 0,
                  fontSize: '12px',
                  color: passwordStrength.color,
                  fontFamily: "'Inter', sans-serif",
                }}>
                  {passwordStrength.label}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              color: '#A89880',
              fontFamily: "'Inter', sans-serif",
            }}>
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: `1px solid ${fieldErrors.confirmPassword ? '#E05252' : '#2E2E2E'}`,
                backgroundColor: '#242424',
                color: '#F5F0E8',
                fontSize: '14px',
                fontFamily: "'Inter', sans-serif",
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                opacity: loading ? 0.6 : 1,
              }}
              onFocus={(e) => {
                if (!fieldErrors.confirmPassword) {
                  e.target.style.borderColor = '#F5A623';
                  e.target.style.boxShadow = '0 0 0 2px rgba(245, 166, 35, 0.2)';
                }
              }}
              onBlur={(e) => {
                e.target.style.borderColor = fieldErrors.confirmPassword ? '#E05252' : '#2E2E2E';
                e.target.style.boxShadow = 'none';
              }}
            />
            {fieldErrors.confirmPassword && (
              <p style={{
                margin: '4px 0 0 0',
                fontSize: '12px',
                color: '#E05252',
                fontFamily: "'Inter', sans-serif",
              }}>
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          {/* Password Requirements Hint */}
          <div style={{
            padding: '12px',
            backgroundColor: '#242424',
            borderRadius: '8px',
          }}>
            <p style={{
              margin: '0 0 8px 0',
              fontSize: '12px',
              color: '#A89880',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
            }}>
              Password requirements:
            </p>
            <ul style={{
              margin: 0,
              paddingLeft: '16px',
              fontSize: '12px',
              color: '#6B5F52',
              fontFamily: "'Inter', sans-serif",
              lineHeight: '1.6',
            }}>
              <li style={{ color: form.password.length >= 8 ? '#4CAF7D' : '#6B5F52' }}>
                At least 8 characters
              </li>
              <li style={{ color: /[A-Z]/.test(form.password) ? '#4CAF7D' : '#6B5F52' }}>
                One uppercase letter
              </li>
              <li style={{ color: /[a-z]/.test(form.password) ? '#4CAF7D' : '#6B5F52' }}>
                One lowercase letter
              </li>
              <li style={{ color: /[0-9]/.test(form.password) ? '#4CAF7D' : '#6B5F52' }}>
                One number
              </li>
              <li style={{ color: /[^A-Za-z0-9]/.test(form.password) ? '#4CAF7D' : '#6B5F52' }}>
                One special character
              </li>
            </ul>
          </div>

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
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '14px',
          color: '#A89880',
          fontFamily: "'Inter', sans-serif",
        }}>
          Already have an account?{' '}
          <Link
            to="/login"
            style={{
              color: '#F5A623',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
