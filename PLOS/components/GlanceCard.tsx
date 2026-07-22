import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Typography } from '../constants/typography';
import { useThemeColors } from '../contexts/ThemeContext';

interface GlanceCardProps {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  onPress?: () => void;
  accentColor?: string;
}

export default function GlanceCard({ icon, label, value, sub, onPress, accentColor }: GlanceCardProps) {
  const c = useThemeColors();
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.label, { color: c.textMuted }]}>{label}</Text>
      <Text style={[styles.value, { color: accentColor || c.amber }]}>{value}</Text>
      {sub && <Text style={[styles.sub, { color: c.textSecondary }]}>{sub}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flex: 1,
    minWidth: 0,
  },
  icon: { fontSize: 18, marginBottom: 6 },
  label: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: { fontSize: 20, fontWeight: '700' },
  sub: { fontSize: Typography.micro.fontSize, marginTop: 2 },
});
