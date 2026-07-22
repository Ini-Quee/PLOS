import { useState, useRef, useMemo } from 'react';
import { Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../constants/typography';
import { useThemeColors } from '../contexts/ThemeContext';
import type { ColorScheme } from '../constants/colors';

interface VoiceCaptureProps {
  onTranscription?: (text: string) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  size?: number;
}

export default function VoiceCapture({ onTranscription, onRecordingStart, onRecordingStop, size = 64 }: VoiceCaptureProps) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const recordingRef = useRef<Audio.Recording | null>(null);

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      onRecordingStart?.();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingRef.current) return;

      setIsRecording(false);
      setIsProcessing(true);
      onRecordingStop?.();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      pulseAnim.setValue(1);

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      // TODO: Send to Whisper/transcription API
      // For now, simulate a delay
      setTimeout(() => {
        setIsProcessing(false);
        onTranscription?.('Voice transcription coming soon');
      }, 1000);
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setIsProcessing(false);
    }
  };

  return (
    <TouchableOpacity
      onPressIn={startRecording}
      onPressOut={stopRecording}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale: isRecording ? pulseAnim : 1 }],
          },
          isRecording && styles.recording,
          isProcessing && styles.processing,
        ]}
      >
        <Ionicons
          name={isRecording ? 'mic' : isProcessing ? 'hourglass' : 'mic-outline'}
          size={size * 0.4}
          color={isRecording ? '#fff' : c.amber}
        />
      </Animated.View>
      <Text style={styles.label}>
        {isRecording ? 'Listening…' : isProcessing ? 'Processing…' : 'Hold to talk'}
      </Text>
    </TouchableOpacity>
  );
}

const makeStyles = (c: ColorScheme) =>
  StyleSheet.create({
    container: {
      backgroundColor: 'rgba(200, 149, 92, 0.12)',
      borderWidth: 2,
      borderColor: c.amber,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
    },
    recording: {
      backgroundColor: 'rgba(200, 149, 92, 0.3)',
      borderColor: '#D4A06A',
    },
    processing: {
      backgroundColor: 'rgba(139, 92, 246, 0.15)',
      borderColor: c.purple,
    },
    label: {
      fontSize: Typography.micro.fontSize,
      color: c.textMuted,
      textAlign: 'center',
      marginTop: 8,
    },
  });
