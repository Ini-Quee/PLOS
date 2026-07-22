import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView,
  RefreshControl, ActivityIndicator, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import apiClient from '../../services/api';

interface YearPlan {
  year_goal: string;
  quarterly_milestones: { q1: string; q2: string; q3: string; q4: string };
  monthly_theme: string;
  daily_intention: string;
  lumi_spoken: boolean;
}

export default function YearPlanScreen() {
  const [plan, setPlan] = useState<YearPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [intention, setIntention] = useState('');
  const [savingIntention, setSavingIntention] = useState(false);

  const fetchPlan = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/goals');
      const data = res.data?.plan || res.data;
      setPlan(data);
      setIntention(data?.daily_intention || '');
    } catch (err) {
      console.error('Error fetching year plan:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);
  const onRefresh = () => { setRefreshing(true); fetchPlan(); };

  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long' });

  const saveIntention = async () => {
    if (!intention.trim()) return;
    setSavingIntention(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await apiClient.put('/api/goals/intention', { intention: intention.trim() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Error saving intention:', err);
    }
    setSavingIntention(false);
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

  const quarters = [
    { key: 'q1', label: 'Q1 — Jan–Mar', icon: '🌱' },
    { key: 'q2', label: 'Q2 — Apr–Jun', icon: '☀️' },
    { key: 'q3', label: 'Q3 — Jul–Sep', icon: '🍂' },
    { key: 'q4', label: 'Q4 — Oct–Dec', icon: '❄️' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Year Plan</Text>
        <Text style={styles.yearBadge}>{new Date().getFullYear()}</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.amber} />}
      >
        {/* Year Goal */}
        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Ionicons name="flag" size={18} color={Colors.amber} />
            <Text style={styles.sectionTitle}>YEAR GOAL</Text>
          </View>
          <Text style={styles.goalText}>{plan?.year_goal || 'No year goal set yet'}</Text>
        </View>

        {/* Quarterly Milestones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QUARTERLY MILESTONES</Text>
          {quarters.map((q, i) => {
            const isCurrent = i + 1 === currentQuarter;
            return (
              <View key={q.key} style={[styles.quarterCard, isCurrent && styles.quarterCardActive]}>
                <Text style={styles.quarterIcon}>{q.icon}</Text>
                <View style={styles.quarterInfo}>
                  <Text style={[styles.quarterLabel, isCurrent && { color: Colors.amber }]}>{q.label}</Text>
                  <Text style={styles.quarterText}>
                    {plan?.quarterly_milestones?.[q.key as keyof typeof plan.quarterly_milestones] || 'Not set'}
                  </Text>
                </View>
                {isCurrent && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>Now</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Monthly Theme */}
        <View style={styles.themeCard}>
          <View style={styles.themeHeader}>
            <Ionicons name="calendar" size={18} color={Colors.teal} />
            <Text style={styles.sectionTitle}>{currentMonth.toUpperCase()} THEME</Text>
          </View>
          <Text style={styles.themeText}>{plan?.monthly_theme || 'No theme set for this month'}</Text>
        </View>

        {/* Daily Intention */}
        <View style={styles.intentionCard}>
          <View style={styles.intentionHeader}>
            <Ionicons name="create" size={18} color={Colors.purple} />
            <Text style={styles.sectionTitle}>DAILY INTENTION</Text>
            {plan?.lumi_spoken && (
              <View style={styles.lumiBadge}>
                <Ionicons name="volume-high" size={12} color={Colors.amber} />
                <Text style={styles.lumiBadgeText}>Lumi spoken</Text>
              </View>
            )}
          </View>
          <TextInput
            style={styles.intentionInput}
            placeholder="What is your intention for today?"
            placeholderTextColor={Colors.textMuted}
            value={intention}
            onChangeText={setIntention}
            multiline
          />
          <TouchableOpacity
            style={[styles.saveBtn, !intention.trim() && { opacity: 0.5 }]}
            onPress={saveIntention}
            disabled={!intention.trim() || savingIntention}
          >
            <Ionicons name="checkmark-circle" size={16} color="#080503" />
            <Text style={styles.saveBtnText}>{savingIntention ? 'Saving...' : 'Save Intention'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: Typography.title.fontSize, fontWeight: Typography.title.fontWeight, color: Colors.textPrimary },
  yearBadge: { fontSize: Typography.body.fontSize, fontWeight: '700', color: Colors.amber, backgroundColor: 'rgba(200,149,92,0.12)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  goalCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 20, marginBottom: 20 },
  goalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: Typography.micro.fontSize, fontWeight: '600', color: Colors.textMuted, letterSpacing: 0.5 },
  goalText: { fontSize: Typography.body.fontSize, color: Colors.textPrimary, lineHeight: 22 },
  section: { marginBottom: 20 },
  quarterCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginTop: 8, gap: 12 },
  quarterCardActive: { borderWidth: 1, borderColor: Colors.amber },
  quarterIcon: { fontSize: 20 },
  quarterInfo: { flex: 1 },
  quarterLabel: { fontSize: Typography.micro.fontSize, fontWeight: '600', color: Colors.textMuted, marginBottom: 2 },
  quarterText: { fontSize: Typography.caption.fontSize, color: Colors.textPrimary },
  currentBadge: { backgroundColor: Colors.amber, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  currentBadgeText: { fontSize: 9, fontWeight: '700', color: '#080503' },
  themeCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 20, marginBottom: 20 },
  themeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  themeText: { fontSize: Typography.body.fontSize, color: Colors.textPrimary, lineHeight: 22 },
  intentionCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 20, marginBottom: 20 },
  intentionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  lumiBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto', backgroundColor: 'rgba(200,149,92,0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  lumiBadgeText: { fontSize: 9, color: Colors.amber, fontWeight: '600' },
  intentionInput: { backgroundColor: Colors.background, borderRadius: 12, padding: 14, color: Colors.textPrimary, fontSize: Typography.body.fontSize, minHeight: 60, textAlignVertical: 'top', marginBottom: 12 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.amber, padding: 14, borderRadius: 12 },
  saveBtnText: { fontSize: Typography.body.fontSize, fontWeight: '600', color: '#080503' },
  bottomPadding: { height: 80 },
});
