import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView,
  RefreshControl, ActivityIndicator, TextInput, Switch, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import apiClient from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import type { AppThemeMode } from '../../constants/colors';

interface UserSettings {
  display_name: string;
  email: string;
  lumi_voice_enabled: boolean;
  lumi_voice_id: string;
  lumi_voice_speed: number;
  lumi_voice_pitch: number;
  wallpaper_scene: string;
  weather_effects: boolean;
  weather_intensity: number;
  theme: 'light' | 'dark' | 'auto';
  push_enabled: boolean;
  checkin_time: string;
}

const VOICE_OPTIONS = [
  { id: 'lumi-warm', label: 'Warm' },
  { id: 'lumi-energetic', label: 'Energetic' },
  { id: 'lumi-calm', label: 'Calm' },
  { id: 'lumi-professional', label: 'Professional' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { mode: themeMode, setMode: setThemeMode } = useTheme();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [showNameEdit, setShowNameEdit] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const fetchSettings = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/users/settings');
      const data = res.data?.settings || {};
      setSettings(data);
      setDisplayName(data.display_name || '');
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);
  const onRefresh = () => { setRefreshing(true); fetchSettings(); };

  const updateSetting = async (key: string, value: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await apiClient.put('/api/users/settings', { [key]: value });
      setSettings((prev) => prev ? { ...prev, [key]: value } : prev);
    } catch (err) {
      console.error('Error updating setting:', err);
    }
  };

  const saveDisplayName = async () => {
    setSaving(true);
    try {
      await apiClient.put('/api/users/settings', { display_name: displayName.trim() });
      setShowNameEdit(false);
    } catch (err) {
      console.error('Error updating name:', err);
    }
    setSaving(false);
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword) return;
    setSaving(true);
    try {
      await apiClient.put('/api/users/password', { currentPassword, newPassword });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCurrentPassword('');
      setNewPassword('');
      setShowPasswordChange(false);
      Alert.alert('Success', 'Password changed successfully');
    } catch (err) {
      console.error('Error changing password:', err);
      Alert.alert('Error', 'Failed to change password');
    }
    setSaving(false);
  };

  const testVoice = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    apiClient.post('/api/users/test-voice').catch(() => {});
  };

  const signOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await SecureStore.deleteItemAsync('access_token');
          await SecureStore.deleteItemAsync('refresh_token');
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const deleteAccount = () => {
    Alert.alert('Delete Account', 'This action is permanent and cannot be undone. All your data will be deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete('/api/users/account');
            await SecureStore.deleteItemAsync('access_token');
            await SecureStore.deleteItemAsync('refresh_token');
            router.replace('/(auth)/login');
          } catch (err) {
            console.error('Error deleting account:', err);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.amber} />
        </View>
      </SafeAreaView>
    );
  }

  const themes: { key: string; label: string; icon: string }[] = [
    { key: 'light', label: 'Light', icon: 'sunny' },
    { key: 'dark', label: 'Dark', icon: 'moon' },
    { key: 'auto', label: 'Auto', icon: 'phone-portrait' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.amber} />}
      >
        {/* Lumi's Voice */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LUMI'S VOICE</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Enable Voice</Text>
              <Switch
                value={settings?.lumi_voice_enabled ?? true}
                onValueChange={(v) => updateSetting('lumi_voice_enabled', v)}
                trackColor={{ false: Colors.textMuted, true: Colors.amber }}
                thumbColor="#fff"
              />
            </View>
            <Text style={styles.subLabel}>Voice</Text>
            <View style={styles.voiceRow}>
              {VOICE_OPTIONS.map((v) => (
                <TouchableOpacity
                  key={v.id}
                  style={[styles.voiceChip, settings?.lumi_voice_id === v.id && { backgroundColor: Colors.amber }]}
                  onPress={() => updateSetting('lumi_voice_id', v.id)}
                >
                  <Text style={[styles.voiceChipText, settings?.lumi_voice_id === v.id && { color: '#080503' }]}>{v.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.subLabel}>Speed: {settings?.lumi_voice_speed?.toFixed(1) || '1.0'}x</Text>
            <View style={styles.sliderRow}>
              <Text style={styles.sliderLabel}>0.5</Text>
              <View style={styles.sliderTrack}>
                <View style={[styles.sliderFill, { width: `${((settings?.lumi_voice_speed || 1) - 0.5) / 1.5 * 100}%` }]} />
              </View>
              <Text style={styles.sliderLabel}>2.0</Text>
            </View>
            <Text style={styles.subLabel}>Pitch: {settings?.lumi_voice_pitch?.toFixed(1) || '1.0'}</Text>
            <View style={styles.sliderRow}>
              <Text style={styles.sliderLabel}>0.5</Text>
              <View style={styles.sliderTrack}>
                <View style={[styles.sliderFill, { width: `${((settings?.lumi_voice_pitch || 1) - 0.5) / 1.5 * 100}%` }]} />
              </View>
              <Text style={styles.sliderLabel}>2.0</Text>
            </View>
            <TouchableOpacity style={styles.testBtn} onPress={testVoice}>
              <Ionicons name="volume-high" size={16} color={Colors.amber} />
              <Text style={styles.testBtnText}>Test Voice</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Wallpaper */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WALLPAPER</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Current Scene</Text>
              <Text style={styles.settingValue}>{settings?.wallpaper_scene || 'Default'}</Text>
            </View>
            <TouchableOpacity style={styles.changeBtn}>
              <Text style={styles.changeBtnText}>Change</Text>
            </TouchableOpacity>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Weather Effects</Text>
              <Switch
                value={settings?.weather_effects ?? false}
                onValueChange={(v) => updateSetting('weather_effects', v)}
                trackColor={{ false: Colors.textMuted, true: Colors.amber }}
                thumbColor="#fff"
              />
            </View>
            <Text style={styles.subLabel}>Intensity: {settings?.weather_intensity || 50}%</Text>
            <View style={styles.sliderRow}>
              <Text style={styles.sliderLabel}>0</Text>
              <View style={styles.sliderTrack}>
                <View style={[styles.sliderFill, { width: `${settings?.weather_intensity || 50}%` }]} />
              </View>
              <Text style={styles.sliderLabel}>100</Text>
            </View>
          </View>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>APPEARANCE</Text>
          <View style={styles.card}>
            <View style={styles.themeRow}>
              {themes.map((t) => {
                const active = themeMode === t.key;
                return (
                  <TouchableOpacity
                    key={t.key}
                    style={[styles.themeChip, active && { backgroundColor: Colors.amber }]}
                    onPress={() => {
                      setThemeMode(t.key as AppThemeMode); // apply instantly
                      updateSetting('theme', t.key); // persist to backend too
                    }}
                  >
                    <Ionicons name={t.icon as any} size={16} color={active ? '#080503' : Colors.textSecondary} />
                    <Text style={[styles.themeChipText, active && { color: '#080503' }]}>{t.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.settingRow} onPress={() => setShowNameEdit(!showNameEdit)}>
              <View>
                <Text style={styles.settingLabel}>Display Name</Text>
                <Text style={styles.settingValue}>{settings?.display_name || 'Not set'}</Text>
              </View>
              <Ionicons name="create-outline" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
            {showNameEdit && (
              <View style={styles.editRow}>
                <TextInput style={styles.editInput} value={displayName} onChangeText={setDisplayName} placeholder="Name" placeholderTextColor={Colors.textMuted} />
                <TouchableOpacity style={styles.saveSmallBtn} onPress={saveDisplayName} disabled={saving}>
                  <Text style={styles.saveSmallBtnText}>{saving ? '...' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.settingRow}>
              <View>
                <Text style={styles.settingLabel}>Email</Text>
                <Text style={styles.settingValue}>{settings?.email || 'Not set'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.settingRow} onPress={() => setShowPasswordChange(!showPasswordChange)}>
              <Text style={styles.settingLabel}>Change Password</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
            {showPasswordChange && (
              <View style={styles.passwordSection}>
                <TextInput style={styles.editInput} value={currentPassword} onChangeText={setCurrentPassword} placeholder="Current password" placeholderTextColor={Colors.textMuted} secureTextEntry />
                <TextInput style={styles.editInput} value={newPassword} onChangeText={setNewPassword} placeholder="New password" placeholderTextColor={Colors.textMuted} secureTextEntry />
                <TouchableOpacity style={styles.saveSmallBtn} onPress={changePassword} disabled={saving}>
                  <Text style={styles.saveSmallBtnText}>{saving ? '...' : 'Update'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Switch
                value={settings?.push_enabled ?? true}
                onValueChange={(v) => updateSetting('push_enabled', v)}
                trackColor={{ false: Colors.textMuted, true: Colors.amber }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Daily Check-in Time</Text>
              <Text style={styles.settingValue}>{settings?.checkin_time || '09:00'}</Text>
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.coral }]}>DANGER ZONE</Text>
          <TouchableOpacity style={styles.dangerBtn} onPress={deleteAccount}>
            <Ionicons name="trash-outline" size={16} color={Colors.coral} />
            <Text style={styles.dangerBtnText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
          <Ionicons name="log-out-outline" size={18} color={Colors.coral} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: Typography.title.fontSize, fontWeight: Typography.title.fontWeight, color: Colors.textPrimary },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: Typography.micro.fontSize, fontWeight: '600', color: Colors.textMuted, letterSpacing: 0.5, marginBottom: 10 },
  card: { backgroundColor: Colors.card, borderRadius: 14, padding: 16, gap: 12 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingLabel: { fontSize: Typography.body.fontSize, color: Colors.textPrimary },
  settingValue: { fontSize: Typography.caption.fontSize, color: Colors.textMuted, marginTop: 2 },
  subLabel: { fontSize: Typography.caption.fontSize, color: Colors.textSecondary, marginTop: 4 },
  voiceRow: { flexDirection: 'row', gap: 8 },
  voiceChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)' },
  voiceChipText: { fontSize: Typography.micro.fontSize, color: Colors.textSecondary },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sliderLabel: { fontSize: Typography.micro.fontSize, color: Colors.textMuted, width: 28 },
  sliderTrack: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
  sliderFill: { height: '100%', backgroundColor: Colors.amber, borderRadius: 3 },
  testBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(200,149,92,0.12)', padding: 10, borderRadius: 10 },
  testBtnText: { fontSize: Typography.caption.fontSize, color: Colors.amber, fontWeight: '600' },
  changeBtn: { alignSelf: 'flex-start', backgroundColor: 'rgba(200,149,92,0.12)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  changeBtnText: { fontSize: Typography.caption.fontSize, color: Colors.amber, fontWeight: '600' },
  themeRow: { flexDirection: 'row', gap: 8 },
  themeChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)' },
  themeChipText: { fontSize: Typography.caption.fontSize, color: Colors.textSecondary, fontWeight: '600' },
  editRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  editInput: { flex: 1, backgroundColor: Colors.background, borderRadius: 10, padding: 12, color: Colors.textPrimary, fontSize: Typography.caption.fontSize },
  saveSmallBtn: { backgroundColor: Colors.amber, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, justifyContent: 'center' },
  saveSmallBtnText: { fontSize: Typography.caption.fontSize, fontWeight: '600', color: '#080503' },
  passwordSection: { gap: 8, marginTop: 8 },
  dangerBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(224,82,82,0.1)', padding: 14, borderRadius: 12 },
  dangerBtnText: { fontSize: Typography.body.fontSize, color: Colors.coral, fontWeight: '600' },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.card, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(224,82,82,0.2)', marginTop: 8 },
  signOutText: { fontSize: Typography.body.fontSize, color: Colors.coral, fontWeight: '600' },
  bottomPadding: { height: 40 },
});
