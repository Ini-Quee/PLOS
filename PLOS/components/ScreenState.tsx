import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useThemeColors } from '../contexts/ThemeContext';
import LumiFace from './LumiFace';

interface Props {
  loading?: boolean;
  error?: boolean;
  empty?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  errorMessage?: string;
  onRetry?: () => void;
  children?: React.ReactNode;
}

/**
 * One consistent place for loading / empty / error states so every data screen
 * behaves the same and a failed request never blanks the page. Theme-aware.
 */
export default function ScreenState({
  loading,
  error,
  empty,
  emptyTitle = 'Nothing here yet',
  emptyMessage = 'When you add something, it shows up here.',
  errorMessage = "Couldn't load this just now.",
  onRetry,
  children,
}: Props) {
  const colors = useThemeColors();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.amber} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <LumiFace mood="concerned" size={48} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>{errorMessage}</Text>
        {onRetry ? (
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.amber }]} onPress={onRetry} activeOpacity={0.85}>
            <Text style={styles.buttonText}>Try again</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  if (empty) {
    return (
      <View style={styles.center}>
        <LumiFace mood="resting" size={48} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>{emptyTitle}</Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>{emptyMessage}</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, minHeight: 220 },
  title: { fontSize: 16, fontFamily: 'Georgia', marginTop: 14, textAlign: 'center' },
  message: { fontSize: 13, marginTop: 6, textAlign: 'center', lineHeight: 19 },
  button: { marginTop: 18, paddingHorizontal: 24, paddingVertical: 11, borderRadius: 22 },
  buttonText: { color: '#1a1209', fontSize: 14, fontWeight: '600' },
});
