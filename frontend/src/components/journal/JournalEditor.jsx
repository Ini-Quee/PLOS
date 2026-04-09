import { useState } from 'react';
import api from '../../lib/api';

export default function JournalEditor({ journal, onClose }) {
  const [text, setText] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!text) return;

    try {
      await api.post('/journal', {
        content: text,
        plaintextForAnalysis: text,
      });

      setSaved(true);

      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
      <div className="bg-white text-black w-[500px] p-6 rounded-lg">
        <div className="flex justify-between mb-4">
          <h2>{journal.name}</h2>
          <button onClick={onClose}>✕</button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write here..."
          className="w-full h-40 border p-2"
        />

        <div className="flex justify-between mt-4">
          <span>{text.split(' ').filter(Boolean).length} words</span>

          <button
            onClick={handleSave}
            className="bg-teal-500 text-white px-4 py-2 rounded"
          >
            Save
          </button>
        </div>

        {saved && (
          <p className="text-green-600 mt-2">Saved ✔</p>
        )}
      </div>
    </div>
  );
}