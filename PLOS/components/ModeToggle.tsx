import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

interface ModeToggleProps {
  options: { key: string; label: string }[];
  activeKey: string;
  onChange: (key: string) => void;
}

export default function ModeToggle({ options, activeKey, onChange }: ModeToggleProps) {
  return (
    <View style={styles.container}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.key}
          style={[styles.option, activeKey === opt.key && styles.optionActive]}
          onPress={() => onChange(opt.key)}
        >
          <Text style={[styles.label, activeKey === opt.key && styles.labelActive]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 3,
    gap: 2,
  },
  option: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  optionActive: {
    backgroundColor: Colors.amber,
  },
  label: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  labelActive: {
    color: '#080503',
    fontWeight: '600',
  },
});
