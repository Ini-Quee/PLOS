import { useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../contexts/ThemeContext';
import type { ColorScheme } from '../../constants/colors';

type Item = { label: string; icon: keyof typeof Ionicons.glyphMap; route: string; tint: string };

export default function MoreHub() {
  const router = useRouter();
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  const items: Item[] = [
    { label: 'Budget', icon: 'wallet-outline', route: '/budget', tint: c.teal },
    { label: 'Reading', icon: 'book-outline', route: '/books', tint: c.purple },
    { label: 'Trackers', icon: 'pulse-outline', route: '/trackers', tint: c.green },
    { label: 'Year Plan', icon: 'flag-outline', route: '/year-plan', tint: c.blue },
    { label: 'Projects', icon: 'briefcase-outline', route: '/projects', tint: c.amber },
    { label: 'Content', icon: 'megaphone-outline', route: '/content-planner', tint: c.coral },
    { label: 'Jobs', icon: 'documents-outline', route: '/jobs', tint: c.blue },
    { label: 'Contacts', icon: 'people-outline', route: '/contacts', tint: c.purple },
    { label: 'Email', icon: 'mail-outline', route: '/email', tint: c.teal },
    { label: 'Calendar', icon: 'calendar-outline', route: '/calendar', tint: c.amber },
    { label: 'Settings', icon: 'settings-outline', route: '/settings', tint: c.textSecondary },
    { label: 'Profile', icon: 'person-outline', route: '/profile', tint: c.amber },
    { label: 'Upgrade', icon: 'star-outline', route: '/upgrade', tint: c.gold },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={26} color={c.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>More</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {items.map((it) => (
          <TouchableOpacity
            key={it.route}
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => router.push(it.route as any)}
          >
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(200,149,92,0.10)' }]}>
              <Ionicons name={it.icon} size={22} color={it.tint} />
            </View>
            <Text style={styles.cardLabel}>{it.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: ColorScheme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
    title: { fontSize: 20, fontFamily: 'Georgia', color: c.textPrimary },
    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, paddingTop: 6, gap: 12 },
    card: {
      width: '47%',
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      paddingVertical: 18,
      paddingHorizontal: 14,
      alignItems: 'flex-start',
      gap: 12,
    },
    iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    cardLabel: { fontSize: 14, color: c.textPrimary, fontWeight: '500' },
  });
