import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Typography } from '../constants/typography';
import { useThemeColors } from '../contexts/ThemeContext';

interface HeroCardProps {
  title: string;
  subtitle?: string;
  action?: string;
  onPress?: () => void;
  icon?: string;
  accentColor?: string;
}

export default function HeroCard({ title, subtitle, action, onPress, icon, accentColor }: HeroCardProps) {
  const c = useThemeColors();
  const accent = accentColor || c.amber;
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: c.card, borderTopColor: accent, borderColor: c.border }]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.content}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={[styles.title, { color: c.textPrimary }]}>{title}</Text>
        {subtitle && <Text style={[styles.subtitle, { color: c.textSecondary }]}>{subtitle}</Text>}
        {action && (
          <View style={[styles.actionBtn, { backgroundColor: accent }]}>
            <Text style={styles.actionText}>{action}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    borderTopWidth: 3,
    borderWidth: 1,
    marginBottom: 16,
  },
  content: { gap: 8 },
  icon: { fontSize: 28, marginBottom: 4 },
  title: {
    fontSize: Typography.subtitle.fontSize,
    fontWeight: Typography.subtitle.fontWeight,
  },
  subtitle: {
    fontSize: Typography.caption.fontSize,
    lineHeight: 20,
  },
  actionBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 4,
  },
  actionText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '600',
    color: '#1a1209',
  },
});
