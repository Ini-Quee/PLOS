import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import LumiOrb from '../components/lumi/LumiOrb';
import * as lumiVoice from '../lib/lumi-voice';
import * as lumiListen from '../lib/lumi-listen';
import { sendToLumi } from '../lib/gemini';
import api from '../lib/api';
import LivingBackground from '../components/LivingBackground';

/**
 * TalkToLumi — Full-screen AI conversation interface
 * The primary interface for talking with Lumi using real Gemini AI
 */
export default function TalkToLumi() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // AI Name - user can customize this
  const [aiName] = useState(() => {
    return localStorage.getItem('lumi_name') || 'Lumi';
  });
  
  // Core state
  const [lumiState, setLumiState] = useState('idle'); // idle | listening | processing | speaking
  const [transcript, setTranscript] = useState('');
  const [lumiMessage, setLumiMessage] = useState('');
  const [tasks, setTasks] = useState([]);
  const [recentJournal, setRecentJournal] = useState('');
  const [hasGreeted, setHasGreeted] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [error, setError] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  
  // Conversation history for AI context
  const [conversationHistory, setConversationHistory] = useState(() => {
    try {
      const stored = sessionStorage.getItem('lumi_conversation');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  
  // UI state
  const [showHistory, setShowHistory] = useState(true);
  const chatContainerRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const recognitionActiveRef = useRef(false);
  const processingRef = useRef(false);

  // Initialize on mount
  useEffect(() => {
    lumiVoice.initLumiVoice();
    lumiListen.initLumiListen();
    
    // Fetch today's tasks
    fetchTodayTasks();
    
    // Fetch recent journal
    fetchRecentJournal();
    
    // Morning greeting after a short delay
    const greetingTimer = setTimeout(() => {
      if (!hasGreeted && conversationHistory.length === 0) {
        doMorningGreeting();
      }
    }, 1000);

    return () => {
      clearTimeout(greetingTimer);
      lumiVoice.stop();
      lumiListen.stopListening();
    };
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [conversationHistory, lumiMessage]);

  // Persist conversation to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('lumi_conversation', JSON.stringify(conversationHistory));
    } catch (e) {
      console.error('Failed to save conversation:', e);
    }
  }, [conversationHistory]);

  // Fetch today's tasks from API
  const fetchTodayTasks = async () => {
    try {
      const response = await api.get('/schedule/today');
      const schedules = response.data.schedules || [];
      setTasks(schedules.slice(0, 5)); // Get top 5 tasks
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setTasks([]);
    }
  };

  // Fetch recent journal entry
  const fetchRecentJournal = async () => {
    try {
      const response = await api.get('/journal/entries?limit=1');
      const entries = response.data.entries || [];
      if (entries.length > 0) {
        setRecentJournal(`Last entry on ${new Date(entries[0].recorded_at).toLocaleDateString()}`);
      }
    } catch (err) {
      console.error('Failed to fetch journal:', err);
      setRecentJournal('');
    }
  };

  // Morning greeting with AI
  const doMorningGreeting = async () => {
    if (isSpeakingRef.current || processingRef.current) return;

    const currentHour = new Date().getHours();
    let greetingType = 'Good morning';
    if (currentHour >= 12 && currentHour < 17) greetingType = 'Good afternoon';
    else if (currentHour >= 17) greetingType = 'Good evening';

    const greeting = `${greetingType} ${user?.name || 'there'}! I'm ${aiName}, your personal AI companion. I'm here to help you plan your day, stay on track with your habits, or just chat about whatever's on your mind. What's on your mind today?`;

    setLumiState('speaking');
    setLumiMessage(greeting);
    isSpeakingRef.current = true;

    try {
      if (!isMuted) {
        await lumiVoice.speakResponse(greeting, {
          onStart: () => setLumiState('speaking'),
          onEnd: () => {
            isSpeakingRef.current = false;
            setLumiState('idle');
            setHasGreeted(true);
          },
          onError: () => {
            isSpeakingRef.current = false;
            setLumiState('idle');
            setHasGreeted(true);
          },
        });
      } else {
        isSpeakingRef.current = false;
        setLumiState('idle');
        setHasGreeted(true);
      }
    } catch (err) {
      isSpeakingRef.current = false;
      setLumiState('idle');
      setHasGreeted(true);
    }
  };

  // Start listening with improved recording
  const startListening = useCallback(async () => {
    if (isSpeakingRef.current || recognitionActiveRef.current || processingRef.current) return;

    // Check if speech recognition is available
    if (!lumiListen.isSpeechRecognitionAvailable()) {
      setShowTextInput(true);
      setError('Voice input not available in this browser. Use text input below.');
      return;
    }

    setLumiState('listening');
    setTranscript('');
    setError('');
    recognitionActiveRef.current = true;

    try {
      await lumiListen.startListening(
        {
          onStart: () => {
            setLumiState('listening');
          },
          onResult: ({ fullText }) => {
            setTranscript(fullText);
          },
          onEnd: ({ transcript: finalTranscript }) => {
            recognitionActiveRef.current = false;
            if (finalTranscript.trim()) {
              handleUserMessage(finalTranscript.trim());
            } else {
              setLumiState('idle');
            }
          },
          onNoSpeech: () => {
            recognitionActiveRef.current = false;
            setLumiState('idle');
          },
          onMaxDurationReached: (finalTranscript) => {
            recognitionActiveRef.current = false;
            if (finalTranscript.trim()) {
              handleUserMessage(finalTranscript.trim());
            }
          },
        },
        { continuous: true }
      );
    } catch (err) {
      recognitionActiveRef.current = false;
      setLumiState('idle');
      setShowTextInput(true);
      setError(err.message || 'Could not start listening. Use text input.');
    }
  }, []);

  // Handle user message with REAL AI
  const handleUserMessage = async (message) => {
    if (processingRef.current) return;
    
    processingRef.current = true;
    setTranscript('');
    setLumiState('processing');
    setLumiMessage('');
    setError('');

    // Add user message to history immediately
    const userMessageObj = { role: 'user', content: message, timestamp: new Date().toISOString() };
    
    // Keep only last 18 messages (9 exchanges) for context
    setConversationHistory(prev => {
      const newHistory = [...prev.slice(-18), userMessageObj];
      return newHistory;
    });

    try {
      // Call REAL Gemini AI
      const currentTime = new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      });
      
      const aiResponse = await sendToLumi({
        userMessage: message,
        conversationHistory: conversationHistory.slice(-18),
        userName: user?.name || 'there',
        userRole: '',
        aiName: aiName,
        todaysPlan: tasks,
        recentJournal: recentJournal,
        currentTime: currentTime,
      });

      // Add AI response to history
      const aiMessageObj = { role: 'model', content: aiResponse, timestamp: new Date().toISOString() };
      setConversationHistory(prev => [...prev, aiMessageObj]);

      // Update current message and speak
      setLumiMessage(aiResponse);
      setLumiState('speaking');
      isSpeakingRef.current = true;

      if (!isMuted) {
        await lumiVoice.speakResponse(aiResponse, {
          onStart: () => setLumiState('speaking'),
          onEnd: () => {
            isSpeakingRef.current = false;
            processingRef.current = false;
            setLumiState('idle');
          },
          onError: () => {
            isSpeakingRef.current = false;
            processingRef.current = false;
            setLumiState('idle');
          },
        });
      } else {
        // If muted, just show text
        isSpeakingRef.current = false;
        processingRef.current = false;
        setLumiState('idle');
      }

    } catch (err) {
      console.error('AI response error:', err);
      const errorResponse = `Hey ${user?.name || 'there'}, I'm having a bit of trouble thinking right now. Could you try again?`;
      setLumiMessage(errorResponse);
      setLumiState('speaking');
      
      if (!isMuted) {
        await lumiVoice.speakResponse(errorResponse, {
          onEnd: () => {
            isSpeakingRef.current = false;
            processingRef.current = false;
            setLumiState('idle');
          },
        });
      } else {
        isSpeakingRef.current = false;
        processingRef.current = false;
        setLumiState('idle');
      }
    }
  };

  // Handle text input submission
  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim() || processingRef.current) return;

    const message = textInput.trim();
    setTextInput('');
    setShowTextInput(false);
    handleUserMessage(message);
  };

  // Stop everything
  const handleStop = () => {
    lumiVoice.stop();
    lumiListen.stopListening();
    isSpeakingRef.current = false;
    recognitionActiveRef.current = false;
    setLumiState('idle');
  };

  // Clear conversation
  const handleClearConversation = () => {
    if (window.confirm(`Start fresh with ${aiName}?`)) {
      setConversationHistory([]);
      sessionStorage.removeItem('lumi_conversation');
      setLumiMessage('');
    }
  };

  // Get status text based on state
  const getStatusText = () => {
    switch (lumiState) {
      case 'listening':
        return `🔴 Listening... tap to stop`;
      case 'processing':
        return `⏳ ${aiName} is thinking...`;
      case 'speaking':
        return `🔊 ${aiName} is speaking...`;
      default:
        return `Tap to talk to ${aiName}`;
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Background */}
      <LivingBackground />

      {/* Main content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'rgba(26, 26, 26, 0.9)',
              backdropFilter: 'blur(10px)',
              padding: '12px 24px',
              borderRadius: 12,
              border: '1px solid #2E2E2E',
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

          <div style={{ display: 'flex', gap: '12px' }}>
            {/* Mute button */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              style={{
                background: 'rgba(26, 26, 26, 0.9)',
                backdropFilter: 'blur(10px)',
                padding: '12px 16px',
                borderRadius: 12,
                border: '1px solid #2E2E2E',
                color: isMuted ? '#E05252' : '#A89880',
                fontSize: 14,
                cursor: 'pointer',
                fontWeight: 500,
                fontFamily: "'Inter', sans-serif",
              }}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>

            {/* Clear conversation button */}
            <button
              onClick={handleClearConversation}
              style={{
                background: 'rgba(26, 26, 26, 0.9)',
                backdropFilter: 'blur(10px)',
                padding: '12px 16px',
                borderRadius: 12,
                border: '1px solid #2E2E2E',
                color: '#A89880',
                fontSize: 14,
                cursor: 'pointer',
                fontWeight: 500,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Clear chat
            </button>

            {/* Toggle history */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              style={{
                background: 'rgba(26, 26, 26, 0.9)',
                backdropFilter: 'blur(10px)',
                padding: '12px 16px',
                borderRadius: 12,
                border: '1px solid #2E2E2E',
                color: showHistory ? '#F5A623' : '#A89880',
                fontSize: 14,
                cursor: 'pointer',
                fontWeight: 500,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {showHistory ? '📖' : '💬'}
            </button>
          </div>
        </div>

        {/* Main chat area */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '800px',
          margin: '0 auto',
          width: '100%',
        }}>
          {/* Conversation history */}
          {showHistory && conversationHistory.length > 0 && (
            <div
              ref={chatContainerRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                marginBottom: '20px',
                padding: '16px',
                background: 'rgba(26, 26, 26, 0.6)',
                borderRadius: 16,
                border: '1px solid #2E2E2E',
                maxHeight: '40vh',
              }}
            >
              {conversationHistory.slice(-10).map((msg, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: '16px',
                    display: 'flex',
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: msg.role === 'user' ? '#F5A623' : 'rgba(245, 166, 35, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: msg.role === 'user' ? '#0D0D0D' : '#F5A623',
                    flexShrink: 0,
                  }}>
                    {msg.role === 'user' ? (user?.name?.[0] || 'Y') : aiName[0]}
                  </div>

                  {/* Message bubble */}
                  <div style={{
                    maxWidth: '70%',
                    padding: '12px 16px',
                    borderRadius: 16,
                    background: msg.role === 'user' ? '#F5A623' : '#1C1C27',
                    color: msg.role === 'user' ? '#0D0D0D' : '#F5F0E8',
                    fontSize: 14,
                    fontFamily: "'Inter', sans-serif",
                    lineHeight: 1.5,
                  }}>
                    {msg.content}
                    <div style={{
                      marginTop: '4px',
                      fontSize: '10px',
                      opacity: 0.6,
                      textAlign: msg.role === 'user' ? 'right' : 'left',
                    }}>
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Current message from Lumi */}
          {lumiMessage && (
            <div
              style={{
                marginBottom: '20px',
                padding: '24px 32px',
                background: 'rgba(26, 26, 26, 0.9)',
                backdropFilter: 'blur(10px)',
                borderRadius: 16,
                border: '1px solid #2E2E2E',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontFamily: "'DM Serif Display', serif",
                  fontStyle: 'italic',
                  color: '#F5F0E8',
                  lineHeight: 1.6,
                }}
              >
                {lumiMessage}
              </p>
              {!isMuted && lumiState === 'speaking' && (
                <div style={{
                  marginTop: '12px',
                  fontSize: '12px',
                  color: '#6B5F52',
                }}>
                  🔊 Speaking...
                </div>
              )}
            </div>
          )}

          {/* User transcript while recording */}
          {transcript && lumiState === 'listening' && (
            <div
              style={{
                marginBottom: '20px',
                padding: '16px 24px',
                background: 'rgba(245, 166, 35, 0.08)',
                borderRadius: 12,
                borderLeft: '4px solid #F5A623',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 16,
                  color: '#F5F0E8',
                  fontFamily: "'Inter', sans-serif",
                  lineHeight: 1.5,
                }}
              >
                {transcript}
              </p>
            </div>
          )}
        </div>

        {/* Bottom control area */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '20px',
        }}>
          {/* Status text */}
          <div
            style={{
              marginBottom: '24px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: lumiState === 'listening' ? '#E05252' : '#A89880',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500,
              }}
            >
              {getStatusText()}
            </p>
          </div>

          {/* Lumi Orb / Recording button */}
          <div style={{ marginBottom: '24px' }}>
            <LumiOrb
              state={lumiState}
              size="xl"
              onClick={lumiState === 'idle' ? startListening : handleStop}
            />
          </div>

          {/* Text input fallback */}
          {(showTextInput || !lumiListen.isSpeechRecognitionAvailable()) && (
            <form
              onSubmit={handleTextSubmit}
              style={{
                width: '100%',
                maxWidth: 500,
                display: 'flex',
                gap: 12,
              }}
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type your message..."
                disabled={processingRef.current}
                style={{
                  flex: 1,
                  padding: '14px 18px',
                  backgroundColor: '#1A1A1A',
                  border: '1px solid #2E2E2E',
                  borderRadius: 12,
                  color: '#F5F0E8',
                  fontSize: 16,
                  fontFamily: "'Inter', sans-serif",
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  opacity: processingRef.current ? 0.6 : 1,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#F5A623';
                  e.target.style.boxShadow = '0 0 0 2px rgba(245, 166, 35, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#2E2E2E';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="submit"
                disabled={processingRef.current || !textInput.trim()}
                style={{
                  padding: '14px 24px',
                  backgroundColor: '#F5A623',
                  border: 'none',
                  borderRadius: 12,
                  color: '#0D0D0D',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: processingRef.current ? 'not-allowed' : 'pointer',
fontFamily: "'Inter', sans-serif",
                  transition: 'all 0.2s',
                  opacity: processingRef.current || !textInput.trim() ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!processingRef.current && textInput.trim()) {
                    e.target.style.backgroundColor = '#E09415';
                    e.target.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#F5A623';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Send
              </button>
            </form>
          )}

          {/* Toggle text input button */}
          {!showTextInput && lumiListen.isSpeechRecognitionAvailable() && (
            <button
              onClick={() => setShowTextInput(!showTextInput)}
              style={{
                marginTop: '16px',
                padding: '8px 16px',
                backgroundColor: 'transparent',
                border: '1px solid #2E2E2E',
                borderRadius: 8,
                color: '#6B5F52',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif ",
              }}
            >
              {showTextInput ? 'Hide text input' : 'Use text input instead'}
            </button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              position: 'fixed',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '12px 24px',
              background: 'rgba(224, 82, 82, 0.1)',
              border: '1px solid rgba(224, 82, 82, 0.3)',
              borderRadius: 12,
              color: '#E05252',
              fontSize: 14,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
