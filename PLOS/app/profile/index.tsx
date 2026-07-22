import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Colors, useTheme } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { useAuthStore } from '../../store/useAuthStore';
import apiClient from '../../services/api';
import { logout } from '../../services/auth';
import { ModeToggle, LumiFace } from '../../components';

type ThemeMode = 'light' | 'dark' | 'auto';

interface Memory {
  key: string;
  value: string;
  created_at: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [themeMode, setThemeMode] = useState<ThemeMode>('auto');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [showMemories, setShowMemories] = useState(false);
  const [loadingMemories, setLoadingMemories] = useState(false);

  useEffect(() => {
    checkBiometric();
    loadThemePreference();
  }, []);

  const checkBiometric = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricSupported(compatible && enrolled);
    const stored = await SecureStore.getItemAsync('biometric_enabled');
    setBiometricEnabled(stored === 'true');
  };

  const loadThemePreference = async () => {
    const stored = await SecureStore.getItemAsync('theme_mode');
    if (stored) setThemeMode(stored as ThemeMode);
  };

  const saveThemePreference = async (mode: ThemeMode) => {
    setThemeMode(mode);
    await SecureStore.setItemAsync('theme_mode', mode);
  };

  const toggleBiometric = async (value: boolean) => {
    if (value) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable biometric lock',
      });
      if (result.success) {
        setBiometricEnabled(true);
        await SecureStore.setItemAsync('biometric_enabled', 'true');
      }
    } else {
      setBiometricEnabled(false);
      await SecureStore.deleteItemAsync('biometric_enabled');
    }
  };

  const loadMemories = async () => {
    setLoadingMemories(true);
    try {
      const res = await apiClient.get('/api/lumi/memories');
      setMemories(res.data?.memories || []);
    } catch (err) {
      console.error('Error loading memories:', err);
    }
    setLoadingMemories(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <LumiFace mood="resting" size={56} />
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>APPEARANCE</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="color-palette-outline" size={20} color={Colors.amber} />
                <Text style={styles.settingLabel}>Theme</Text>
              </View>
              <ModeToggle
                options={[
                  { key: 'light', label: 'Light' },
                  { key: 'dark', label: 'Dark' },
                  { key: 'auto', label: 'Auto' },
                ]}
                activeKey={themeMode}
                onChange={(k) => saveThemePreference(k as ThemeMode)}
              />
            </View>
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SECURITY</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="finger-print-outline" size={20} color={Colors.amber} />
                <View>
                  <Text style={styles.settingLabel}>Biometric Lock</Text>
                  <Text style={styles.settingSub}>
                    {biometricSupported ? 'Use Face ID or fingerprint' : 'Not available on this device'}
                  </Text>
                </View>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={toggleBiometric}
                disabled={!biometricSupported}
                trackColor={{ false: Colors.border, true: Colors.amber }}
                thumbColor={biometricEnabled ? '#fff' : Colors.textMuted}
              />
            </View>
          </View>
        </View>

        {/* Lumi Memory Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LUMI</Text>
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              setShowMemories(!showMemories);
              if (!showMemories) loadMemories();
            }}
            activeOpacity={0.7}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="sparkles" size={20} color={Colors.amber} />
                <View>
                  <Text style={styles.settingLabel}>Things Lumi Remembers</Text>
                  <Text style={styles.settingSub}>View what Lumi has learned about you</Text>
                </View>
              </View>
              <Ionicons
                name={showMemories ? 'chevron-up' : 'chevron-forward'}
                size={18}
                color={Colors.textMuted}
              />
            </View>
          </TouchableOpacity>

          {showMemories && (
            <View style={styles.memoriesCard}>
              {loadingMemories ? (
                <Text style={styles.memoriesLoading}>Loading…</Text>
              ) : memories.length === 0 ? (
                <Text style={styles.memoriesEmpty}>
                  Lumi hasn't learned anything yet. Start chatting!
                </Text>
              ) : (
                memories.map((mem, i) => (
                  <View key={i} style={styles.memoryItem}>
                    <Text style={styles.memoryKey}>{mem.key}</Text>
                    <Text style={styles.memoryValue}>{mem.value}</Text>
                  </View>
                ))
              )}
            </View>
          )}
        </View>

        {/* Billing Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <TouchableOpacity style={styles.card} activeOpacity={0.7}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="card-outline" size={20} color={Colors.amber} />
                <View>
                  <Text style={styles.settingLabel}>Billing</Text>
                  <Text style={styles.settingSub}>
                    {user?.subscription_tier === 'pro' ? 'Pro plan' : 'Free plan — upgrade for more'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color={Colors.coral} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 8,
  },
  userName: {
    fontSize: Typography.title.fontSize,
    fontWeight: Typography.title.fontWeight,
    color: Colors.textPrimary,
    marginTop: 12,
  },
  userEmail: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: Typography.micro.fontSize,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: Typography.body.fontSize,
    color: Colors.textPrimary,
  },
  settingSub: {
    fontSize: Typography.micro.fontSize,
    color: Colors.textMuted,
    marginTop: 2,
  },
  memoriesCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
  },
  memoriesLoading: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  memoriesEmpty: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  memoryItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  memoryKey: {
    fontSize: Typography.micro.fontSize,
    color: Colors.amber,
    fontWeight: '600',
    marginBottom: 2,
  },
  memoryValue: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(224, 82, 82, 0.08)',
    marginTop: 8,
  },
  logoutText: {
    fontSize: Typography.body.fontSize,
    fontWeight: '500',
    color: Colors.coral,
  },
  bottomPadding: {
    height: 40,
  },
});
