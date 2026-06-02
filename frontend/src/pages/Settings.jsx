import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import api from '../lib/api';
import { useToast } from '../hooks/useToast';
import * as lumiVoice from '../lib/lumi-voice';
import { THEME_LIBRARY } from '../lib/livingBackgroundConfig';
import WallpaperPicker from '../components/WallpaperPicker';
import { getSceneById } from '../lib/wallpaperScenes';

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
  const [livingBackground, setLivingBackground] = useState(() => {
    return localStorage.getItem('plos_living_background') === 'true';
  });
  const [backgroundTheme, setBackgroundTheme] = useState(() => {
    return localStorage.getItem('plos_bg_theme') || 'auto';
  });
  const [motionIntensity, setMotionIntensity] = useState(() => {
    return localStorage.getItem('plos_bg_intensity') || 'full';
  });

  // Lumi Voice settings
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceRate, setVoiceRate] = useState(0.95);
  const [voicePitch, setVoicePitch] = useState(1.05);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [availableVoices, setAvailableVoices] = useState([]);

  // Journal settings
  const [journalFont, setJournalFont] = useState('Caveat');
  const [journalPenColor, setJournalPenColor] = useState('#1A1A1A');
  const [journalPaperStyle, setJournalPaperStyle] = useState('linen');


  // Account
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [isEditingName, setIsEditingName] = useState(false);

  // Notifications
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notifPermission, setNotifPermission] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
  const [checkInTime, setCheckInTime] = useState('07:00');

  // Cinematic Wallpaper
  const [showWallpaperPicker, setShowWallpaperPicker] = useState(false);
  const [currentWallpaperScene, setCurrentWallpaperScene] = useState('auto');

  // Custom background photo
  const [customPhotoInput, setCustomPhotoInput] = useState('');
  const [customPhotoActive, setCustomPhotoActive] = useState(() => {
    try { return !!JSON.parse(localStorage.getItem('plos_custom_scene') || 'null')?.photo; }
    catch { return false; }
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
      if (s.journalFont   !== undefined) setJournalFont(s.journalFont);
      if (s.journalPenColor !== undefined) setJournalPenColor(s.journalPenColor);
      if (s.journalPaperStyle !== undefined) setJournalPaperStyle(s.journalPaperStyle);
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


  // Persist journal style to backend (debounced)
  useEffect(() => {
    saveToBackend({ journalFont, journalPenColor, journalPaperStyle });
  }, [journalFont, journalPenColor, journalPaperStyle]);

  // Persist Living Background settings to localStorage
  useEffect(() => {
    localStorage.setItem('plos_living_background', livingBackground);
  }, [livingBackground]);

  useEffect(() => {
    localStorage.setItem('plos_bg_theme', backgroundTheme);
  }, [backgroundTheme]);

  useEffect(() => {
    localStorage.setItem('plos_bg_intensity', motionIntensity);
  }, [motionIntensity]);

  function applyCustomPhoto() {
    const url = customPhotoInput.trim();
    if (!url) return;
    localStorage.setItem('plos_custom_scene', JSON.stringify({ photo: url, fallback: 'linear-gradient(180deg, #080503 0%, #140C06 100%)' }));
    setCustomPhotoActive(true);
    setCustomPhotoInput('');
    window.dispatchEvent(new Event('atmos-scene-changed'));
  }

  function removeCustomPhoto() {
    localStorage.removeItem('plos_custom_scene');
    setCustomPhotoActive(false);
    window.dispatchEvent(new Event('atmos-scene-changed'));
  }

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

  // Get preview gradient for selected theme
  function getPreviewGradient(themeKey) {
    const themeConfig = THEME_LIBRARY[themeKey];
    if (!themeConfig || !themeConfig.override) {
      // Default auto theme - dawn gradient
      return 'linear-gradient(180deg, #1a0a2e 0%, #4a1942 30%, #FF6B35 70%, #FFB347 100%)';
    }

    if (themeConfig.override.sky_override) {
      return themeConfig.override.sky_override;
    }

    // Construct from sky colors if available
    const { sky_top, sky_mid, sky_horizon, sky_low } = themeConfig.override;
    if (sky_top && sky_mid) {
      return `linear-gradient(180deg, ${sky_top} 0%, ${sky_mid} 30%, ${sky_horizon || sky_mid} 70%, ${sky_low || sky_horizon || sky_mid} 100%)`;
    }

    // Fallback
    return 'linear-gradient(180deg, #1a0a2e 0%, #4a1942 30%, #FF6B35 70%, #FFB347 100%)';
  }

  // Settings sections
  const sections = [
    { id: 'voice', title: "Lumi's Voice", icon: '🎙️' },
    { id: 'appearance', title: 'Appearance', icon: '🎨' },
    { id: 'journal', title: 'Journal Style', icon: '📖' },
    { id: 'account', title: 'Account', icon: '👤' },
    { id: 'security', title: 'Security', icon: '🛡️' },
    { id: 'email', title: 'Email', icon: '📧' },
    { id: 'notifications', title: 'Notifications', icon: '🔔' },
    { id: 'integrations', title: 'Integrations', icon: '🔗' },
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
              e.target.style.borderColor = '#7A8B52';
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
              backgroundColor: '#7A8B52',
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
              e.target.style.backgroundColor = '#8FA060';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#7A8B52';
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
                  style={{ width: '20px', height: '20px', accentColor: '#7A8B52' }}
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
                    <span style={{ color: '#7A8B52' }}>{voiceRate.toFixed(2)}x</span>
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={voiceRate}
                    onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: '#7A8B52' }}
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
                    <span style={{ color: '#7A8B52' }}>{voicePitch.toFixed(2)}</span>
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={voicePitch}
                    onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: '#7A8B52' }}
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
                    border: '1px solid #7A8B52',
                    borderRadius: '12px',
                    color: '#7A8B52',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif",
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(122, 139, 82, 0.12)';
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

          {/* Section 2: My World (Cinematic Wallpaper) */}
          <SettingsSection title="My World" icon="🌍">
            <p
              style={{
                margin: '0 0 20px 0',
                color: '#A89880',
                fontSize: 14,
                fontFamily: "'Inter', sans-serif",
                lineHeight: 1.5
              }}
            >
              Choose a cinematic background that matches your mood and moment.
            </p>

            {/* Current scene thumbnail */}
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: 12,
                  color: '#A89880',
                  fontSize: 14,
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500
                }}
              >
                Currently Active World
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: 16,
                  backgroundColor: 'rgba(12,12,24,0.40)',
                  borderRadius: 12,
                  border: '1px solid #2E2E2E'
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 50,
                    borderRadius: 8,
                    backgroundImage: currentWallpaperScene === 'auto'
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : `url(https://picsum.photos/400/300?random=${getSceneById(currentWallpaperScene)?.photo_seed || 1})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    flexShrink: 0
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, color: '#F5F0E8', fontWeight: 600, marginBottom: 4 }}>
                    {currentWallpaperScene === 'auto' ? '🤖 Auto (Smart)' : `${getSceneById(currentWallpaperScene)?.emoji} ${getSceneById(currentWallpaperScene)?.label}`}
                  </div>
                  <div style={{ fontSize: 12, color: '#6B5F52' }}>
                    {currentWallpaperScene === 'auto' ? 'Matches time & season automatically' : getSceneById(currentWallpaperScene)?.description}
                  </div>
                </div>
                <button
                  onClick={() => setShowWallpaperPicker(true)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#7A8B52',
                    border: 'none',
                    borderRadius: 12,
                    color: '#0D0D0D',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif",
                    transition: 'all 0.2s',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => { e.target.style.backgroundColor = '#8FA060'; }}
                  onMouseLeave={(e) => { e.target.style.backgroundColor = '#7A8B52'; }}
                >
                  Change World
                </button>
              </div>
            </div>

            {/* Custom photo URL */}
            <div style={{ marginTop: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, color: '#A89880', fontSize: 14, fontFamily: "'Inter', sans-serif" }}>
                Custom Background Photo
              </label>
              {customPhotoActive ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'rgba(122,139,82,0.08)', border: '1px solid rgba(122,139,82,0.25)' }}>
                  <span style={{ fontSize: 13, color: '#EAE0D5', flex: 1 }}>Custom photo active</span>
                  <button onClick={removeCustomPhoto} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(224,82,82,0.4)', background: 'transparent', color: '#E05252', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Remove
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="url"
                    value={customPhotoInput}
                    onChange={e => setCustomPhotoInput(e.target.value)}
                    placeholder="Paste any photo URL…"
                    onKeyDown={e => { if (e.key === 'Enter') applyCustomPhoto(); }}
                    style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(122,139,82,0.2)', background: 'rgba(20,12,6,0.6)', color: '#EAE0D5', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                  />
                  <button onClick={applyCustomPhoto} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: '#7A8B52', color: '#080503', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Set
                  </button>
                </div>
              )}
              <p style={{ margin: '6px 0 0', color: '#5E5048', fontSize: 12, fontFamily: "'Inter', sans-serif" }}>
                Works with any image URL (Unsplash, your own photos, etc.)
              </p>
            </div>
          </SettingsSection>

          {/* Section 3: Appearance */}
          <SettingsSection title="Appearance" icon="🎨">
            {/* Theme toggle */}
            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '12px',
                  color: '#A89880',
                  fontSize: '14px',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Theme
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setTheme('dark')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: theme === 'dark' ? '#7A8B52' : '#1A100A',
                    border: 'none',
                    borderRadius: '12px',
                    color: theme === 'dark' ? '#080503' : '#EAE0D5',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: theme === 'dark' ? 600 : 400,
                    fontFamily: "'Inter', sans-serif",
                    transition: 'all 0.2s',
                  }}
                >
                  🌙 Dark
                </button>
                <button
                  onClick={() => setTheme('coloured')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: theme === 'coloured' ? '#D4A06A' : '#1A100A',
                    border: 'none',
                    borderRadius: '12px',
                    color: theme === 'coloured' ? '#080503' : '#EAE0D5',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: theme === 'coloured' ? 600 : 400,
                    fontFamily: "'Inter', sans-serif",
                    transition: 'all 0.2s',
                  }}
                >
                  🌿 Coloured
                </button>
              </div>
            </div>

            {/* Living Background toggle */}
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
                  checked={livingBackground}
                  onChange={(e) => setLivingBackground(e.target.checked)}
                  style={{ width: '20px', height: '20px', accentColor: '#7A8B52' }}
                />
                <span
                  style={{
                    color: '#F5F0E8',
                    fontSize: '14px',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Living Background
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
                Your background auto-adjusts with time and season
              </p>
            </div>

            {/* Living Background theme dropdown */}
            {livingBackground && (
              <>
                <div style={{ marginBottom: '24px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '12px',
                      color: '#A89880',
                      fontSize: '14px',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Theme
                  </label>
                  <select
                    value={backgroundTheme}
                    onChange={(e) => setBackgroundTheme(e.target.value)}
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
                    {Object.entries(THEME_LIBRARY).map(([key, theme]) => (
                      <option key={key} value={key}>
                        {theme.name} — {theme.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Motion Intensity slider */}
                <div style={{ marginBottom: '24px' }}>
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
                    <span>Motion Intensity</span>
                    <span style={{ color: '#7A8B52', textTransform: 'capitalize' }}>
                      {motionIntensity}
                    </span>
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    {['minimal', 'reduced', 'full'].map((level) => (
                      <button
                        key={level}
                        onClick={() => setMotionIntensity(level)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          backgroundColor: motionIntensity === level ? '#7A8B52' : '#242424',
                          border: 'none',
                          borderRadius: '12px',
                          color: motionIntensity === level ? '#0D0D0D' : '#F5F0E8',
                          fontSize: '13px',
                          cursor: 'pointer',
                          fontWeight: motionIntensity === level ? 600 : 400,
                          fontFamily: "'Inter', sans-serif",
                          textTransform: 'capitalize',
                          transition: 'all 0.2s',
                        }}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  <p
                    style={{
                      margin: '0',
                      color: '#6B5F52',
                      fontSize: '12px',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {motionIntensity === 'minimal' && 'Static gradient only — best for low-end devices'}
                    {motionIntensity === 'reduced' && 'Fewer particles — balanced performance'}
                    {motionIntensity === 'full' && 'All effects enabled — best visual experience'}
                  </p>
                </div>

                {/* Preview thumbnail */}
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
                    Preview
                  </label>
                  <div
                    style={{
                      width: '100%',
                      height: '80px',
                      borderRadius: '12px',
                      border: '1px solid #2E2E2E',
                      background: getPreviewGradient(backgroundTheme),
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'radial-gradient(circle at 50% 40%, transparent 0%, rgba(0,0,0,0.3) 100%)',
                        opacity: 0.4,
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </SettingsSection>

          {/* Section 3: Journal Style */}
          <SettingsSection title="Journal Style" icon="📖">
            {/* Default font */}
            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '12px',
                  color: '#A89880',
                  fontSize: '14px',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Default Font
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[
                  { value: 'Caveat', label: 'Handwriting', sample: 'The quick brown fox' },
                  { value: '"DM Serif Display"', label: 'Elegant', sample: 'The quick brown fox' },
                  { value: '"Courier Prime"', label: 'Typewriter', sample: 'The quick brown fox' },
                  { value: 'Inter', label: 'Clean', sample: 'The quick brown fox' },
                ].map((font) => (
                  <button
                    key={font.value}
                    onClick={() => setJournalFont(font.value)}
                    style={{
                      flex: '1 1 calc(50% - 4px)',
                      padding: '12px',
                      backgroundColor: journalFont === font.value ? '#7A8B52' : '#242424',
                      border: 'none',
                      borderRadius: '12px',
                      color: journalFont === font.value ? '#0D0D0D' : '#F5F0E8',
                      fontSize: '13px',
                      cursor: 'pointer',
                      fontWeight: journalFont === font.value ? 600 : 400,
                      fontFamily: font.value,
                      transition: 'all 0.2s',
                    }}
                  >
                    {font.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Default pen color */}
            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '12px',
                  color: '#A89880',
                  fontSize: '14px',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Default Pen Color
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {[
                  { value: '#1A1A1A', label: 'Black' },
                  { value: '#1E3A5F', label: 'Navy' },
                  { value: '#8B0000', label: 'Deep Red' },
                  { value: '#2F4F2F', label: 'Forest Green' },
                  { value: '#B8860B', label: 'Amber' },
                  { value: '#4B0082', label: 'Purple' },
                ].map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setJournalPenColor(color.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      backgroundColor:
                        journalPenColor === color.value ? 'rgba(245, 166, 35, 0.2)' : '#242424',
                      border:
                        journalPenColor === color.value ? '1px solid #7A8B52' : '1px solid #2E2E2E',
                      borderRadius: '12px',
                      color: '#F5F0E8',
                      fontSize: '13px',
                      cursor: 'pointer',
                      fontFamily: "'Inter', sans-serif",
                      transition: 'all 0.2s',
                    }}
                  >
                    <span
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: color.value,
                        border: '1px solid rgba(255,255,255,0.2)',
                      }}
                    />
                    {color.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Paper style */}
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
                Paper Style
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {[
                  { value: 'linen', label: 'Linen' },
                  { value: 'lined', label: 'Lined' },
                  { value: 'plain', label: 'Plain' },
                ].map((style) => (
                  <button
                    key={style.value}
                    onClick={() => setJournalPaperStyle(style.value)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: journalPaperStyle === style.value ? '#7A8B52' : '#242424',
                      border: 'none',
                      borderRadius: '12px',
                      color: journalPaperStyle === style.value ? '#0D0D0D' : '#F5F0E8',
                      fontSize: '14px',
                      cursor: 'pointer',
                      fontWeight: journalPaperStyle === style.value ? 600 : 400,
                      fontFamily: "'Inter', sans-serif",
                      transition: 'all 0.2s',
                    }}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>
          </SettingsSection>


          {/* Section 5: Account */}
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
                      border: '1px solid #7A8B52',
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
                      backgroundColor: '#7A8B52',
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
                border: '1px solid #7A8B52',
                borderRadius: '12px',
                color: '#7A8B52',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(122, 139, 82, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              Change Password
            </button>
          </SettingsSection>

          {/* Section 6: Security */}
          <SettingsSection title="Security" icon="🛡️">
            {/* MFA */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                backgroundColor: 'rgba(12,12,24,0.40)',
                borderRadius: '12px',
                marginBottom: '16px',
              }}
            >
              <div>
                <p
                  style={{
                    margin: '0 0 4px 0',
                    color: '#F5F0E8',
                    fontSize: '14px',
                    fontWeight: 500,
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Multi-Factor Authentication
                </p>
                <p
                  style={{
                    margin: 0,
                    color: '#A89880',
                    fontSize: '13px',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {user?.mfaEnabled ? '✅ Enabled' : '❌ Not enabled'}
                </p>
              </div>
              <button
                onClick={() => navigate('/mfa-setup')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: '1px solid #7A8B52',
                  borderRadius: '12px',
                  color: '#7A8B52',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(122, 139, 82, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                {user?.mfaEnabled ? 'Manage' : 'Set Up'}
              </button>
            </div>

            {/* Active sessions */}
            <div style={{ marginBottom: '16px' }}>
              <p
                style={{
                  margin: '0 0 12px 0',
                  color: '#A89880',
                  fontSize: '14px',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Active Sessions
              </p>
              <div
                style={{
                  padding: '12px',
                  backgroundColor: 'rgba(12,12,24,0.40)',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      color: '#F5F0E8',
                      fontSize: '14px',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Current Session
                  </p>
                  <p
                    style={{
                      margin: '4px 0 0 0',
                      color: '#6B5F52',
                      fontSize: '12px',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Started just now
                  </p>
                </div>
                <span
                  style={{
                    padding: '4px 12px',
                    backgroundColor: 'rgba(76, 175, 125, 0.2)',
                    borderRadius: '8px',
                    color: '#4CAF7D',
                    fontSize: '12px',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Active
                </span>
              </div>
            </div>

            {/* Recent login history */}
            <div>
              <p
                style={{
                  margin: '0 0 12px 0',
                  color: '#A89880',
                  fontSize: '14px',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Recent Login History
              </p>
              <div
                style={{
                  padding: '12px',
                  backgroundColor: 'rgba(12,12,24,0.40)',
                  borderRadius: '12px',
                  color: '#6B5F52',
                  fontSize: '13px',
                  fontFamily: "'Inter', sans-serif",
                  textAlign: 'center',
                }}
              >
                Login history available in security logs
              </div>
            </div>
          </SettingsSection>

          {/* Section 7: Email */}
          {/* Section 8: Notifications */}
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
                  style={{ width: '20px', height: '20px', accentColor: '#7A8B52' }}
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
        backgroundColor: 'rgba(8,8,18,0.32)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
        borderRadius: '16px',
        border: '1px solid #2E2E2E',
        padding: '24px',
        transition: 'box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 0 24px rgba(122, 139, 82, 0.08)';
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
