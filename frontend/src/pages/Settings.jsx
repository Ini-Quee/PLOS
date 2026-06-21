import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import api from '../lib/api';
import { useToast } from '../hooks/useToast';
import * as lumiVoice from '../lib/lumi-voice';
import { SCENES } from '../lib/atmos';
import WallpaperPicker from '../components/WallpaperPicker';

/**
 * Settings Page — 8 sections per AGENTS.md Part 6.12
 * 1. Lumi's Voice
 * 2. Appearance
 * 3. Journal Style
 * 4. My Affirmations
 * 5. Account
 * 6. Security
 * 7. Email
 * 8. Notifications
 */
export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const oauthSuccess = searchParams.get('oauth_success');
  const oauthError   = searchParams.get('oauth_error');
  const upgraded     = searchParams.get('upgraded');

  // Show upgrade success toast once
  useEffect(() => {
    if (upgraded === 'true') {
      toast.success('🎉 Welcome to Pro! All features unlocked.');
    }
  }, []);

  // Settings state
  const [theme, setTheme] = useState(() => localStorage.getItem('plos_theme') || 'dark');

  // Lumi Voice settings
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceRate, setVoiceRate] = useState(0.95);
  const [voicePitch, setVoicePitch] = useState(1.05);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [availableVoices, setAvailableVoices] = useState([]);

  // Account
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [isEditingName, setIsEditingName] = useState(false);

  // Notifications
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notifPermission, setNotifPermission] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
  const [checkInTime, setCheckInTime] = useState('07:00');

  // Wallpaper
  const [showWallpaperPicker, setShowWallpaperPicker] = useState(false);
  const [currentWallpaperScene, setCurrentWallpaperScene] = useState('auto');
  const [motionIntensity, setMotionIntensity] = useState(() => {
    return localStorage.getItem('plos_wallpaper_intensity') || 'full';
  });

  const saveTimer = useRef(null);

  function saveToBackend(patch) {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      api.put('/users/settings', patch).catch(() => {});
    }, 600);
  }

  // Load voices and persisted settings on mount
  useEffect(() => {
    async function loadVoices() {
      await lumiVoice.loadVoices();
      const voices = lumiVoice.getAvailableVoices();
      setAvailableVoices(voices);
      const bestVoice = lumiVoice.getBestVoice();
      if (bestVoice) setSelectedVoice(bestVoice.name);
    }
    loadVoices();

    // Load persisted settings from backend
    api.get('/users/settings').then(res => {
      const s = res.data?.settings || {};
      if (s.voiceEnabled  !== undefined) setVoiceEnabled(s.voiceEnabled);
      if (s.voiceRate     !== undefined) setVoiceRate(s.voiceRate);
      if (s.voicePitch    !== undefined) setVoicePitch(s.voicePitch);
      if (s.selectedVoice !== undefined) setSelectedVoice(s.selectedVoice);
      if (s.checkInTime   !== undefined) setCheckInTime(s.checkInTime);
    }).catch(() => {});

    // Load wallpaper scene
    const savedScene = localStorage.getItem('plos_wallpaper_scene') || 'auto';
    setCurrentWallpaperScene(savedScene);
  }, []);

  // Apply theme and persist
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('plos_theme', theme);
  }, [theme]);

  // Persist voice settings to backend (debounced)
  useEffect(() => {
    saveToBackend({ voiceEnabled, voiceRate, voicePitch, selectedVoice });
  }, [voiceEnabled, voiceRate, voicePitch, selectedVoice]);


  // Persist motion intensity
  useEffect(() => {
    localStorage.setItem('plos_wallpaper_intensity', motionIntensity);
    window.dispatchEvent(new Event('atmos-scene-changed'));
  }, [motionIntensity]);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  // Test voice
  function testVoice() {
    if (voiceEnabled) {
      lumiVoice.speak('This is how Lumi sounds. Is this voice okay for you?', {
        rate: voiceRate,
        pitch: voicePitch,
        voiceName: selectedVoice,
      });
    }
  }

  // Save display name
  function saveDisplayName() {
    setIsEditingName(false);
    if (displayName.trim()) {
      api.put('/users/profile', { name: displayName.trim() }).catch(() => {});
    }
  }

  // Settings sections
  const sections = [
    { id: 'voice', title: "Lumi's Voice", icon: '🎙️' },
    { id: 'wallpaper', title: 'Wallpaper', icon: '🌍' },
    { id: 'appearance', title: 'Appearance', icon: '🎨' },
    { id: 'account', title: 'Account', icon: '👤' },
    { id: 'notifications', title: 'Notifications', icon: '🔔' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'transparent',
        color: '#F5F0E8',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
        {/* OAuth result banner */}
        {oauthSuccess === 'google' && (
          <div style={{ marginBottom:16, padding:'12px 16px', borderRadius:10, background:'rgba(0,212,170,0.1)', border:'1px solid rgba(0,212,170,0.3)', color:'#00d4aa', fontSize:13 }}>
            ✅ Google account connected successfully! Lumi can now send emails on your behalf.
          </div>
        )}
        {oauthError && (
          <div style={{ marginBottom:16, padding:'12px 16px', borderRadius:10, background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.3)', color:'#f87171', fontSize:13 }}>
            ⚠️ Google connection failed: {oauthError}
          </div>
        )}
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
              border: '1px solid #2E2E2E',
              borderRadius: '12px',
              color: '#A89880',
              fontSize: '14px',
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.target.style.color = '#F5F0E8';
              e.target.style.borderColor = '#C8955C';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = '#A89880';
              e.target.style.borderColor = '#2E2E2E';
            }}
          >
            ← Back to Dashboard
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#C8955C',
              border: 'none',
              borderRadius: '12px',
              color: '#0D0D0D',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#D4A06A';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#C8955C';
            }}
          >
            Sign Out
          </button>
        </div>

        <h1
          style={{
            margin: '0 0 32px 0',
            fontSize: '32px',
            fontWeight: 700,
            fontFamily: "'DM Serif Display', serif",
            color: '#F5F0E8',
          }}
        >
          Settings
        </h1>

        {/* Settings Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Section 1: Lumi's Voice */}
          <SettingsSection title="Lumi's Voice" icon="🎙️">
            {/* Voice toggle */}
            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={voiceEnabled}
                  onChange={(e) => setVoiceEnabled(e.target.checked)}
                  style={{ width: '20px', height: '20px', accentColor: '#C8955C' }}
                />
                <span
                  style={{
                    color: '#F5F0E8',
                    fontSize: '14px',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Enable Lumi's voice
                </span>
              </label>
              <p
                style={{
                  margin: '8px 0 0 32px',
                  color: '#6B5F52',
                  fontSize: '13px',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Lumi will speak responses aloud using your browser's built-in text-to-speech
              </p>
            </div>

            {/* Voice selector */}
            {voiceEnabled && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      color: '#A89880',
                      fontSize: '14px',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Voice
                  </label>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: 'rgba(12,12,24,0.40)',
                      border: '1px solid #2E2E2E',
                      borderRadius: '12px',
                      color: '#F5F0E8',
                      fontSize: '14px',
                      fontFamily: "'Inter', sans-serif",
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    {availableVoices.map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Speed slider */}
                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                      color: '#A89880',
                      fontSize: '14px',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    <span>Speed</span>
                    <span style={{ color: '#C8955C' }}>{voiceRate.toFixed(2)}x</span>
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={voiceRate}
                    onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: '#C8955C' }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '4px',
                      color: '#6B5F52',
                      fontSize: '12px',
                    }}
                  >
                    <span>Slow</span>
                    <span>Fast</span>
                  </div>
                </div>

                {/* Pitch slider */}
                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                      color: '#A89880',
                      fontSize: '14px',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    <span>Pitch</span>
                    <span style={{ color: '#C8955C' }}>{voicePitch.toFixed(2)}</span>
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={voicePitch}
                    onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: '#C8955C' }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '4px',
                      color: '#6B5F52',
                      fontSize: '12px',
                    }}
                  >
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>

                {/* Test button */}
                <button
                  onClick={testVoice}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'transparent',
                    border: '1px solid #C8955C',
                    borderRadius: '12px',
                    color: '#C8955C',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif",
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(200, 149, 92, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  🎧 Test Voice
                </button>
              </>
            )}
          </SettingsSection>

          {/* Section 2: Wallpaper */}
          <SettingsSection title="Wallpaper" icon="🌍">
            <p style={{ margin: '0 0 16px 0', color: '#A89880', fontSize: 14, lineHeight: 1.5 }}>
              Your wallpaper changes automatically based on time of day and season — like Windows. Choose a scene or let Lumi pick for you.
            </p>

            {/* Current scene */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, backgroundColor: 'rgba(12,12,24,0.40)', borderRadius: 12, border: '1px solid rgba(200,149,92,0.12)' }}>
                <div style={{
                  width: 80, height: 50, borderRadius: 8, flexShrink: 0,
                  backgroundImage: currentWallpaperScene === 'auto'
                    ? 'linear-gradient(135deg, #2C1810 0%, #C8955C 100%)'
                    : SCENES[currentWallpaperScene]?.photo
                      ? `url(${SCENES[currentWallpaperScene].photo.replace('1920', '400').replace('1080', '300')})`
                      : 'linear-gradient(135deg, #2C1810 0%, #C8955C 100%)',
                  backgroundSize: 'cover', backgroundPosition: 'center',
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, color: '#F5F0E8', fontWeight: 600, marginBottom: 2 }}>
                    {currentWallpaperScene === 'auto' ? 'Auto (Smart)' : SCENES[currentWallpaperScene]?.label || 'Custom'}
                  </div>
                  <div style={{ fontSize: 12, color: '#7A6450' }}>
                    {currentWallpaperScene === 'auto' ? 'Matches time & season automatically' : 'Photo wallpaper active'}
                  </div>
                </div>
                <button onClick={() => setShowWallpaperPicker(true)} style={{ padding: '10px 20px', backgroundColor: '#C8955C', border: 'none', borderRadius: 12, color: '#080503', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                  Change
                </button>
              </div>
            </div>

            {/* Motion intensity */}
            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#A89880', fontSize: 14 }}>
                <span>Weather Effects</span>
                <span style={{ color: '#C8955C', textTransform: 'capitalize' }}>{motionIntensity}</span>
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['minimal', 'reduced', 'full'].map(level => (
                  <button key={level} onClick={() => setMotionIntensity(level)} style={{
                    flex: 1, padding: '10px',
                    backgroundColor: motionIntensity === level ? '#C8955C' : 'rgba(20,12,6,0.6)',
                    border: 'none', borderRadius: 12,
                    color: motionIntensity === level ? '#080503' : '#EAE0D5',
                    fontSize: 13, cursor: 'pointer', fontWeight: motionIntensity === level ? 600 : 400,
                    textTransform: 'capitalize', transition: 'all 0.2s',
                  }}>
                    {level === 'minimal' ? 'Off' : level === 'reduced' ? 'Subtle' : 'Full'}
                  </button>
                ))}
              </div>
              <p style={{ margin: '6px 0 0', color: '#5E5048', fontSize: 12 }}>
                Full = rain drops, snow, petals, embers depending on scene
              </p>
            </div>
          </SettingsSection>

          {/* Section 3: Appearance */}
          <SettingsSection title="Appearance" icon="🎨">
            {/* Theme toggle */}
            <div>
              <label style={{ display: 'block', marginBottom: 12, color: '#A89880', fontSize: 14 }}>Theme</label>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setTheme('dark')} style={{
                  flex: 1, padding: 12,
                  backgroundColor: theme === 'dark' ? '#C8955C' : 'rgba(20,12,6,0.6)',
                  border: 'none', borderRadius: 12,
                  color: theme === 'dark' ? '#080503' : '#EAE0D5',
                  fontSize: 14, cursor: 'pointer', fontWeight: theme === 'dark' ? 600 : 400, transition: 'all 0.2s',
                }}>
                  Dark
                </button>
                <button onClick={() => setTheme('coloured')} style={{
                  flex: 1, padding: 12,
                  backgroundColor: theme === 'coloured' ? '#D4A06A' : 'rgba(20,12,6,0.6)',
                  border: 'none', borderRadius: 12,
                  color: theme === 'coloured' ? '#080503' : '#EAE0D5',
                  fontSize: 14, cursor: 'pointer', fontWeight: theme === 'coloured' ? 600 : 400, transition: 'all 0.2s',
                }}>
                  Coloured
                </button>
              </div>
            </div>
          </SettingsSection>

          {/* Section: Account */}
          <SettingsSection title="Account" icon="👤">
            {/* Display name */}
            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#A89880',
                  fontSize: '14px',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Display Name
              </label>
              {isEditingName ? (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: 'rgba(12,12,24,0.40)',
                      border: '1px solid #C8955C',
                      borderRadius: '12px',
                      color: '#F5F0E8',
                      fontSize: '14px',
                      fontFamily: "'Inter', sans-serif",
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={saveDisplayName}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#C8955C',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#0D0D0D',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: 'rgba(12,12,24,0.40)',
                    borderRadius: '12px',
                  }}
                >
                  <span
                    style={{
                      color: '#F5F0E8',
                      fontSize: '14px',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {displayName || 'Not set'}
                  </span>
                  <button
                    onClick={() => setIsEditingName(true)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: 'transparent',
                      border: '1px solid #2E2E2E',
                      borderRadius: '8px',
                      color: '#A89880',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            {/* Email */}
            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#A89880',
                  fontSize: '14px',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Email
              </label>
              <div
                style={{
                  padding: '12px',
                  backgroundColor: 'rgba(12,12,24,0.40)',
                  borderRadius: '12px',
                  color: '#6B5F52',
                  fontSize: '14px',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {user?.email || 'Not available'}
              </div>
            </div>

            {/* Change password */}
            <button
              style={{
                padding: '12px 24px',
                backgroundColor: 'transparent',
                border: '1px solid #C8955C',
                borderRadius: '12px',
                color: '#C8955C',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(200, 149, 92, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              Change Password
            </button>
          </SettingsSection>

          {/* Section: Notifications */}
          <SettingsSection title="Notifications" icon="🔔">
            {/* Push notifications toggle */}
            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  style={{ width: '20px', height: '20px', accentColor: '#C8955C' }}
                />
                <span
                  style={{
                    color: '#F5F0E8',
                    fontSize: '14px',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Enable push notifications
                </span>
              </label>
              <p
                style={{
                  margin: '8px 0 0 32px',
                  color: '#6B5F52',
                  fontSize: '13px',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Get reminded about your daily check-in and scheduled tasks
              </p>
            </div>

            {/* Daily check-in time */}
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '12px',
                  color: '#A89880',
                  fontSize: '14px',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Daily Check-in Time
              </label>
              <input
                type="time"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                style={{
                  padding: '12px',
                  backgroundColor: 'rgba(12,12,24,0.40)',
                  border: '1px solid #2E2E2E',
                  borderRadius: '12px',
                  color: '#F5F0E8',
                  fontSize: '14px',
                  fontFamily: "'Inter', sans-serif",
                  outline: 'none',
                }}
              />
              <p
                style={{
                  margin: '8px 0 0 0',
                  color: '#6B5F52',
                  fontSize: '13px',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Lumi will send you a notification at this time every day
              </p>
            </div>
          </SettingsSection>

          {/* Danger Zone */}
          <SettingsSection title="Danger Zone" icon="⚠️">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
              <div>
                <div style={{ fontSize: 14, color: '#F5F0E8', fontWeight: 600, marginBottom: 4 }}>Delete Account</div>
                <div style={{ fontSize: 12, color: '#A89880' }}>Permanently deletes all your data. This cannot be undone.</div>
              </div>
              <button
                onClick={async () => {
                  if (!window.confirm('Are you sure? This will permanently delete your account and all your data. This cannot be undone.')) return;
                  try {
                    await api.delete('/users/me');
                    await logout();
                    navigate('/login');
                  } catch { toast.error('Could not delete account. Please try again.'); }
                }}
                style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid rgba(248,113,113,0.4)', background: 'transparent', color: '#f87171', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
              >
                Delete →
              </button>
            </div>
          </SettingsSection>
        </div>
      </div>

      {/* Wallpaper Picker Modal */}
      <WallpaperPicker
        isOpen={showWallpaperPicker}
        onClose={() => {
          setShowWallpaperPicker(false);
          // Refresh current scene
          const savedScene = localStorage.getItem('plos_wallpaper_scene') || 'auto';
          setCurrentWallpaperScene(savedScene);
        }}
      />
    </div>
  );
}

/**
 * Settings Section Component
 * Reusable section wrapper with header
 */
function SettingsSection({ title, icon, children }) {
  return (
    <div
      style={{
        backgroundColor: 'rgba(20, 12, 6, 0.90)', backdropFilter: 'blur(22px) saturate(1.2)', WebkitBackdropFilter: 'blur(22px) saturate(1.2)',
        borderRadius: '16px',
        border: '1px solid rgba(200, 149, 92, 0.12)',
        padding: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(200, 149, 92, 0.06)',
        transition: 'box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 0 24px rgba(200, 149, 92, 0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <h2
        style={{
          margin: '0 0 20px 0',
          fontSize: '18px',
          fontWeight: 600,
          fontFamily: "'Inter', sans-serif",
          color: '#F5F0E8',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <span>{icon}</span>
        {title}
      </h2>
      <div
        style={{
          borderTop: '1px solid #2E2E2E',
          paddingTop: '20px',
        }}
      >
        {children}
      </div>
    </div>
  );
}
