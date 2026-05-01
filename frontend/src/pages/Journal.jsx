import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import { encryptText } from '../lib/encryption';
import { analyzeJournalEntryWithGemini } from '../lib/gemini';

import BookSpread from '../components/journal/BookSpread';
import ErrorBoundary from '../components/ErrorBoundary';
import LoadingSpinner from '../components/LoadingSpinner';

const JOURNAL_TYPES = {
  daily: { title: '📖 Daily Diary', mood: 'calm' },
  dreams: { title: '🌙 Dream Log', mood: 'thoughtful' },
  gratitude: { title: '🌿 Gratitude', mood: 'grateful' },
  ideas: { title: '💡 Ideas', mood: 'excited' },
  goals: { title: '🎯 Goals', mood: 'excited' },
};

export default function Journal() {
  const navigate = useNavigate();
  const { journalType } = useParams();
  const { encryptionPassword, user, loading: authLoading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [content, setContent] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState(null);

  const journalConfig = JOURNAL_TYPES[journalType] || { title: '📖 Journal', mood: 'calm' };

  // Initial page load - check auth and setup
  useEffect(() => {
    // Simulate loading state for components to initialize
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Handle auth errors
  useEffect(() => {
    if (!authLoading && !user) {
      setPageError('Please log in to access your journal');
      setPageLoading(false);
    }
  }, [authLoading, user]);

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

  // Show loading spinner while page initializes
  if (pageLoading || authLoading) {
    return <LoadingSpinner message="Opening your journal..." />;
  }

  // Show error if auth failed
  if (pageError) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#0D0D0D',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <h1
            style={{
              color: '#F5F0E8',
              fontSize: '20px',
              marginBottom: '16px',
            }}
          >
            {pageError}
          </h1>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#F5A623',
              border: 'none',
              borderRadius: '12px',
              color: '#0D0D0D',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Top navigation */}
        <nav
          style={{
            position: 'fixed',
            top: 20,
            left: 20,
            background: 'rgba(26, 26, 26, 0.9)',
            backdropFilter: 'blur(10px)',
            padding: '12px 24px',
            borderRadius: 12,
            border: '1px solid #2E2E2E',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#A89880',
              fontSize: 14,
              cursor: 'pointer',
              fontWeight: 500,
              fontFamily: "'Inter', sans-serif",
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.target.style.color = '#F5F0E8')}
            onMouseLeave={(e) => (e.target.style.color = '#A89880')}
          >
            ← Back
          </button>
          <span
            style={{
              color: '#F5F0E8',
              fontSize: 16,
              fontWeight: 600,
              fontFamily: "'DM Serif Display', serif",
            }}
          >
            {journalConfig.title}
          </span>
        </nav>

        <ErrorBoundary fallbackMessage="Journal failed to load">
          {!analysis ? (
            <BookSpread
              journalType={journalType || 'daily'}
              content={content}
              onContentChange={setContent}
              onSave={handleSave}
              isSaving={saving}
            />
          ) : (
            <div style={{ padding: '40px 20px' }}>
              <div
                style={{
                  maxWidth: 650,
                  margin: '0 auto',
                  background: '#1A1A1A',
                  border: '1px solid #2E2E2E',
                  padding: 40,
                  borderRadius: 20,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                }}
              >
                {/* Lumi Response Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 24,
                    paddingBottom: 24,
                    borderBottom: '1px solid #2E2E2E',
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(245, 166, 35, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 24px rgba(245, 166, 35, 0.25)',
                    }}
                  >
                    <span style={{ fontSize: 24 }}>✨</span>
                  </div>
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 20,
                        fontWeight: 700,
                        fontFamily: "'DM Serif Display', serif",
                        color: '#F5F0E8',
                      }}
                    >
                      Lumi
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        color: '#A89880',
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Your Journal Companion
                    </p>
                  </div>
                </div>

                <p
                  style={{
                    fontSize: 18,
                    lineHeight: 1.7,
                    marginBottom: 20,
                    color: '#F5F0E8',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {analysis.reaction || "I've read your entry. Here's what I noticed..."}
                </p>

                {analysis.question && (
                  <div
                    style={{
                      background: 'rgba(245, 166, 35, 0.08)',
                      padding: 20,
                      borderRadius: 12,
                      borderLeft: '4px solid #F5A623',
                      marginBottom: 24,
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 600,
                        color: '#F5A623',
                        fontFamily: "'DM Serif Display', serif",
                        fontStyle: 'italic',
                        fontSize: 16,
                      }}
                    >
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
                    background: '#F5A623',
                    color: '#0D0D0D',
                    border: 'none',
                    borderRadius: 12,
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif",
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#E09415';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#F5A623';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  Write Another Entry
                </button>
              </div>
            </div>
          )}
        </ErrorBoundary>

        {error && (
          <div
            style={{
              position: 'fixed',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(224, 82, 82, 0.1)',
              color: '#E05252',
              padding: '12px 24px',
              borderRadius: 12,
              border: '1px solid rgba(224, 82, 82, 0.3)',
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
              zIndex: 1000,
            }}
          >
            {error}
          </div>
        )}

        {(saving || analyzing) && (
          <div
            style={{
              position: 'fixed',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(26, 26, 26, 0.95)',
              color: '#F5F0E8',
              padding: '12px 24px',
              borderRadius: 12,
              border: '1px solid #2E2E2E',
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              zIndex: 1000,
            }}
          >
            <span style={{ fontSize: 16 }}>{analyzing ? '✨' : '💾'}</span>
            {analyzing ? 'Lumi is reading your entry...' : 'Saving...'}
          </div>
        )}
      </div>
    </>
  );
}
