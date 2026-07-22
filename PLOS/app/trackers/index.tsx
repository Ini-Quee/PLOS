import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView,
  RefreshControl, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import apiClient from '../../services/api';

type TrackerType = 'open_chain' | 'fixed_challenge' | 'count_toward_goal';

interface Tracker {
  id: string;
  emoji: string;
  title: string;
  type: TrackerType;
  target_days: number;
  color: string;
  streak: number;
  completions: string[];
  revival_tokens: number;
  created_at: string;
}

const TRACKER_TYPES: { key: TrackerType; label: string }[] = [
  { key: 'open_chain', label: 'Open Chain' },
  { key: 'fixed_challenge', label: 'Fixed Challenge' },
  { key: 'count_toward_goal', label: 'Count Toward Goal' },
];

const COLOR_OPTIONS = ['#C8955C', '#9B7FD4', '#5BA88A', '#7ABFB8', '#7AAEE8', '#D4A06A', '#E05252', '#4CAF7D'];

const EMOJI_OPTIONS = ['🔥', '💧', '📖', '💪', '🙏', '🧘', '✍️', '🏃', '💤', '🎯', '💰', '🧠', '🏋️', '🎵', '🌱', '⭐'];

export default function TrackersScreen() {
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTracker, setSelectedTracker] = useState<Tracker | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  // Add form
  const [newEmoji, setNewEmoji] = useState('🔥');
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<TrackerType>('open_chain');
  const [newTargetDays, setNewTargetDays] = useState('30');
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[0]);

  const fetchTrackers = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/trackers');
      setTrackers(res.data?.trackers || []);
    } catch (err) {
      console.error('Error fetching trackers:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchTrackers(); }, [fetchTrackers]);
  const onRefresh = () => { setRefreshing(true); fetchTrackers(); };

  const getMiniWeek = (completions: string[]) => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - 6 + i);
      const dateStr = d.toISOString().slice(0, 10);
      return completions?.includes(dateStr) || false;
    });
  };

  const getHeatmap = (completions: string[]) => {
    const today = new Date();
    return Array.from({ length: 98 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - 97 + i);
      return completions?.includes(d.toISOString().slice(0, 10)) || false;
    });
  };

  const markTodayDone = async (tracker: Tracker) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await apiClient.post(`/api/trackers/${tracker.id}/complete`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      fetchTrackers();
      setSelectedTracker(null);
    } catch (err) {
      console.error('Error marking done:', err);
    }
  };

  const useRevival = async (tracker: Tracker) => {
    try {
      await apiClient.post(`/api/trackers/${tracker.id}/revive`);
      fetchTrackers();
      setSelectedTracker(null);
    } catch (err) {
      console.error('Error using revival:', err);
    }
  };

  const addTracker = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      await apiClient.post('/api/trackers', {
        emoji: newEmoji,
        title: newTitle.trim(),
        type: newType,
        target_days: parseInt(newTargetDays) || 30,
        color: newColor,
      });
      setNewTitle('');
      setNewEmoji('🔥');
      setNewType('open_chain');
      setNewTargetDays('30');
      setNewColor(COLOR_OPTIONS[0]);
      setShowAdd(false);
      fetchTrackers();
    } catch (err) {
      console.error('Error adding tracker:', err);
    }
    setSaving(false);
  };

  const getTypeLabel = (type: TrackerType) =>
    TRACKER_TYPES.find((t) => t.key === type)?.label || type;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.amber} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trackers</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={22} color={Colors.amber} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.amber} />}
      >
        {trackers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="pulse-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No trackers yet</Text>
            <Text style={styles.emptyText}>Create a tracker to start building streaks</Text>
          </View>
        ) : (
          trackers.map((tracker) => {
            const week = getMiniWeek(tracker.completions);
            const todayDone = week[6];
            return (
              <TouchableOpacity
                key={tracker.id}
                style={styles.trackerCard}
                onPress={() => setSelectedTracker(tracker)}
                activeOpacity={0.7}
              >
                <Text style={styles.trackerEmoji}>{tracker.emoji}</Text>
                <View style={styles.trackerInfo}>
                  <Text style={styles.trackerTitle}>{tracker.title}</Text>
                  <View style={[styles.typeBadge, { backgroundColor: `${tracker.color}20` }]}>
                    <Text style={[styles.typeText, { color: tracker.color }]}>{getTypeLabel(tracker.type)}</Text>
                  </View>
                </View>
                <View style={styles.streakContainer}>
                  <Text style={styles.streakCount}>{tracker.streak}</Text>
                  <Text style={styles.streakLabel}>🔥</Text>
                </View>
                <View style={styles.miniWeek}>
                  {week.map((done, i) => (
                    <View
                      key={i}
                      style={[styles.miniDay, { backgroundColor: done ? tracker.color : 'rgba(255,255,255,0.06)' }]}
                    />
                  ))}
                </View>
                {!todayDone && (
                  <TouchableOpacity
                    style={[styles.quickCheck, { borderColor: tracker.color }]}
                    onPress={() => markTodayDone(tracker)}
                  >
                    <Ionicons name="checkmark" size={14} color={tracker.color} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={!!selectedTracker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.detailModal}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailEmoji}>{selectedTracker?.emoji}</Text>
              <Text style={styles.detailTitle}>{selectedTracker?.title}</Text>
              <TouchableOpacity onPress={() => setSelectedTracker(null)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.typeBadgeLarge, { backgroundColor: `${selectedTracker?.color}20` }]}>
              <Text style={[styles.typeTextLarge, { color: selectedTracker?.color }]}>
                {selectedTracker && getTypeLabel(selectedTracker.type)}
              </Text>
            </View>

            <Text style={styles.detailStreak}>🔥 {selectedTracker?.streak} day streak</Text>

            <Text style={styles.heatmapLabel}>14-week heatmap</Text>
            <View style={styles.heatmapGrid}>
              {selectedTracker && getHeatmap(selectedTracker.completions).map((done, i) => (
                <View
                  key={i}
                  style={[styles.heatmapDot, { backgroundColor: done ? selectedTracker.color : 'rgba(255,255,255,0.06)' }]}
                />
              ))}
            </View>

            <View style={styles.detailActions}>
              <TouchableOpacity
                style={[styles.markDoneBtn, { backgroundColor: selectedTracker?.color || Colors.amber }]}
                onPress={() => selectedTracker && markTodayDone(selectedTracker)}
              >
                <Ionicons name="checkmark-circle" size={18} color="#080503" />
                <Text style={styles.markDoneText}>Mark Today Done</Text>
              </TouchableOpacity>

              {selectedTracker && selectedTracker.revival_tokens > 0 && (
                <TouchableOpacity
                  style={styles.revivalBtn}
                  onPress={() => selectedTracker && useRevival(selectedTracker)}
                >
                  <Ionicons name="refresh" size={16} color={Colors.teal} />
                  <Text style={styles.revivalText}>🛡️ {selectedTracker.revival_tokens} Revival Tokens</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Tracker Modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.addModal}>
            <Text style={styles.modalTitle}>New Tracker</Text>

            <Text style={styles.fieldLabel}>Emoji</Text>
            <View style={styles.emojiRow}>
              {EMOJI_OPTIONS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiBtn, newEmoji === e && { backgroundColor: 'rgba(200,149,92,0.2)', borderWidth: 2, borderColor: Colors.amber }]}
                  onPress={() => setNewEmoji(e)}
                >
                  <Text style={styles.emojiText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Tracker title"
              placeholderTextColor={Colors.textMuted}
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.typeRow}>
              {TRACKER_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.typeChip, newType === t.key && { backgroundColor: Colors.amber }]}
                  onPress={() => setNewType(t.key)}
                >
                  <Text style={[styles.typeChipText, newType === t.key && { color: '#080503' }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Target days (e.g. 30)"
              placeholderTextColor={Colors.textMuted}
              value={newTargetDays}
              onChangeText={setNewTargetDays}
              keyboardType="numeric"
            />

            <Text style={styles.fieldLabel}>Color</Text>
            <View style={styles.colorRow}>
              {COLOR_OPTIONS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorBtn, { backgroundColor: c }, newColor === c && styles.colorBtnActive]}
                  onPress={() => setNewColor(c)}
                />
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowAdd(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSave, !newTitle.trim() && { opacity: 0.5 }]}
                onPress={addTracker}
                disabled={!newTitle.trim() || saving}
              >
                <Text style={styles.modalSaveText}>{saving ? 'Adding...' : 'Create Tracker'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: Typography.title.fontSize, fontWeight: Typography.title.fontWeight, color: Colors.textPrimary },
  addBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(200,149,92,0.12)', justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: Typography.subtitle.fontSize, fontWeight: '600', color: Colors.textPrimary },
  emptyText: { fontSize: Typography.caption.fontSize, color: Colors.textMuted },
  trackerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 14, padding: 14, marginBottom: 10, gap: 12 },
  trackerEmoji: { fontSize: 24 },
  trackerInfo: { flex: 1 },
  trackerTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
  typeText: { fontSize: 9, fontWeight: '600' },
  streakContainer: { alignItems: 'center' },
  streakCount: { fontSize: 18, fontWeight: '700', color: Colors.amber },
  streakLabel: { fontSize: 10 },
  miniWeek: { flexDirection: 'row', gap: 3 },
  miniDay: { width: 8, height: 8, borderRadius: 2 },
  quickCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  bottomPadding: { height: 80 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  detailModal: { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 14 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailEmoji: { fontSize: 32 },
  detailTitle: { flex: 1, fontSize: Typography.subtitle.fontSize, fontWeight: '600', color: Colors.textPrimary },
  typeBadgeLarge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  typeTextLarge: { fontSize: Typography.caption.fontSize, fontWeight: '600' },
  detailStreak: { fontSize: Typography.body.fontSize, fontWeight: '600', color: Colors.amber },
  heatmapLabel: { fontSize: Typography.micro.fontSize, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  heatmapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  heatmapDot: { width: 10, height: 10, borderRadius: 2 },
  detailActions: { gap: 10, marginTop: 4 },
  markDoneBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12 },
  markDoneText: { fontSize: Typography.body.fontSize, fontWeight: '600', color: '#080503' },
  revivalBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12, backgroundColor: Colors.card },
  revivalText: { fontSize: Typography.caption.fontSize, color: Colors.teal, fontWeight: '600' },
  addModal: { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 12 },
  modalTitle: { fontSize: Typography.subtitle.fontSize, fontWeight: Typography.subtitle.fontWeight, color: Colors.textPrimary, marginBottom: 4 },
  fieldLabel: { fontSize: Typography.micro.fontSize, fontWeight: '600', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.card, justifyContent: 'center', alignItems: 'center' },
  emojiText: { fontSize: 20 },
  input: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, color: Colors.textPrimary, fontSize: Typography.body.fontSize },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeChip: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.card, alignItems: 'center' },
  typeChipText: { fontSize: Typography.micro.fontSize, color: Colors.textSecondary, fontWeight: '600' },
  colorRow: { flexDirection: 'row', gap: 10 },
  colorBtn: { width: 32, height: 32, borderRadius: 16 },
  colorBtnActive: { borderWidth: 3, borderColor: Colors.white },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  modalCancel: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: Colors.card, alignItems: 'center' },
  modalCancelText: { fontSize: Typography.body.fontSize, color: Colors.textSecondary },
  modalSave: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: Colors.amber, alignItems: 'center' },
  modalSaveText: { fontSize: Typography.body.fontSize, fontWeight: '600', color: '#080503' },
});
