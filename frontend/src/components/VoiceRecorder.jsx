import { useState, useRef, useEffect } from 'react';

export default function VoiceRecorder({ onTranscriptReady }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState('');
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef(null);
  const startTimeRef = useRef(null);
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      let finalPiece = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalPiece += text + ' ';
        } else {
          interim += text;
        }
      }

      if (finalPiece) {
        finalTranscriptRef.current += finalPiece;
        setTranscript(finalTranscriptRef.current);
      }
      setInterimText(interim);
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') return;
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access in your browser.');
      } else {
        setError('Recording error: ' + event.error);
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      if (isRecording) {
        try { recognition.start(); } catch (e) {}
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try { recognition.stop(); } catch (e) {}
    };
  }, [isRecording]);

  function startRecording() {
    setError('');
    setTranscript('');
    setInterimText('');
    finalTranscriptRef.current = '';
    setIsRecording(true);
    startTimeRef.current = Date.now();
    try {
      recognitionRef.current.start();
    } catch (e) {
      setError('Could not start recording. Please try again.');
      setIsRecording(false);
    }
  }

  function stopRecording() {
    setIsRecording(false);
    setInterimText('');
    try { recognitionRef.current.stop(); } catch (e) {}

    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const finalText = finalTranscriptRef.current.trim();

    if (finalText && onTranscriptReady) {
      onTranscriptReady(finalText, duration);
    }
  }

  if (!isSupported) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
        Voice recording requires Chrome or Edge. You can still type your entry below.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Big mic button */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`relative flex h-24 w-24 items-center justify-center rounded-full text-4xl transition-all duration-300 ${
            isRecording
              ? 'bg-red-500/20 text-red-400 ring-4 ring-red-500/40 animate-pulse'
              : 'bg-teal-500/20 text-teal-400 ring-2 ring-teal-500/40 hover:bg-teal-500/30 hover:ring-teal-500/60'
          }`}
        >
          {isRecording ? '⏹' : '🎙️'}
        </button>
        <p className="text-sm text-slate-400">
          {isRecording ? 'Recording... tap to stop' : 'Tap to record your journal'}
        </p>
      </div>

      {/* Live transcript while recording */}
      {(isRecording || interimText) && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm">
          <p className="mb-1 text-xs text-slate-500">Live transcript</p>
          <p className="text-slate-300">
            {transcript}
            <span className="text-slate-500">{interimText}</span>
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}