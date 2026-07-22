import { View, Text, StyleSheet } from 'react-native';
import LumiFace from './LumiFace';
import { Typography } from '../constants/typography';
import { useThemeColors } from '../contexts/ThemeContext';

interface NudgeBarProps {
  message: string;
  mood?: 'resting' | 'thinking' | 'happy' | 'listening' | 'concerned';
}

export default function NudgeBar({ message, mood = 'resting' }: NudgeBarProps) {
  const c = useThemeColors();
  return (
    <View style={[styles.container, { backgroundColor: 'rgba(200, 149, 92, 0.08)' }]}>
      <LumiFace mood={mood} size={28} />
      <Text style={[styles.text, { color: c.textSecondary }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  text: {
    flex: 1,
    fontSize: Typography.caption.fontSize,
    lineHeight: 18,
  },
});
