import { useState, useEffect, useCallback } from 'react';
import VoiceRecorder from '../VoiceRecorder';
import './BookSpread.css';

/**
 * BookSpread — Open book journal interface
 * Two visible pages: left for date/mood, right for writing
 * Paper texture, warm cream color, book spine in center
 */
export default function BookSpread({
  date = new Date(),
  mood = null,
  content = '',
  onContentChange,
  onSave,
  onTranscriptReady,
  isSaving = false,
  journalType = 'daily',
}) {
  const [localContent, setLocalContent] = useState(content);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [fontFamily, setFontFamily] = useState('Caveat');
  const [fontSize, setFontSize] = useState('medium');
  const [penColor, setPenColor] = useState('#1A1A1A');
  const [componentError, setComponentError] = useState(null);
  const [isReady, setIsReady] = useState(false);

  // Sync with parent content
  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  // Mark component as ready after mount
  useEffect(() => {
    setIsReady(true);
  }, []);

  // Font options
  const fontOptions = [
    { value: 'Caveat', label: 'Handwriting' },
    { value: '"DM Serif Display", serif', label: 'Elegant' },
    { value: '"Courier Prime", monospace', label: 'Typewriter' },
    { value: 'Inter, sans-serif', label: 'Clean' },
  ];

  // Pen color options
  const penOptions = [
    { value: '#1A1A1A', label: 'Black', color: '#1A1A1A' },
    { value: '#1E3A5F', label: 'Navy', color: '#1E3A5F' },
    { value: '#8B0000', label: 'Deep Red', color: '#8B0000' },
    { value: '#2F4F2F', label: 'Forest Green', color: '#2F4F2F' },
    { value: '#B8860B', label: 'Amber', color: '#B8860B' },
    { value: '#4B0082', label: 'Purple', color: '#4B0082' },
  ];

  // Text size options
  const sizeOptions = [
    { value: 'small', label: 'Small', size: '16px' },
    { value: 'medium', label: 'Medium', size: '20px' },
    { value: 'large', label: 'Large', size: '24px' },
  ];

  // Format date for display
  const formatDate = useCallback((date) => {
    try {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const fullDate = date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      return { dayName, fullDate };
    } catch (err) {
      console.error('Date formatting error:', err);
      return { dayName: 'Today', fullDate: '' };
    }
  }, []);

  const { dayName, fullDate } = formatDate(date);

  // Mood emojis
  const moodEmojis = {
    happy: '😊',
    calm: '😌',
    excited: '🤩',
    grateful: '🙏',
    thoughtful: '🤔',
    tired: '😴',
    stressed: '😰',
    sad: '😢',
    angry: '😠',
  };

  // Handle voice transcript
  const handleTranscriptReady = useCallback((transcript, duration) => {
    try {
      const newContent = localContent
        ? localContent + ' ' + transcript
        : transcript;
      setLocalContent(newContent);
      setRecordingDuration(duration);
      if (onTranscriptReady) {
        onTranscriptReady(transcript, duration);
      }
      if (onContentChange) {
        onContentChange(newContent);
      }
    } catch (err) {
      console.error('Error handling transcript:', err);
      setComponentError('Failed to process voice input');
    }
  }, [localContent, onTranscriptReady, onContentChange]);

  // Handle text change
  const handleTextChange = useCallback((e) => {
    try {
      const newContent = e.target.value;
      setLocalContent(newContent);
      if (onContentChange) {
        onContentChange(newContent);
      }
    } catch (err) {
      console.error('Error handling text change:', err);
      setComponentError('Failed to update text');
    }
  }, [onContentChange]);

  // Handle save
  const handleSave = useCallback(() => {
    try {
      if (onSave && localContent.trim()) {
        onSave(localContent, recordingDuration);
      }
    } catch (err) {
      console.error('Error saving entry:', err);
      setComponentError('Failed to save entry');
    }
  }, [onSave, localContent, recordingDuration]);

  // Get current size
  const currentSize = sizeOptions.find((s) => s.value === fontSize)?.size || '20px';

  // Journal type labels
  const journalLabels = {
    daily: '📖 Daily Entry',
    dreams: '🌙 Dream Log',
    gratitude: '🌿 Gratitude',
    ideas: '💡 Ideas',
    goals: '🎯 Goals',
  };

  // Show error state if component failed
  if (componentError) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: '#1A1A1A',
            borderRadius: '16px',
            border: '1px solid #2E2E2E',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
          <h3
            style={{
              color: '#F5F0E8',
              fontSize: '18px',
              marginBottom: '8px',
            }}
          >
            Journal Error
          </h3>
          <p
            style={{
              color: '#6B5F52',
              fontSize: '14px',
              marginBottom: '16px',
            }}
          >
            {componentError}
          </p>
          <button
            onClick={() => setComponentError(null)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#F5A623',
              border: 'none',
              borderRadius: '12px',
              color: '#0D0D0D',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show loading state while component initializes
  if (!isReady) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            border: '3px solid rgba(245, 166, 35, 0.2)',
            borderTopColor: '#F5A623',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="book-spread-container">
      {/* Floating Toolbar */}
      <div className="journal-toolbar">
        {/* Font selector */}
        <select
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
          className="toolbar-select"
        >
          {fontOptions.map((font) => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>

        {/* Pen color */}
        <div className="toolbar-colors">
          {penOptions.map((pen) => (
            <button
              key={pen.value}
              onClick={() => setPenColor(pen.value)}
              className={`toolbar-color-btn ${penColor === pen.value ? 'active' : ''}`}
              style={{ backgroundColor: pen.color }}
              title={pen.label}
              aria-label={`Select ${pen.label} pen color`}
            />
          ))}
        </div>

        {/* Text size */}
        <select
          value={fontSize}
          onChange={(e) => setFontSize(e.target.value)}
          className="toolbar-select"
        >
          {sizeOptions.map((size) => (
            <option key={size.value} value={size.value}>
              {size.label}
            </option>
          ))}
        </select>
      </div>

      {/* Book Spread */}
      <div className="book-spread">
        {/* Left Page */}
        <div className="book-page left-page">
          {/* Paper texture overlay */}
          <div className="paper-texture" />

          {/* Date header */}
          <div className="page-header">
            <div className="day-name">{dayName}</div>
            <div className="full-date">{fullDate}</div>
            {mood && (
              <div className="mood-icon" title={`Feeling ${mood}`}>
                {moodEmojis[mood] || '✨'}
              </div>
            )}
          </div>

          {/* Journal type label */}
          <div className="journal-type-label">{journalLabels[journalType] || journalLabels.daily}</div>

          {/* Decorative elements */}
          <div className="page-decoration">
            <div className="decoration-line" />
          </div>
        </div>

        {/* Book Spine */}
        <div className="book-spine">
          <div className="spine-shadow" />
        </div>

        {/* Right Page */}
        <div className="book-page right-page">
          {/* Paper texture overlay */}
          <div className="paper-texture" />

          {/* Voice recorder */}
          <div className="voice-recorder-container">
            <VoiceRecorder onTranscriptReady={handleTranscriptReady} />
          </div>

          {/* Writing area */}
          <textarea
            value={localContent}
            onChange={handleTextChange}
            placeholder="What's on your mind today? Tap the microphone to speak your thoughts..."
            className="writing-area"
            style={{
              fontFamily,
              fontSize: currentSize,
              color: penColor,
            }}
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />

          {/* Word count */}
          <div className="word-count">
            {localContent.trim().split(/\s+/).filter(Boolean).length} words
          </div>
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={!localContent.trim() || isSaving}
        className={`save-entry-btn ${!localContent.trim() || isSaving ? 'disabled' : ''}`}
        aria-label="Save journal entry"
      >
        {isSaving ? '💾 Saving...' : '✨ Save Entry'}
      </button>
    </div>
  );
}
