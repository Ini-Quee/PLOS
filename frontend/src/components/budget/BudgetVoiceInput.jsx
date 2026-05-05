import { useState, useRef, useEffect } from 'react';
import * as lumiListen from '../../lib/lumi-listen';
import AudioWaveform from './AudioWaveform';

export default function BudgetVoiceInput({ onTranscript, disabled = false }) {
  const [micState, setMicState] = useState('idle'); // 'idle' | 'listening' | 'processing'
  const [liveTranscript, setLiveTranscript] = useState('');
  const [waveformBars, setWaveformBars] = useState(Array(20).fill(2));
  const [micError, setMicError] = useState('');

  const audioContextRef = useRef(null);
  const analyserRef     = useRef(null);
  const micStreamRef    = useRef(null);
  const animFrameRef    = useRef(null);
  const lastFrameRef    = useRef(0);
  const listeningRef    = useRef(false);

  useEffect(() => {
    return () => {
      lumiListen.stopListening();
      stopWaveformAnalysis();
    };
  }, []);

  function startWaveformAnalysis(stream) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audioContextRef.current = new AC();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 64;
      analyserRef.current.smoothingTimeConstant = 0.8;
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

      function draw() {
        animFrameRef.current = requestAnimationFrame(draw);
        const now = Date.now();
        if (now - lastFrameRef.current < 66) return; // ~15fps
        lastFrameRef.current = now;
        analyserRef.current.getByteFrequencyData(dataArray);
        const bars = Array.from(dataArray.slice(0, 20)).map(v =>
          Math.max(2, Math.round((v / 255) * 40))
        );
        setWaveformBars(bars);
      }
      draw();
    } catch {}
  }

  function stopWaveformAnalysis() {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (analyserRef.current) { analyserRef.current.disconnect(); analyserRef.current = null; }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    setWaveformBars(Array(20).fill(2));
  }

  async function startMicListening() {
    if (listeningRef.current || disabled) return;
    if (!lumiListen.isSpeechRecognitionAvailable()) {
      setMicError('Voice not available in this browser — please type instead.');
      return;
    }
    setMicError('');
    setLiveTranscript('');
    listeningRef.current = true;
    setMicState('listening');

    // Waveform stream (non-fatal if denied)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      startWaveformAnalysis(stream);
    } catch {}

    try {
      await lumiListen.startListening(
        {
          onStart: () => setMicState('listening'),
          onResult: ({ fullText }) => setLiveTranscript(fullText),
          onEnd: ({ transcript: t }) => {
            listeningRef.current = false;
            stopWaveformAnalysis();
            setLiveTranscript('');
            setMicState('idle');
            if (t.trim()) onTranscript(t.trim());
          },
          onNoSpeech: () => {
            listeningRef.current = false;
            stopWaveformAnalysis();
            setMicState('idle');
          },
          onSilenceTimeout: (t) => {
            listeningRef.current = false;
            stopWaveformAnalysis();
            setLiveTranscript('');
            setMicState('idle');
            if (t?.trim()) onTranscript(t.trim());
          },
        },
        { interimResults: true }
      );
    } catch (err) {
      listeningRef.current = false;
      stopWaveformAnalysis();
      setMicState('idle');
      setMicError(err.message || 'Could not access microphone.');
    }
  }

  function stopMicListening() {
    lumiListen.stopListening();
    listeningRef.current = false;
    stopWaveformAnalysis();
    setLiveTranscript('');
    setMicState('idle');
  }

  const isListening = micState === 'listening';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <button
        onClick={isListening ? stopMicListening : startMicListening}
        disabled={disabled}
        title={isListening ? 'Tap to stop' : 'Tap to speak'}
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: isListening ? '2px solid #E05252' : '1px solid rgba(200,149,92,0.4)',
          background: isListening ? 'rgba(224,82,82,0.15)' : 'rgba(200,149,92,0.12)',
          color: isListening ? '#E05252' : '#C8955C',
          fontSize: 20,
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          animation: isListening ? 'lumiPulse 1.5s ease-in-out infinite' : 'none',
          flexShrink: 0,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {isListening ? '⏹' : '🎙️'}
      </button>

      {isListening && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <AudioWaveform bars={waveformBars} color="#C8955C" />
          {liveTranscript && (
            <p style={{
              margin: 0,
              fontSize: 12,
              color: 'rgba(234,224,213,0.7)',
              fontStyle: 'italic',
              maxWidth: 240,
              textAlign: 'center',
              lineHeight: 1.4,
            }}>
              {liveTranscript}
            </p>
          )}
          <p style={{ margin: 0, fontSize: 11, color: '#5E5048' }}>Tap to stop</p>
        </div>
      )}

      {micError && (
        <p style={{ margin: 0, fontSize: 11, color: '#E05252', textAlign: 'center', maxWidth: 200 }}>
          {micError}
        </p>
      )}
    </div>
  );
}
