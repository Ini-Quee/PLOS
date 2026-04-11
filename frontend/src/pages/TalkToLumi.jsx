import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import LumiOrb from '../components/lumi/LumiOrb';
import * as lumiVoice from '../lib/lumi-voice';
import * as lumiListen from '../lib/lumi-listen';
import api from '../lib/api';
import LivingBackground from '../components/LivingBackground';

/**
 * TalkToLumi — Full-screen voice interface
 * The primary interface for talking with Lumi
 * User speaks, Lumi listens and responds with voice + text
 */
export default function TalkToLumi() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lumiState, setLumiState] = useState('idle'); // idle | listening | speaking
  const [transcript, setTranscript] = useState('');
  const [lumiMessage, setLumiMessage] = useState('');
  const [tasks, setTasks] = useState([]);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [error, setError] = useState('');

  // Refs for managing speech state
  const isSpeakingRef = useRef(false);
  const recognitionActiveRef = useRef(false);

  // Initialize on mount
  useEffect(() => {
    // Initialize voice and listen modules
    lumiVoice.initLumiVoice();
    lumiListen.initLumiListen();

    // Fetch today's tasks
    fetchTodayTasks();

    // Morning greeting after a short delay
    const greetingTimer = setTimeout(() => {
      if (!hasGreeted) {
        doMorningGreeting();
      }
    }, 1000);

    return () => {
      clearTimeout(greetingTimer);
      lumiVoice.stop();
      lumiListen.stopListening();
    };
  }, []);

  // Fetch today's tasks from API
  const fetchTodayTasks = async () => {
    try {
      // TODO: Replace with actual schedule API when built
      // For now, use placeholder tasks
      const today = new Date();
      const hour = today.getHours();

      const placeholderTasks = [
        { title: 'Workout', time: '6:30 AM', completed: false },
        { title: 'Meditate', time: '7:30 AM', completed: false },
        { title: 'Read 10 pages', time: '8:00 AM', completed: false },
        { title: 'Job applications', time: '9:00 AM', completed: false },
      ];

      // Filter tasks based on time of day
      const remainingTasks = placeholderTasks.filter((task) => {
        const taskHour = parseInt(task.time.split(':')[0]);
        const isAM = task.time.includes('AM');
        if (isAM) {
          return taskHour > hour || (taskHour === hour && today.getMinutes() < 30);
        }
        return false;
      });

      setTasks(remainingTasks.length > 0 ? remainingTasks : placeholderTasks);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  };

  // Morning greeting
  const doMorningGreeting = async () => {
    if (isSpeakingRef.current) return;

    const greeting = lumiVoice.generateMorningGreeting(user?.name || 'there', tasks);

    setLumiState('speaking');
    setLumiMessage(greeting);
    isSpeakingRef.current = true;

    try {
      await lumiVoice.speak(greeting, {
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
    } catch (err) {
      isSpeakingRef.current = false;
      setLumiState('idle');
      setHasGreeted(true);
    }
  };

  // Start listening
  const startListening = useCallback(async () => {
    if (isSpeakingRef.current || recognitionActiveRef.current) return;

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
          onResult: ({ final, interim, fullText }) => {
            setTranscript(fullText);
          },
          onEnd: ({ transcript: finalTranscript }) => {
            recognitionActiveRef.current = false;
            setLumiState('idle');

            if (finalTranscript.trim()) {
              handleUserMessage(finalTranscript.trim());
            }
          },
          onNoSpeech: () => {
            // No speech detected — go back to idle
            recognitionActiveRef.current = false;
            setLumiState('idle');
          },
        },
        { continuous: false }
      );
    } catch (err) {
      recognitionActiveRef.current = false;
      setLumiState('idle');
      setShowTextInput(true);
      setError(err.message || 'Could not start listening. Use text input.');
    }
  }, [tasks]);

  // Handle user message (from voice or text)
  const handleUserMessage = async (message) => {
    setTranscript(message);

    // Parse voice command
    const command = lumiListen.parseVoiceCommand(message);

    // Generate response based on command
    let response = '';

    switch (command.type) {
      case 'task_complete':
        response = lumiVoice.generateTaskCelebration(command.task);
        break;

      case 'task_skip':
        response = `Okay, skipping ${command.task}. No shame — adjust and move forward.`;
        break;

      case 'reminder':
        response = `Got it. I'll remind you: ${command.reminder}.`;
        break;

      case 'schedule_add':
        response = `Added ${command.event} to your schedule for ${command.datetime}.`;
        break;

      case 'query_next':
        if (tasks.length > 0) {
          const nextTask = tasks[0];
          response = `Next up: ${nextTask.title}${nextTask.time ? ` at ${nextTask.time}` : ''}. Ready?`;
        } else {
          response = "You've completed everything planned for today. What's next?";
        }
        break;

      case 'query_progress':
        response = `You've got ${tasks.length} things planned today. You're doing great.`;
        break;

      case 'open_journal':
        response = "Opening your journal. Let's capture what's on your mind.";
        setTimeout(() => navigate('/journal'), 2000);
        break;

      case 'read_affirmations':
        response = "Here's your daily affirmation: I am disciplined enough to build the life I want.";
        break;

      case 'suggest_book':
        response = "Based on your reading history, I suggest 'Atomic Habits' by James Clear. It's perfect for your current focus on building systems.";
        break;

      case 'emotion':
        response = `I hear that you're feeling ${command.emotion}. Want to talk about it in your journal?`;
        break;

      case 'message':
      default:
        response = generateConversationalResponse(message);
    }

    // Speak the response
    setLumiState('speaking');
    setLumiMessage(response);
    isSpeakingRef.current = true;

    try {
      await lumiVoice.speak(response, {
        onEnd: () => {
          isSpeakingRef.current = false;
          setLumiState('idle');
        },
        onError: () => {
          isSpeakingRef.current = false;
          setLumiState('idle');
        },
      });
    } catch (err) {
      isSpeakingRef.current = false;
      setLumiState('idle');
    }
  };

  // Generate conversational response for unhandled messages
  const generateConversationalResponse = (message) => {
    const responses = [
      "I hear you. Tell me more.",
      "Got it. What else is on your mind?",
      "Thanks for sharing. How can I help with that?",
      "I understand. What would you like to focus on next?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  // Handle text input submission
  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    const message = textInput.trim();
    setTextInput('');
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
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
        }}
      >
        {/* Back button */}
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            position: 'fixed',
            top: 20,
            left: 20,
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
            zIndex: 100,
          }}
          onMouseEnter={(e) => (e.target.style.color = '#F5F0E8')}
          onMouseLeave={(e) => (e.target.style.color = '#A89880')}
        >
          ← Back
        </button>

        {/* Lumi Orb */}
        <div style={{ marginBottom: 40 }}>
          <LumiOrb
            state={lumiState}
            size="xl"
            onClick={lumiState === 'idle' ? startListening : handleStop}
          />
        </div>

        {/* Status indicator */}
        <div
          style={{
            marginBottom: 32,
            textAlign: 'center',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: '#A89880',
              fontFamily: "'Inter', sans-serif",
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}
          >
            {lumiState === 'idle' && 'Tap Lumi to speak'}
            {lumiState === 'listening' && 'Listening...'}
            {lumiState === 'speaking' && 'Lumi is speaking'}
          </p>
        </div>

        {/* Lumi's message */}
        {lumiMessage && (
          <div
            style={{
              maxWidth: 600,
              marginBottom: 32,
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
          </div>
        )}

        {/* User transcript */}
        {transcript && (
          <div
            style={{
              maxWidth: 500,
              marginBottom: 32,
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

        {/* Text input fallback */}
        {(showTextInput || !lumiListen.isSpeechRecognitionAvailable()) && (
          <form
            onSubmit={handleTextSubmit}
            style={{
              maxWidth: 500,
              width: '100%',
              display: 'flex',
              gap: 12,
            }}
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your message..."
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
              style={{
                padding: '14px 24px',
                backgroundColor: '#F5A623',
                border: 'none',
                borderRadius: 12,
                color: '#0D0D0D',
                fontSize: 14,
                fontWeight: 600,
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
              Send
            </button>
          </form>
        )}

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
