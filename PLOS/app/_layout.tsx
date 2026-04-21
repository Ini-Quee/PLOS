import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { useAuthStore } from '../store/useAuthStore';
import { getStoredUser } from '../services/auth';

export default function RootLayout() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsChecking(true);
      setLoading(true);

      // Check for access token in secure store
      const accessToken = await SecureStore.getItemAsync('access_token');
      
      if (accessToken) {
        // Token exists - get user data and redirect to tabs
        const user = await getStoredUser();
        if (user) {
          setUser(user);
          router.replace('/(tabs)');
        } else {
          // Token exists but no user data - stay on auth
          setUser(null);
          router.replace('/(auth)/login');
        }
      } else {
        // No token - redirect to login
        setUser(null);
        router.replace('/(auth)/login');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
      router.replace('/(auth)/login');
    } finally {
      setIsChecking(false);
      setLoading(false);
    }
  };

  // Show loading screen while checking auth
  if (isChecking) {
    return (
      <View style={styles.container}>
        <Text style={styles.logo}>PLOS</Text>
        <ActivityIndicator size="small" color={Colors.blue} style={styles.spinner} />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <>
      <Slot />
      <StatusBar style="light" />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    color: Colors.white,
    fontSize: Typography.hero.fontSize,
    fontWeight: Typography.hero.fontWeight,
  },
  spinner: {
    marginTop: 16,
  },
});
