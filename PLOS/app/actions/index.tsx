import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import apiClient from '../../services/api';

type ActionType = 'task' | 'meeting' | 'goal';

interface ActionItem {
  id: string;
  title: string;
  type: ActionType;
  description: string;
  journal_date: string;
  status: 'pending' | 'completed' | 'dismissed';
}

const TYPE_CONFIG: Record<ActionType, { icon: string; color: string }> = {
  task: { icon: 'checkmark-circle', color: '#4CAF7D' },
  meeting: { icon: 'calendar', color: '#7AAEE8' },
  goal: { icon: 'flag', color: '#D4A06A' },
};

export default function ActionsScreen() {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActions = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/actions');
      setActions(res.data?.actions || []);
    } catch (err) {
      console.error('Error fetching actions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchActions(); }, [fetchActions]);
  const onRefresh = () => { setRefreshing(true); fetchActions(); };

  const pendingActions = actions.filter((a) => a.status === 'pending');

  const completeAction = async (action: ActionItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await apiClient.put(`/api/actions/${action.id}`, { status: 'completed' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setActions((prev) => prev.map((a) => a.id === action.id ? { ...a, status: 'completed' } : a));
    } catch (err) {
      console.error('Error completing action:', err);
    }
  };

  const dismissAction = async (action: ActionItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await apiClient.put(`/api/actions/${action.id}`, { status: 'dismissed' });
      setActions((prev) => prev.map((a) => a.id === action.id ? { ...a, status: 'dismissed' } : a));
    } catch (err) {
      console.error('Error dismissing action:', err);
    }
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Action Items</Text>
        <Text style={styles.countText}>{pendingActions.length} pending</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.amber} />}
      >
        {pendingActions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-circle-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptyText}>No pending action items from your journal</Text>
          </View>
        ) : (
          pendingActions.map((action) => {
            const config = TYPE_CONFIG[action.type];
            return (
              <View key={action.id} style={styles.actionCard}>
                <View style={styles.actionHeader}>
                  <View style={[styles.typeIcon, { backgroundColor: `${config.color}20` }]}>
                    <Ionicons name={config.icon as any} size={18} color={config.color} />
                  </View>
                  <View style={styles.actionInfo}>
                    <Text style={styles.actionTitle}>{action.title}</Text>
                    <View style={styles.actionMeta}>
                      <View style={[styles.typeBadge, { backgroundColor: `${config.color}15` }]}>
                        <Text style={[styles.typeText, { color: config.color }]}>{action.type}</Text>
                      </View>
                      <Text style={styles.journalDate}>Journal: {action.journal_date}</Text>
                    </View>
                  </View>
                </View>
                {action.description ? (
                  <Text style={styles.actionDesc}>{action.description}</Text>
                ) : null}
                <View style={styles.actionActions}>
                  <TouchableOpacity style={styles.completeBtn} onPress={() => completeAction(action)}>
                    <Ionicons name="checkmark" size={14} color="#080503" />
                    <Text style={styles.completeBtnText}>Complete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dismissBtn} onPress={() => dismissAction(action)}>
                    <Ionicons name="close" size={14} color={Colors.textSecondary} />
                    <Text style={styles.dismissBtnText}>Dismiss</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
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
  countText: { fontSize: Typography.caption.fontSize, color: Colors.amber, fontWeight: '600' },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: Typography.subtitle.fontSize, fontWeight: '600', color: Colors.textPrimary },
  emptyText: { fontSize: Typography.caption.fontSize, color: Colors.textMuted },
  actionCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 14, marginBottom: 10 },
  actionHeader: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  typeIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  actionInfo: { flex: 1 },
  actionTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 4 },
  actionMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  typeText: { fontSize: 9, fontWeight: '600', textTransform: 'capitalize' },
  journalDate: { fontSize: Typography.micro.fontSize, color: Colors.textMuted },
  actionDesc: { fontSize: Typography.caption.fontSize, color: Colors.textSecondary, lineHeight: 18, marginBottom: 10 },
  actionActions: { flexDirection: 'row', gap: 8 },
  completeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.amber, paddingVertical: 10, borderRadius: 10 },
  completeBtnText: { fontSize: Typography.caption.fontSize, fontWeight: '600', color: '#080503' },
  dismissBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.card, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  dismissBtnText: { fontSize: Typography.caption.fontSize, fontWeight: '600', color: Colors.textSecondary },
  bottomPadding: { height: 80 },
});
