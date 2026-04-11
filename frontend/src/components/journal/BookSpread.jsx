import { useState, useEffect } from 'react';
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

  // Sync with parent content
  useEffect(() => {
    setLocalContent(content);
  }, [content]);

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
  const formatDate = (date) => {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const fullDate = date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    return { dayName, fullDate };
  };

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
  const handleTranscriptReady = (transcript, duration) => {
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
  };

  // Handle text change
  const handleTextChange = (e) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    if (onContentChange) {
      onContentChange(newContent);
    }
  };

  // Handle save
  const handleSave = () => {
    if (onSave && localContent.trim()) {
      onSave(localContent, recordingDuration);
    }
  };

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
      >
        {isSaving ? '💾 Saving...' : '✨ Save Entry'}
      </button>
    </div>
  );
}
