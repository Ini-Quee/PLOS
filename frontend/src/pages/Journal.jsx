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
  const [mode, setMode] = useState('voice');

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

      const encrypted = await encryptText(transcript, encryptionPassword);
      const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
      const characterCount = transcript.length;

      const response = await api.post('/journal', {
        encryptedContent: encrypted.ciphertext,
        encryptionIv: encrypted.iv,
        encryptionSalt: encrypted.salt,
        wordCount,
        characterCount,
        durationSeconds: 0,
        recordedAt: new Date().toISOString(),
        plaintextForAnalysis: transcript,
      });

      console.log('=== RESPONSE RECEIVED ===');
      console.log('Analysis:', response.data.analysis);

      setSuccess(true);

      if (response.data.analysis) {
        setAnalysis(response.data.analysis);
      }

      setTranscript('');

    } catch (err) {
      console.error('=== SAVE ERROR ===', err);
      setError(
        err.response?.data?.error ||
          err.message ||
          'Failed to save. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
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

        {/* Entry Area */}
        <div className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          {mode === 'voice' && (
            <VoiceRecorder onTranscriptReady={handleVoiceTranscript} />
          )}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                {mode === 'voice'
                  ? 'Your voice transcript — you can edit it'
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

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 px-4 py-3 text-sm text-teal-300">
              ✓ Entry saved and encrypted
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !transcript.trim()}
            className="w-full rounded-xl bg-teal-500 py-3 font-semibold text-slate-950 transition-all hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Save Entry'}
          </button>

          <div className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="text-xl">🔒</div>
              <div className="text-xs text-slate-400">
                <p className="font-medium text-white">Zero-Knowledge Encryption</p>
                <p className="mt-1">
                  Your entry is encrypted in your browser. Only you can read it.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quackers Response */}
        {analysis && (
          <div className="space-y-4 rounded-2xl border border-teal-800 bg-gradient-to-br from-teal-950/50 to-slate-900 p-6">
            {/* Duck Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">🦆</div>
              <div>
                <h3 className="font-semibold text-white text-lg">Quackers</h3>
                <p className="text-xs text-teal-300">Your Journal Companion</p>
              </div>
            </div>

            {/* Reaction */}
            {analysis.reaction && (
              <div className="rounded-lg bg-slate-800/50 px-4 py-3">
                <p className="text-slate-200 leading-relaxed">{analysis.reaction}</p>
              </div>
            )}

            {/* Question */}
            {analysis.question && (
              <div className="rounded-lg bg-teal-900/20 border border-teal-800/50 px-4 py-3">
                <p className="text-teal-200 font-medium">{analysis.question}</p>
              </div>
            )}

            {/* Suggestions */}
            {analysis.suggestions && analysis.suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-slate-400 font-medium">What would help?</p>
                {analysis.suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    className="w-full group flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/70 px-4 py-3 text-left hover:border-teal-600 hover:bg-slate-800 transition-all"
                  >
                    <span className="text-xl group-hover:scale-110 transition-transform">
                      {suggestion.icon || '📅'}
                    </span>
                    <span className="text-sm text-slate-200 flex-1">
                      {suggestion.text}
                    </span>
                    <span className="text-teal-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      let's do it →
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Encouragement */}
            {analysis.encouragement && (
              <div className="rounded-lg border border-teal-800/50 bg-teal-950/30 px-4 py-3">
                <p className="text-teal-200 text-center font-medium">
                  {analysis.encouragement}
                </p>
              </div>
            )}

            {/* Detected Items (Collapsible Debug) */}
            {analysis.detected && (
              <details className="text-xs">
                <summary className="cursor-pointer text-slate-500 hover:text-slate-400">
                  🔍 What Quackers detected
                </summary>
                <div className="mt-3 space-y-2 rounded-lg bg-slate-950/50 p-3">
                  {analysis.detected.tasks && analysis.detected.tasks.length > 0 && (
                    <div>
                      <p className="text-slate-400 mb-1">Tasks:</p>
                      <p className="text-slate-300">{analysis.detected.tasks.join(', ')}</p>
                    </div>
                  )}
                  {analysis.detected.meetings && analysis.detected.meetings.length > 0 && (
                    <div>
                      <p className="text-slate-400 mb-1">Meetings:</p>
                      {analysis.detected.meetings.map((m, i) => (
                        <p key={i} className="text-slate-300">
                          {m.title || 'Meeting'} {m.when && `(${m.when})`} {m.with && `with ${m.with}`}
                        </p>
                      ))}
                    </div>
                  )}
                  {analysis.detected.emotions && analysis.detected.emotions.length > 0 && (
                    <div>
                      <p className="text-slate-400 mb-1">Emotions detected:</p>
                      <p className="text-slate-300">{analysis.detected.emotions.join(', ')}</p>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        )}
      </main>
    </div>
  );
}