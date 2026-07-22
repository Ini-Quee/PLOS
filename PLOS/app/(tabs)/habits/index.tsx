import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView,
  RefreshControl, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Typography } from '../../../constants/typography';
import { useThemeColors } from '../../../contexts/ThemeContext';
import type { ColorScheme } from '../../../constants/colors';
import apiClient from '../../../services/api';
import { LumiFace } from '../../../components';

interface Habit {
  id: string; title: string; emoji: string; category: string;
  identity_label: string; completed_today: boolean; streak: number;
  recent_completions: string[]; revival_tokens: number; consistency: number;
  partner_email?: string; stake?: string;
}

const CATEGORIES = ['health', 'focus', 'mindset', 'finance', 'social', 'personal'];
const CAT_COLORS: Record<string, string> = { health: '#6ee7b7', focus: '#7AAEE8', mindset: '#9b7fe8', finance: '#fbbf24', social: '#f9a8d4', personal: '#c4b5fd' };
const EMOJI_OPTIONS = ['🔥', '💧', '📖', '💪', '🙏', '🧘', '✍️', '🏃', '💤', '🎯', '💰', '🧠'];

export default function HabitsScreen() {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showIdentityVote, setShowIdentityVote] = useState<Habit | null>(null);
  const [showReframe, setShowReframe] = useState<Habit | null>(null);
  const [showRevival, setShowRevival] = useState<Habit | null>(null);
  const [identityScore, setIdentityScore] = useState(5);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Add form
  const [newTitle, setNewTitle] = useState('');
  const [newEmoji, setNewEmoji] = useState('🔥');
  const [newCategory, setNewCategory] = useState('personal');
  const [newIdentity, setNewIdentity] = useState('');
  const [newPartner, setNewPartner] = useState('');
  const [newStake, setNewStake] = useState('');
  const [saving, setSaving] = useState(false);

  // Lumi insight
  const [lumiInsight, setLumiInsight] = useState('');

  const fetchHabits = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/habits');
      setHabits(res.data?.habits || []);
    } catch (err) { console.error('Error fetching habits:', err); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchHabits(); }, [fetchHabits]);
  const onRefresh = () => { setRefreshing(true); fetchHabits(); };

  // Stats
  const completedCount = habits.filter((h) => h.completed_today).length;
  const consistencyScore = habits.length > 0 ? Math.round(habits.reduce((sum, h) => sum + (h.consistency || 0), 0) / habits.length) : 0;

  // Weekly comparison
  const thisWeekDone = habits.reduce((sum, h) => sum + (h.recent_completions?.slice(0, 7).filter(Boolean).length || 0), 0);
  const lastWeekDone = habits.reduce((sum, h) => sum + (h.recent_completions?.slice(7, 14).filter(Boolean).length || 0), 0);
  const weekDelta = thisWeekDone - lastWeekDone;

  // Identity bar
  const avgIdentity = habits.length > 0 ? Math.round(habits.reduce((sum, h) => sum + (h.streak || 0), 0) / habits.length) : 0;

  // Monthly grid (30 days)
  const getMonthlyGrid = () => {
    const today = new Date();
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today); d.setDate(today.getDate() - 29 + i);
      const dateStr = d.toISOString().slice(0, 10);
      const doneCount = habits.filter((h) => h.recent_completions?.includes(dateStr)).length;
      return { date: d.getDate(), done: doneCount > 0, strong: doneCount >= habits.length * 0.7, partial: doneCount > 0 && doneCount < habits.length * 0.7 };
    });
  };

  // 90-day heatmap
  const getHeatmap = (habit: Habit) => {
    const today = new Date();
    return Array.from({ length: 91 }, (_, i) => {
      const d = new Date(today); d.setDate(today.getDate() - 90 + i);
      return habit.recent_completions?.includes(d.toISOString().slice(0, 10)) || false;
    });
  };

  // Mark done
  const markDone = async (habit: Habit) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowIdentityVote(habit);
  };

  const submitIdentityVote = async () => {
    if (!showIdentityVote) return;
    setHabits((prev) => prev.map((h) => h.id === showIdentityVote.id ? { ...h, completed_today: true, streak: h.streak + 1 } : h));
    try {
      await apiClient.post(`/api/habits/${showIdentityVote.id}/complete`, { identity_score: identityScore });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { fetchHabits(); }
    setShowIdentityVote(null);
    setIdentityScore(5);
  };

  // Skip
  const skipHabit = async (habit: Habit) => {
    if (habit.streak >= 3) { setShowReframe(habit); return; }
    try { await apiClient.post(`/api/habits/${habit.id}/skip`); } catch {}
  };

  // Revival
  const useRevival = async () => {
    if (!showRevival) return;
    try { await apiClient.post(`/api/habits/${showRevival.id}/revive`); fetchHabits(); } catch {}
    setShowRevival(null);
  };

  // Add habit
  const addHabit = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      await apiClient.post('/api/habits', {
        title: newTitle.trim(), emoji: newEmoji, category: newCategory,
        identity_label: newIdentity, partner_email: newPartner, stake: newStake,
        target_days: [0, 1, 2, 3, 4, 5, 6],
      });
      setNewTitle(''); setNewEmoji('🔥'); setNewCategory('personal');
      setNewIdentity(''); setNewPartner(''); setNewStake('');
      setShowAdd(false); fetchHabits();
    } catch (err) { console.error('Error adding habit:', err); }
    setSaving(false);
  };

  // Lumi insight
  useEffect(() => {
    if (habits.length > 0 && !lumiInsight) {
      const done = habits.filter((h) => h.completed_today).length;
      const total = habits.length;
      if (done === total) setLumiInsight("All habits done! You're building strong identity votes today.");
      else if (done >= total * 0.5) setLumiInsight(`${done}/${total} done. Keep going — consistency beats intensity.`);
      else setLumiInsight(`Start with your easiest habit. Momentum builds from small wins.`);
    }
  }, [habits]);

  if (loading) {
    return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color={c.amber} /></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Habits</Text>
        <View style={styles.headerRight}>
          <Text style={styles.countText}>{completedCount}/{habits.length} ✓</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
            <Ionicons name="add" size={22} color={c.amber} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.amber} />}>

        {/* Consistency Score Ring */}
        <View style={styles.ringCard}>
          <View style={styles.ring}>
            <Text style={styles.ringPct}>{consistencyScore}%</Text>
            <Text style={styles.ringLabel}>consistency</Text>
          </View>
          <View style={styles.ringStats}>
            <Text style={styles.ringStatText}>Today: {completedCount}/{habits.length}</Text>
            <Text style={styles.ringStatText}>Avg streak: {avgIdentity}d</Text>
          </View>
        </View>

        {/* Daily Momentum */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DAILY MOMENTUM</Text>
          <View style={styles.momentumCard}>
            {habits.slice(0, 3).map((habit) => (
              <View key={habit.id} style={styles.momentumRow}>
                <Text style={styles.momentumEmoji}>{habit.emoji}</Text>
                <Text style={styles.momentumName}>{habit.title}</Text>
                <View style={styles.momentumBarBg}>
                  <View style={[styles.momentumBarFill, { width: habit.completed_today ? '100%' : '0%', backgroundColor: CAT_COLORS[habit.category] || c.amber }]} />
                </View>
                <TouchableOpacity style={[styles.momentumCheck, habit.completed_today && { backgroundColor: c.amber, borderColor: c.amber }]} onPress={() => markDone(habit)}>
                  {habit.completed_today && <Ionicons name="checkmark" size={12} color="#080503" />}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* This Week vs Last */}
        <View style={styles.weekCompare}>
          <View style={styles.weekStat}>
            <Text style={styles.weekValue}>{thisWeekDone}</Text>
            <Text style={styles.weekLabel}>This week</Text>
          </View>
          <View style={styles.weekDelta}>
            <Text style={[styles.weekDeltaText, { color: weekDelta >= 0 ? c.teal : c.coral }]}>
              {weekDelta >= 0 ? '+' : ''}{weekDelta}
            </Text>
            <Text style={styles.weekDeltaLabel}>vs last</Text>
          </View>
          <View style={styles.weekStat}>
            <Text style={styles.weekValue}>{lastWeekDone}</Text>
            <Text style={styles.weekLabel}>Last week</Text>
          </View>
        </View>

        {/* Lumi Insight */}
        <View style={styles.insightCard}>
          <LumiFace mood="resting" size={24} />
          <Text style={styles.insightText}>{lumiInsight}</Text>
        </View>

        {/* Consistency This Month (grid) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>THIS MONTH</Text>
          <View style={styles.monthGrid}>
            {getMonthlyGrid().map((day, i) => (
              <View key={i} style={[styles.monthDot, { backgroundColor: day.strong ? c.amber : day.partial ? `${c.amber}60` : 'rgba(255,255,255,0.06)' }]} />
            ))}
          </View>
        </View>

        {/* All Habits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ALL HABITS</Text>
          {habits.map((habit) => {
            const heatmap = getHeatmap(habit);
            const isExpanded = expandedId === habit.id;
            return (
              <View key={habit.id} style={styles.habitCard}>
                <TouchableOpacity style={styles.habitRow} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setExpandedId(isExpanded ? null : habit.id); }} onLongPress={() => markDone(habit)}>
                  <Text style={styles.habitEmoji}>{habit.emoji}</Text>
                  <View style={styles.habitInfo}>
                    <Text style={[styles.habitName, habit.completed_today && { textDecorationLine: 'line-through', color: c.textMuted }]}>{habit.title}</Text>
                    {habit.identity_label && <Text style={styles.habitIdentity}>{habit.identity_label}</Text>}
                    <View style={[styles.categoryBadge, { backgroundColor: `${CAT_COLORS[habit.category] || c.amber}20` }]}>
                      <Text style={[styles.categoryText, { color: CAT_COLORS[habit.category] || c.amber }]}>{habit.category}</Text>
                    </View>
                  </View>
                  <Text style={styles.habitStreak}>{habit.streak} 🔥</Text>
                  <Text style={styles.habitConsistency}>{habit.consistency || 0}%</Text>
                  <TouchableOpacity style={[styles.checkBtn, habit.completed_today && { backgroundColor: c.amber, borderColor: c.amber }]} onPress={() => markDone(habit)}>
                    {habit.completed_today && <Ionicons name="checkmark" size={14} color="#080503" />}
                  </TouchableOpacity>
                </TouchableOpacity>

                {/* Expanded: 90-day heatmap */}
                {isExpanded && (
                  <View style={styles.expandedArea}>
                    <Text style={styles.heatmapTitle}>90-day history</Text>
                    <View style={styles.heatmap}>
                      {heatmap.map((done, i) => (
                        <View key={i} style={[styles.heatmapDot, { backgroundColor: done ? (CAT_COLORS[habit.category] || c.amber) : 'rgba(255,255,255,0.06)' }]} />
                      ))}
                    </View>
                    {/* Identity bar */}
                    <View style={styles.identityBar}>
                      <Text style={styles.identityLabel}>Identity: {habit.identity_label || 'None set'}</Text>
                      <Text style={styles.identityStreak}>🔥 {habit.streak} day streak</Text>
                    </View>
                    {/* Revival */}
                    {habit.revival_tokens > 0 && (
                      <TouchableOpacity style={styles.revivalBtn} onPress={() => setShowRevival(habit)}>
                        <Ionicons name="refresh" size={14} color={c.teal} />
                        <Text style={styles.revivalText}>🛡️ {habit.revival_tokens} revival tokens</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Identity Vote Modal */}
      <Modal visible={!!showIdentityVote} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>How strongly do you identify as someone who {showIdentityVote?.identity_label || showIdentityVote?.title}?</Text>
            <View style={styles.scoreGrid}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
                <TouchableOpacity key={s} style={[styles.scoreBtn, identityScore === s && { backgroundColor: c.amber, borderColor: c.amber }]} onPress={() => setIdentityScore(s)}>
                  <Text style={[styles.scoreText, identityScore === s && { color: '#080503' }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowIdentityVote(null)}>
                <Text style={styles.modalCancelText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={submitIdentityVote}>
                <Text style={styles.modalConfirmText}>Cast Vote</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reframe Modal */}
      <Modal visible={!!showReframe} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>You have a {showReframe?.streak}-day streak</Text>
            <Text style={styles.modalSub}>Skipping will break your chain. Are you sure?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => { try { apiClient.post(`/api/habits/${showReframe?.id}/skip`); } catch {} setShowReframe(null); }}>
                <Text style={styles.modalCancelText}>Take a rest day</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={() => { markDone(showReframe!); setShowReframe(null); }}>
                <Text style={styles.modalConfirmText}>I'll do it today</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Revival Modal */}
      <Modal visible={!!showRevival} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Use Revival Token?</Text>
            <Text style={styles.modalSub}>This will restore your streak for {showRevival?.title}. You have {showRevival?.revival_tokens} tokens remaining.</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowRevival(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={useRevival}>
                <Text style={styles.modalConfirmText}>Use Potion</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Habit Modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Habit</Text>
            <View style={styles.emojiRow}>
              {EMOJI_OPTIONS.map((e) => (
                <TouchableOpacity key={e} style={[styles.emojiBtn, newEmoji === e && { backgroundColor: 'rgba(200,149,92,0.2)', borderWidth: 2, borderColor: c.amber }]} onPress={() => setNewEmoji(e)}>
                  <Text style={styles.emojiText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.input} placeholder="Habit name" placeholderTextColor={c.textMuted} value={newTitle} onChangeText={setNewTitle} />
            <TextInput style={styles.input} placeholder="Identity label (e.g. 'I am a reader')" placeholderTextColor={c.textMuted} value={newIdentity} onChangeText={setNewIdentity} />
            <TextInput style={styles.input} placeholder="Accountability partner email" placeholderTextColor={c.textMuted} value={newPartner} onChangeText={setNewPartner} />
            <TextInput style={styles.input} placeholder="Stake (what you'll lose)" placeholderTextColor={c.textMuted} value={newStake} onChangeText={setNewStake} />
            <View style={styles.catChips}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity key={cat} style={[styles.catChip, newCategory === cat && { backgroundColor: CAT_COLORS[cat] || c.amber }]} onPress={() => setNewCategory(cat)}>
                  <Text style={[styles.catChipText, newCategory === cat && { color: '#080503' }]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowAdd(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirm, !newTitle.trim() && { opacity: 0.5 }]} onPress={addHabit} disabled={!newTitle.trim() || saving}>
                <Text style={styles.modalConfirmText}>{saving ? 'Adding...' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (c: ColorScheme) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '700', color: c.textPrimary },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  countText: { fontSize: 13, color: c.amber, fontWeight: '600' },
  addBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(200,149,92,0.12)', justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  ringCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: 14, padding: 16, marginBottom: 16, gap: 16 },
  ring: { width: 72, height: 72, borderRadius: 36, borderWidth: 6, borderColor: c.amber, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(200,149,92,0.08)' },
  ringPct: { fontSize: 20, fontWeight: '700', color: c.amber },
  ringLabel: { fontSize: 9, color: c.textMuted },
  ringStats: { flex: 1, gap: 4 },
  ringStatText: { fontSize: 12, color: c.textSecondary },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 10, fontWeight: '600', color: c.textMuted, letterSpacing: 0.5, marginBottom: 10 },
  momentumCard: { backgroundColor: c.card, borderRadius: 12, padding: 12 },
  momentumRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.border },
  momentumEmoji: { fontSize: 18 },
  momentumName: { flex: 1, fontSize: 13, color: c.textPrimary },
  momentumBarBg: { width: 60, height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
  momentumBarFill: { height: '100%', borderRadius: 3 },
  momentumCheck: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: c.border, justifyContent: 'center', alignItems: 'center' },
  weekCompare: { flexDirection: 'row', backgroundColor: c.card, borderRadius: 12, padding: 14, marginBottom: 12, gap: 12 },
  weekStat: { flex: 1, alignItems: 'center' },
  weekValue: { fontSize: 20, fontWeight: '700', color: c.textPrimary },
  weekLabel: { fontSize: 10, color: c.textMuted },
  weekDelta: { alignItems: 'center', justifyContent: 'center' },
  weekDeltaText: { fontSize: 20, fontWeight: '700' },
  weekDeltaLabel: { fontSize: 10, color: c.textMuted },
  insightCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(200,149,92,0.06)', borderRadius: 12, padding: 12, marginBottom: 16 },
  insightText: { flex: 1, fontSize: 12, color: c.textSecondary, lineHeight: 17 },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  monthDot: { width: 11, height: 11, borderRadius: 2 },
  habitCard: { backgroundColor: c.card, borderRadius: 12, marginBottom: 8, overflow: 'hidden' },
  habitRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  habitEmoji: { fontSize: 20 },
  habitInfo: { flex: 1 },
  habitName: { fontSize: 14, color: c.textPrimary },
  habitIdentity: { fontSize: 10, color: c.textMuted, marginTop: 1 },
  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginTop: 3 },
  categoryText: { fontSize: 9, fontWeight: '600' },
  habitStreak: { fontSize: 12, color: c.amber, fontWeight: '600' },
  habitConsistency: { fontSize: 11, color: c.textMuted },
  checkBtn: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: c.border, justifyContent: 'center', alignItems: 'center' },
  expandedArea: { paddingHorizontal: 12, paddingBottom: 12, borderTopWidth: 1, borderTopColor: c.border },
  heatmapTitle: { fontSize: 10, color: c.textMuted, marginBottom: 6 },
  heatmap: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  heatmapDot: { width: 8, height: 8, borderRadius: 1 },
  identityBar: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  identityLabel: { fontSize: 11, color: c.textSecondary },
  identityStreak: { fontSize: 11, color: c.amber, fontWeight: '600' },
  revivalBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  revivalText: { fontSize: 11, color: c.teal },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: c.surface, borderRadius: 16, padding: 20, width: '100%', maxWidth: 360 },
  modalTitle: { fontSize: 16, fontWeight: '600', color: c.textPrimary, marginBottom: 8, textAlign: 'center' },
  modalSub: { fontSize: 13, color: c.textSecondary, textAlign: 'center', marginBottom: 16, lineHeight: 18 },
  scoreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16, justifyContent: 'center' },
  scoreBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: c.border, justifyContent: 'center', alignItems: 'center' },
  scoreText: { fontSize: 16, fontWeight: '600', color: c.textPrimary },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: c.card, alignItems: 'center' },
  modalCancelText: { fontSize: 13, color: c.textSecondary },
  modalConfirm: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: c.amber, alignItems: 'center' },
  modalConfirmText: { fontSize: 13, fontWeight: '600', color: '#080503' },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  emojiBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.card, justifyContent: 'center', alignItems: 'center' },
  emojiText: { fontSize: 20 },
  input: { backgroundColor: c.card, borderRadius: 10, padding: 12, color: c.textPrimary, fontSize: 14, marginBottom: 10 },
  catChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: c.card },
  catChipText: { fontSize: 11, color: c.textSecondary },
  bottomPadding: { height: 40 },
});
