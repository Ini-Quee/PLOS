import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import * as lumiVoice from '../lib/lumi-voice';

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

  // Settings state
  const [theme, setTheme] = useState('dark');
  const [livingBackground, setLivingBackground] = useState(false);
  const [backgroundTheme, setBackgroundTheme] = useState('cloud');

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

  // Affirmations
  const [affirmations, setAffirmations] = useState([
    'I am disciplined enough to build the life I want.',
    'I show up fully every single day.',
    'I am capable of more than I imagine.',
  ]);
  const [newAffirmation, setNewAffirmation] = useState('');

  // Account
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [isEditingName, setIsEditingName] = useState(false);

  // Notifications
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [checkInTime, setCheckInTime] = useState('07:00');

  // Load voices on mount
  useEffect(() => {
    async function loadVoices() {
      await lumiVoice.loadVoices();
      const voices = lumiVoice.getAvailableVoices();
      setAvailableVoices(voices);
      const bestVoice = lumiVoice.getBestVoice();
      if (bestVoice) {
        setSelectedVoice(bestVoice.name);
      }
    }
    loadVoices();
  }, []);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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

  // Add affirmation
  function addAffirmation() {
    if (newAffirmation.trim() && affirmations.length < 20) {
      setAffirmations([...affirmations, newAffirmation.trim()]);
      setNewAffirmation('');
    }
  }

  // Remove affirmation
  function removeAffirmation(index) {
    setAffirmations(affirmations.filter((_, i) => i !== index));
  }

  // Save display name
  function saveDisplayName() {
    setIsEditingName(false);
    // TODO: API call to update name
  }

  // Settings sections
  const sections = [
    { id: 'voice', title: "Lumi's Voice", icon: '🎙️' },
    { id: 'appearance', title: 'Appearance', icon: '🎨' },
    { id: 'journal', title: 'Journal Style', icon: '📖' },
    { id: 'affirmations', title: 'My Affirmations', icon: '✨' },
    { id: 'account', title: 'Account', icon: '👤' },
    { id: 'security', title: 'Security', icon: '🛡️' },
    { id: 'email', title: 'Email', icon: '📧' },
    { id: 'notifications', title: 'Notifications', icon: '🔔' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0D0D0D',
        color: '#F5F0E8',
        fontFamily: "'Inter', system-ui, sans-serif",
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
              e.target.style.borderColor = '#F5A623';
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
              backgroundColor: '#F5A623',
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
              e.target.style.backgroundColor = '#E09415';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#F5A623';
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
                  style={{ width: '20px', height: '20px', accentColor: '#F5A623' }}
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
                      backgroundColor: '#242424',
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
                    <span style={{ color: '#F5A623' }}>{voiceRate.toFixed(2)}x</span>
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={voiceRate}
                    onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: '#F5A623' }}
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
                    <span style={{ color: '#F5A623' }}>{voicePitch.toFixed(2)}</span>
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={voicePitch}
                    onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: '#F5A623' }}
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
                    border: '1px solid #F5A623',
                    borderRadius: '12px',
                    color: '#F5A623',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif",
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(245, 166, 35, 0.12)';
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

          {/* Section 2: Appearance */}
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
                    backgroundColor: theme === 'dark' ? '#F5A623' : '#242424',
                    border: 'none',
                    borderRadius: '12px',
                    color: theme === 'dark' ? '#0D0D0D' : '#F5F0E8',
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
                  onClick={() => setTheme('light')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: theme === 'light' ? '#F5A623' : '#242424',
                    border: 'none',
                    borderRadius: '12px',
                    color: theme === 'light' ? '#0D0D0D' : '#F5F0E8',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: theme === 'light' ? 600 : 400,
                    fontFamily: "'Inter', sans-serif",
                    transition: 'all 0.2s',
                  }}
                >
                  ☀️ Light
                </button>
              </div>
            </div>

            {/* LivingBackground toggle */}
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
                  style={{ width: '20px', height: '20px', accentColor: '#F5A623' }}
                />
                <span
                  style={{
                    color: '#F5F0E8',
                    fontSize: '14px',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Enable LivingBackground
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
                Animated environment in the background (requires refresh)
              </p>
            </div>

            {/* Background theme selector */}
            {livingBackground && (
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
                  Background Theme
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {[
                    { id: 'forest', label: '🌲 Forest', color: '#2D5A3D' },
                    { id: 'starfield', label: '✨ Starfield', color: '#1a1a2e' },
                    { id: 'warm-study', label: '🕯️ Warm Study', color: '#3d2817' },
                    { id: 'cloud', label: '☁️ Cloud', color: '#4a5568' },
                    { id: 'minimal', label: '⬜ Minimal', color: '#2E2E2E' },
                  ].map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setBackgroundTheme(theme.id)}
                      style={{
                        padding: '16px 12px',
                        backgroundColor:
                          backgroundTheme === theme.id ? '#F5A623' : '#242424',
                        border:
                          backgroundTheme === theme.id
                            ? '2px solid #F5A623'
                            : '1px solid #2E2E2E',
                        borderRadius: '12px',
                        color: backgroundTheme === theme.id ? '#0D0D0D' : '#F5F0E8',
                        fontSize: '13px',
                        cursor: 'pointer',
                        fontWeight: backgroundTheme === theme.id ? 600 : 400,
                        fontFamily: "'Inter', sans-serif",
                        transition: 'all 0.2s',
                      }}
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>
              </div>
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
                      backgroundColor: journalFont === font.value ? '#F5A623' : '#242424',
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
                        journalPenColor === color.value ? '1px solid #F5A623' : '1px solid #2E2E2E',
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
                      backgroundColor: journalPaperStyle === style.value ? '#F5A623' : '#242424',
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

          {/* Section 4: My Affirmations */}
          <SettingsSection title="My Affirmations" icon="✨">
            <p
              style={{
                margin: '0 0 16px 0',
                color: '#A89880',
                fontSize: '14px',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Lumi reads these to you during morning check-ins. Keep them positive and personal.
            </p>

            {/* Add new affirmation */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="text"
                  value={newAffirmation}
                  onChange={(e) => setNewAffirmation(e.target.value)}
                  placeholder="Add a new affirmation..."
                  maxLength={200}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#242424',
                    border: '1px solid #2E2E2E',
                    borderRadius: '12px',
                    color: '#F5F0E8',
                    fontSize: '14px',
                    fontFamily: "'Inter', sans-serif",
                    outline: 'none',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addAffirmation();
                  }}
                />
                <button
                  onClick={addAffirmation}
                  disabled={!newAffirmation.trim() || affirmations.length >= 20}
                  style={{
                    padding: '12px 20px',
                    backgroundColor:
                      !newAffirmation.trim() || affirmations.length >= 20
                        ? '#2E2E2E'
                        : '#F5A623',
                    border: 'none',
                    borderRadius: '12px',
                    color:
                      !newAffirmation.trim() || affirmations.length >= 20
                        ? '#6B5F52'
                        : '#0D0D0D',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor:
                      !newAffirmation.trim() || affirmations.length >= 20
                        ? 'not-allowed'
                        : 'pointer',
                    fontFamily: "'Inter', sans-serif",
                    transition: 'all 0.2s',
                  }}
                >
                  Add
                </button>
              </div>
              <p
                style={{
                  margin: '8px 0 0 0',
                  color: '#6B5F52',
                  fontSize: '12px',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {affirmations.length}/20 affirmations
              </p>
            </div>

            {/* Affirmations list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {affirmations.map((affirmation, index) => (
                <div
                  key={index}
                  style={{
                    padding: '16px',
                    backgroundColor: 'rgba(245, 166, 35, 0.08)',
                    borderRadius: '12px',
                    borderLeft: '4px solid #F5A623',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      color: '#F5F0E8',
                      fontSize: '15px',
                      fontFamily: "'DM Serif Display', serif",
                      fontStyle: 'italic',
                      lineHeight: 1.5,
                    }}
                  >
                    "{affirmation}"
                  </p>
                  <button
                    onClick={() => removeAffirmation(index)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: 'transparent',
                      border: '1px solid #2E2E2E',
                      borderRadius: '8px',
                      color: '#6B5F52',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontFamily: "'Inter', sans-serif",
                      transition: 'all 0.2s',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.color = '#E05252';
                      e.target.style.borderColor = '#E05252';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = '#6B5F52';
                      e.target.style.borderColor = '#2E2E2E';
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {affirmations.length === 0 && (
              <div
                style={{
                  padding: '40px',
                  textAlign: 'center',
                  backgroundColor: '#242424',
                  borderRadius: '12px',
                  border: '1px dashed #2E2E2E',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: '#6B5F52',
                    fontSize: '14px',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  No affirmations yet. Add one above to get started.
                </p>
              </div>
            )}
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
                      backgroundColor: '#242424',
                      border: '1px solid #F5A623',
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
                      backgroundColor: '#F5A623',
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
                    backgroundColor: '#242424',
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
                  backgroundColor: '#242424',
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
                border: '1px solid #F5A623',
                borderRadius: '12px',
                color: '#F5A623',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(245, 166, 35, 0.12)';
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
                backgroundColor: '#242424',
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
                  border: '1px solid #F5A623',
                  borderRadius: '12px',
                  color: '#F5A623',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(245, 166, 35, 0.12)';
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
                  backgroundColor: '#242424',
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
                  backgroundColor: '#242424',
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
          <SettingsSection title="Email" icon="📧">
            <p
              style={{
                margin: '0 0 16px 0',
                color: '#A89880',
                fontSize: '14px',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Connect your Gmail to send emails directly from PLOS. Uses your own account —
              no third-party services.
            </p>

            <div
              style={{
                padding: '24px',
                backgroundColor: '#242424',
                borderRadius: '12px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(245, 166, 35, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <span style={{ fontSize: '24px' }}>🔒</span>
              </div>
              <p
                style={{
                  margin: '0 0 8px 0',
                  color: '#F5F0E8',
                  fontSize: '14px',
                  fontWeight: 500,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Gmail not connected
              </p>
              <p
                style={{
                  margin: '0 0 16px 0',
                  color: '#6B5F52',
                  fontSize: '13px',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Connect to enable email automation
              </p>
              <button
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  border: '1px solid #F5A623',
                  borderRadius: '12px',
                  color: '#F5A623',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(245, 166, 35, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                Connect Gmail
              </button>
            </div>
          </SettingsSection>

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
                  style={{ width: '20px', height: '20px', accentColor: '#F5A623' }}
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
                  backgroundColor: '#242424',
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
        </div>
      </div>
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
        backgroundColor: '#1A1A1A',
        borderRadius: '16px',
        border: '1px solid #2E2E2E',
        padding: '24px',
        transition: 'box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 0 24px rgba(245, 166, 35, 0.08)';
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
