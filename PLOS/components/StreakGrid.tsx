import { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Typography } from '../constants/typography';
import { useThemeColors } from '../contexts/ThemeContext';
import type { ColorScheme } from '../constants/colors';

interface StreakGridProps {
  marks: string[];
  color?: string;
  onPress?: () => void;
  streak?: number;
  title?: string;
  emoji?: string;
}

export default function StreakGrid({ marks, color, onPress, streak, title, emoji }: StreakGridProps) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const accent = color || c.amber;

  const todayStr = new Date().toISOString().slice(0, 10);
  const markSet = new Set(
    (marks || []).map((d) =>
      typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10)
    )
  );

  // Build 12-week grid (84 days)
  const weeks = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 83);

  for (let w = 0; w < 12; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + w * 7 + d);
      const dateStr = date.toISOString().slice(0, 10);
      week.push({
        date: dateStr,
        filled: markSet.has(dateStr),
        isToday: dateStr === todayStr,
      });
    }
    weeks.push(week);
  }

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7} disabled={!onPress}>
      {(title || emoji) && (
        <View style={styles.header}>
          {emoji && <Text style={styles.emoji}>{emoji}</Text>}
          {title && <Text style={styles.title}>{title}</Text>}
          {streak !== undefined && <Text style={[styles.streak, { color: accent }]}>🔥 {streak}</Text>}
        </View>
      )}
      <View style={styles.grid}>
        {weeks.map((week, wi) => (
          <View key={wi} style={styles.weekCol}>
            {week.map((day) => (
              <View
                key={day.date}
                style={[
                  styles.dot,
                  { backgroundColor: day.filled ? accent : 'rgba(128,128,128,0.18)' },
                  day.isToday && { borderWidth: 1.5, borderColor: accent },
                ]}
              />
            ))}
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (c: ColorScheme) =>
  StyleSheet.create({
    container: {
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      padding: 14,
      marginBottom: 10,
    },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
    emoji: { fontSize: 16 },
    title: { flex: 1, fontSize: Typography.caption.fontSize, color: c.textPrimary, fontWeight: '500' },
    streak: { fontSize: Typography.caption.fontSize, fontWeight: '700' },
    grid: { flexDirection: 'row', gap: 3 },
    weekCol: { gap: 3 },
    dot: { width: 11, height: 11, borderRadius: 2 },
  });
