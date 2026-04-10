import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import { encryptText } from '../lib/encryption';
import { analyzeJournalEntryWithGemini } from '../lib/gemini';
import LivingBackground from '../components/LivingBackground';
import JournalPage from '../components/JournalPage';

const JOURNAL_TITLES = {
  daily: '📖 Daily Diary',
  dreams: '🌙 Dream Log',
  gratitude: '🌿 Gratitude',
  ideas: '💡 Ideas',
  goals: '🎯 Goals',
};

export default function Journal() {
  const navigate = useNavigate();
  const { journalType } = useParams();
  const { encryptionPassword } = useAuth();
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState(null);

  const journalTitle = JOURNAL_TITLES[journalType] || '📖 Journal';

  async function handleSave(text, durationSeconds = 0) {
    if (!text.trim()) {
      setError('Please write something first!');
      return;
    }

    if (!encryptionPassword) {
      setError('Encryption password not available. Please log in again.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Step 1: Encrypt the content client-side
      const encrypted = await encryptText(text, encryptionPassword);
      const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

      // Step 2: Save encrypted entry to backend
      const response = await api.post('/journal', {
        encryptedContent: encrypted.ciphertext,
        encryptionIv: encrypted.iv,
        encryptionSalt: encrypted.salt,
        wordCount,
        characterCount: text.length,
        durationSeconds,
        recordedAt: new Date().toISOString(),
        journalType,
      });

      const entryId = response.data.entry.id;

      // Step 3: Analyze with Gemini (client-side, zero-knowledge)
      setAnalyzing(true);
      const aiAnalysis = await analyzeJournalEntryWithGemini(text);

      if (aiAnalysis) {
        // Step 4: Encrypt the analysis
        const encryptedAnalysis = await encryptText(
          JSON.stringify(aiAnalysis),
          encryptionPassword
        );

        // Step 5: Save analysis to backend
        await api.patch(`/journal/entries/${entryId}/analysis`, {
          aiMood: aiAnalysis.mood,
          aiSummary: aiAnalysis.summary,
          aiAnalysis: aiAnalysis,
          encryptedAnalysis: encryptedAnalysis.ciphertext,
          analysisIv: encryptedAnalysis.iv,
          analysisSalt: encryptedAnalysis.salt,
        });

        // Show analysis to user
        setAnalysis({
          reaction: aiAnalysis.summary || "I've read your entry.",
          question: aiAnalysis.commitments?.length > 0 
            ? `You mentioned: ${aiAnalysis.commitments[0]}` 
            : 'How are you feeling about this?',
        });
      } else {
        // AI analysis failed but entry is saved
        setError('Analysis unavailable. Your entry is saved.');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('Save error:', err);
      setError(err.response?.data?.error || 'Failed to save entry');
    } finally {
      setSaving(false);
      setAnalyzing(false);
    }
  }

  return (
    <>
      <LivingBackground />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Top navigation */}
        <nav style={{
          position: 'fixed',
          top: 20,
          left: 20,
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          padding: '12px 24px',
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: 14,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            ← Back
          </button>
          <span style={{ color: 'white', fontSize: 16, fontWeight: 600 }}>
            {journalTitle}
          </span>
        </nav>

        {!analysis ? (
          <JournalPage isWriting={true} onSave={handleSave} />
        ) : (
          <div style={{ padding: '40px 20px' }}>
            <div style={{
              maxWidth: 650,
              margin: '0 auto',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              padding: 40,
              borderRadius: 20,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <span style={{ fontSize: 48 }}>🦆</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Quackers</h3>
                  <p style={{ margin: 0, fontSize: 13, color: '#666' }}>Your Journal Companion</p>
                </div>
              </div>

              <p style={{ fontSize: 18, lineHeight: 1.7, marginBottom: 20 }}>
                {analysis.reaction || "I've read your entry. Here's what I noticed..."}
              </p>

              {analysis.question && (
                <div style={{
                  background: '#F0FDF4',
                  padding: 20,
                  borderRadius: 12,
                  borderLeft: '4px solid #10B981',
                  marginBottom: 24,
                }}>
                  <p style={{ margin: 0, fontWeight: 600, color: '#065F46' }}>
                    {analysis.question}
                  </p>
                </div>
              )}

              <button
                onClick={() => {
                  setAnalysis(null);
                  window.location.reload();
                }}
                style={{
                  width: '100%',
                  padding: 14,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 12,
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: 'pointer',
                }}
              >
                Write Another Entry
              </button>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            position: 'fixed',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#FEE2E2',
            color: '#991B1B',
            padding: '12px 24px',
            borderRadius: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}>
            {error}
          </div>
        )}

        {(saving || analyzing) && (
          <div style={{
            position: 'fixed',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 255, 255, 0.95)',
            color: '#333',
            padding: '12px 24px',
            borderRadius: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            fontWeight: 600,
          }}>
            {analyzing ? '🦆 PLOS is reading your entry...' : '💾 Saving...'}
          </div>
        )}
      </div>
    </>
  );
}
