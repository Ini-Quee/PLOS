import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import { encryptText } from '../lib/encryption';
import VoiceRecorder from '../components/VoiceRecorder';

export default function Journal() {
  const navigate = useNavigate();
  const { encryptionPassword } = useAuth();

  const [transcript, setTranscript] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [mode, setMode] = useState('voice'); // 'voice' or 'text'

  function handleVoiceTranscript(text) {
    setTranscript((prev) => {
      const combined = prev ? `${prev} ${text}` : text;
      return combined.trim();
    });
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccess(false);
    setAnalysis(null);

    try {
      if (!transcript.trim()) {
        throw new Error('Please add a journal entry first.');
      }

      if (!encryptionPassword) {
        throw new Error('Session expired. Please log out and log in again.');
      }

      console.log('=== SAVING JOURNAL ENTRY ===');
      console.log('Transcript length:', transcript.length);

      // Encrypt the transcript
      const encrypted = await encryptText(transcript, encryptionPassword);
      
      // Calculate word and character counts
      const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
      const characterCount = transcript.length;

      console.log('Word count:', wordCount);
      console.log('Character count:', characterCount);
      console.log('Encrypted successfully');

      // Save to backend with plaintext for AI analysis
      const response = await api.post('/journal', {
        encryptedContent: encrypted.ciphertext,
        encryptionIv: encrypted.iv,
        encryptionSalt: encrypted.salt,
        wordCount,
        characterCount,
        durationSeconds: 0,
        recordedAt: new Date().toISOString(),
        plaintextForAnalysis: transcript, // Send plaintext for AI
      });

      console.log('=== FULL RESPONSE ===');
      console.log(JSON.stringify(response.data, null, 2));

      console.log('=== ANALYSIS FROM API ===');
      console.log(JSON.stringify(response.data.analysis, null, 2));

      setSuccess(true);

      // Set analysis if it exists
      if (response.data.analysis) {
        console.log('Setting analysis state with:', response.data.analysis);
        setAnalysis(response.data.analysis);
      } else {
        console.log('No analysis in response');
        setAnalysis(null);
      }

      // Clear transcript after successful save
      setTranscript('');

    } catch (err) {
      console.error('=== SAVE ERROR ===');
      console.error(err);
      setError(
        err.response?.data?.error ||
          err.message ||
          'Failed to save. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  const hasVisibleAnalysis =
    analysis &&
    (
      (analysis.mood && analysis.mood !== 'neutral') ||
      (analysis.summary && analysis.summary !== '') ||
      (analysis.tasks && analysis.tasks.length > 0) ||
      (analysis.meetings && analysis.meetings.length > 0) ||
      (analysis.goals && analysis.goals.length > 0) ||
      (analysis.emotions && analysis.emotions.length > 0) ||
      (analysis.key_themes && analysis.key_themes.length > 0) ||
      (analysis.people && analysis.people.length > 0) ||
      (analysis.places && analysis.places.length > 0)
    );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-slate-400 hover:text-white"
          >
            ← Dashboard
          </button>
          <h1 className="text-xl font-bold text-teal-400">Journal</h1>
          <button
            onClick={() => navigate('/journal/history')}
            className="text-sm text-slate-400 hover:text-white"
          >
            History →
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        {/* Mode Toggle */}
        <div className="flex gap-1 rounded-xl border border-slate-800 bg-slate-900 p-1">
          <button
            onClick={() => setMode('voice')}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              mode === 'voice'
                ? 'bg-teal-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🎙️ Voice
          </button>
          <button
            onClick={() => setMode('text')}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              mode === 'text'
                ? 'bg-teal-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ✏️ Type
          </button>
        </div>

        {/* Main Entry Area */}
        <div className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          {/* Voice Recorder */}
          {mode === 'voice' && (
            <VoiceRecorder onTranscriptReady={handleVoiceTranscript} />
          )}

          {/* Transcript/Text Editor */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                {mode === 'voice'
                  ? 'Your voice transcript appears here — you can edit it'
                  : 'Write your thoughts'}
              </p>
              <p className="text-xs text-slate-500">
                {transcript.trim()
                  ? `${transcript.trim().split(/\s+/).filter(Boolean).length} words`
                  : '0 words'}
              </p>
            </div>

            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={
                mode === 'voice'
                  ? 'Speak above and your words will appear here...'
                  : 'Write your thoughts here...'
              }
              rows={8}
              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-600 outline-none focus:border-teal-500"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 px-4 py-3 text-sm text-teal-300">
              ✓ Entry saved and encrypted. AI analysis complete.
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving || !transcript.trim()}
            className="w-full rounded-xl bg-teal-500 py-3 font-semibold text-slate-950 transition-all hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Save Entry'}
          </button>

          {/* Security Notice */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="text-xl">🔒</div>
              <div className="text-xs text-slate-400">
                <p className="font-medium text-white">Zero-Knowledge Encryption</p>
                <p className="mt-1">
                  Your entry is encrypted in your browser before being sent to the server.
                  Only you can decrypt and read your journal.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Analysis Section */}
        {analysis && (
          <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <span>✨</span>
              <span>AI Analysis</span>
            </h3>

            {/* Debug Dropdown (for development) */}
            <details className="rounded-lg bg-slate-800/50 p-3">
              <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-400">
                🔍 Debug: Raw Analysis Data
              </summary>
              <pre className="mt-2 max-h-64 overflow-auto rounded bg-slate-950 p-2 text-xs text-slate-400">
                {JSON.stringify(analysis, null, 2)}
              </pre>
            </details>

            {/* Show message if analysis exists but is empty */}
            {!hasVisibleAnalysis && (
              <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300">
                ℹ️ AI analysis completed but didn't extract specific insights from this entry.
                This can happen with very short entries or if the content is unclear.
                Check the debug dropdown above to see the raw data.
              </div>
            )}

            {/* Mood */}
            {analysis.mood && analysis.mood !== 'neutral' && (
              <div>
                <p className="mb-1 text-xs text-slate-500">Detected mood:</p>
                <span className="inline-block rounded-full bg-teal-900/40 px-3 py-1 text-sm capitalize text-teal-400">
                  {analysis.mood}
                </span>
              </div>
            )}

            {/* Emotions */}
            {analysis.emotions && analysis.emotions.length > 0 && (
              <div>
                <p className="mb-2 text-xs text-slate-500">Emotions detected:</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.emotions.map((emotion, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-purple-900/30 px-3 py-1 text-xs capitalize text-purple-400"
                    >
                      {emotion}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {analysis.summary && analysis.summary !== '' && (
              <div>
                <p className="mb-1 text-xs text-slate-500">Summary:</p>
                <p className="text-sm text-slate-300">{analysis.summary}</p>
              </div>
            )}

            {/* Key Themes */}
            {analysis.key_themes && analysis.key_themes.length > 0 && (
              <div>
                <p className="mb-2 text-xs text-slate-500">Key themes:</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.key_themes.map((theme, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-blue-900/30 px-3 py-1 text-xs text-blue-400"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tasks */}
            {analysis.tasks && analysis.tasks.length > 0 && (
              <div>
                <p className="mb-2 text-xs text-slate-500">Tasks detected:</p>
                <ul className="space-y-1">
                  {analysis.tasks.map((task, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-slate-300"
                    >
                      <span className="mt-0.5 text-teal-400">✓</span>
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Meetings */}
            {analysis.meetings && analysis.meetings.length > 0 && (
              <div>
                <p className="mb-2 text-xs text-slate-500">Meetings detected:</p>
                <ul className="space-y-2">
                  {analysis.meetings.map((meeting, i) => (
                    <li
                      key={i}
                      className="rounded-lg bg-slate-800 px-3 py-2 text-sm"
                    >
                      <p className="font-medium text-white">
                        {meeting.title || 'Meeting'}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        When: {meeting.when || 'not specified'}
                        {meeting.with ? ` · With: ${meeting.with}` : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Goals */}
            {analysis.goals && analysis.goals.length > 0 && (
              <div>
                <p className="mb-2 text-xs text-slate-500">Goals mentioned:</p>
                <ul className="space-y-1">
                  {analysis.goals.map((goal, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-slate-300"
                    >
                      <span className="mt-0.5 text-amber-400">🎯</span>
                      <span>{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* People */}
            {analysis.people && analysis.people.length > 0 && (
              <div>
                <p className="mb-2 text-xs text-slate-500">People mentioned:</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.people.map((person, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-green-900/30 px-3 py-1 text-xs text-green-400"
                    >
                      👤 {person}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Places */}
            {analysis.places && analysis.places.length > 0 && (
              <div>
                <p className="mb-2 text-xs text-slate-500">Places mentioned:</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.places.map((place, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-orange-900/30 px-3 py-1 text-xs text-orange-400"
                    >
                      📍 {place}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}