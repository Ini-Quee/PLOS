import { useState } from 'react';
import './JournalPage.css';

export default function JournalPage({ content, isUserWriting, onSave }) {
  const [text, setText] = useState(content || '');

  return (
    <div className="journal-page">
      {/* Paper texture background */}
      <div className="paper-texture"></div>
      
      {/* Lined paper effect */}
      <div className="paper-lines"></div>

      {/* Content */}
      <div className="journal-content">
        {isUserWriting ? (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's on your mind today?"
            className="handwritten-input"
            autoFocus
          />
        ) : (
          <div className="handwritten-text">
            {content}
          </div>
        )}
      </div>

      {/* Save button (only when writing) */}
      {isUserWriting && (
        <button onClick={() => onSave(text)} className="save-btn">
          Save Entry 🦆
        </button>
      )}
    </div>
  );
}