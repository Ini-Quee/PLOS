import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '../constants/colors';
import { useAuthStore } from '../store/useAuthStore';
import { getStoredUser } from '../services/auth';
import LumiFace from '../components/LumiFace';

/**
 * Entry / boot screen.
 *
 * Runs once on cold launch and restores the previous session instead of
 * dumping the user back on the login screen every time:
 *   1. Is there a stored access token?  -> restore the saved user, go to the app.
 *   2. No token / no user?              -> go to login.
 *
 * A short branded splash shows while we decide, so opening the app feels
 * intentional rather than flashing between screens.
 */
export default function Boot() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const token = await SecureStore.getItemAsync('access_token');
        const user = token ? await getStoredUser() : null;

        if (!active) return;

        if (token && user) {
          setUser(user);
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/login');
        }
      } catch (e) {
        if (!active) return;
        setMessage('Having trouble starting — taking you to sign in.');
        router.replace('/(auth)/login');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [router, setUser, setLoading]);

  return (
    <View style={styles.container}>
      <LumiFace mood="resting" size={72} />
      <Text style={styles.brand}>IniQ</Text>
      <ActivityIndicator color={Colors.amber} style={{ marginTop: 18 }} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 28, fontFamily: 'Georgia', color: Colors.textPrimary, marginTop: 16, letterSpacing: 1 },
  message: { fontSize: 13, color: Colors.textSecondary, marginTop: 14, textAlign: 'center', paddingHorizontal: 40 },
});
