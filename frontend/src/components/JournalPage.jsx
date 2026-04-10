import { useState } from 'react';
import VoiceRecorder from './VoiceRecorder';
import './JournalPage.css';

export default function JournalPage({ content, isUserWriting, onSave }) {
  const [text, setText] = useState(content || '');
  const [recordingDuration, setRecordingDuration] = useState(0);

  function handleTranscriptReady(transcript, duration) {
    setText((prev) => {
      const separator = prev.length > 0 ? ' ' : '';
      return prev + separator + transcript;
    });
    setRecordingDuration(duration);
  }

  return (
    <div className="journal-page">
      {/* Paper texture background */}
      <div className="paper-texture"></div>

      {/* Lined paper effect */}
      <div className="paper-lines"></div>

      {/* Content */}
      <div className="journal-content">
        {isUserWriting ? (
          <>
            {/* Voice Recorder */}
            <div style={{ marginBottom: '20px' }}>
              <VoiceRecorder onTranscriptReady={handleTranscriptReady} />
            </div>
            
            {/* Text Area */}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's on your mind today? Tap the microphone to record your thoughts..."
              className="handwritten-input"
              autoFocus
            />
          </>
        ) : (
          <div className="handwritten-text">
            {content}
          </div>
        )}
      </div>

      {/* Save button (only when writing) */}
      {isUserWriting && (
        <button onClick={() => onSave(text, recordingDuration)} className="save-btn">
          Save Entry 🦆
        </button>
      )}
    </div>
  );
}