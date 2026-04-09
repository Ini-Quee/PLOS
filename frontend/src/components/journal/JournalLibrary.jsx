import { useState } from 'react';

export default function JournalLibrary() {
  const [activeJournal, setActiveJournal] = useState(null);

  const journals = [
    { name: 'Daily Diary', emoji: '📖' },
    { name: 'Dream Log', emoji: '🌙' },
    { name: 'Gratitude', emoji: '🌿' },
    { name: 'Ideas', emoji: '💡' },
    { name: 'Goals', emoji: '🎯' },
  ];

  return (
    <div className="min-h-screen text-white flex flex-col items-center justify-center">
      <h1 className="text-3xl mb-6">My Journals</h1>

      <div className="flex gap-6 flex-wrap justify-center">
        {journals.map((j, i) => (
          <div
            key={i}
            onClick={() => setActiveJournal(j)}
            className="cursor-pointer bg-slate-800 p-6 rounded-xl hover:scale-105 transition"
          >
            <div className="text-3xl">{j.emoji}</div>
            <p>{j.name}</p>
          </div>
        ))}
      </div>

      {activeJournal && (
        <JournalEditor
          journal={activeJournal}
          onClose={() => setActiveJournal(null)}
        />
      )}
    </div>
  );
}