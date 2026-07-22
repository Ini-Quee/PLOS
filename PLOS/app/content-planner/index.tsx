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

type ViewMode = 'list' | 'calendar';
type Status = 'scheduled' | 'posted' | 'cancelled';

interface ContentPost {
  id: string;
  platform: string;
  category: string;
  title: string;
  content: string;
  scheduled_date: string;
  scheduled_time: string;
  media_url: string;
  status: Status;
}

const PLATFORMS = ['Instagram', 'Twitter/X', 'LinkedIn', 'TikTok', 'Facebook', 'Blog', 'Email', 'YouTube'];

const PLATFORM_ICONS: Record<string, string> = {
  'Instagram': '📷',
  'Twitter/X': '🐦',
  'LinkedIn': '💼',
  'TikTok': '🎵',
  'Facebook': '📘',
  'Blog': '✍️',
  'Email': '📧',
  'YouTube': '🎬',
};

const PLATFORM_COLORS: Record<string, string> = {
  'Instagram': '#E05252',
  'Twitter/X': '#7AAEE8',
  'LinkedIn': '#5A8EC8',
  'TikTok': '#9B7FD4',
  'Facebook': '#4A6FA5',
  'Blog': '#D4A06A',
  'Email': '#5BA88A',
  'YouTube': '#E05252',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ContentPlannerScreen() {
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<Status | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [saving, setSaving] = useState(false);

  // Schedule form
  const [newPlatform, setNewPlatform] = useState('Instagram');
  const [newCategory, setNewCategory] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newMediaUrl, setNewMediaUrl] = useState('');

  // Calendar
  const [calDate, setCalDate] = useState(new Date());

  const fetchPosts = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/content/posts');
      setPosts(res.data?.posts || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);
  const onRefresh = () => { setRefreshing(true); fetchPosts(); };

  const filteredPosts = posts.filter((p) => {
    if (platformFilter && p.platform !== platformFilter) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    return true;
  });

  // Group by date for list view
  const groupedPosts = filteredPosts.reduce<Record<string, ContentPost[]>>((acc, post) => {
    const date = post.scheduled_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(post);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedPosts).sort();

  // Calendar
  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const getDateString = (day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const getPostCountForDate = (dateStr: string) =>
    posts.filter((p) => p.scheduled_date === dateStr).length;

  const schedulePost = async () => {
    if (!newTitle.trim() || !newDate) return;
    setSaving(true);
    try {
      await apiClient.post('/api/content/posts', {
        platform: newPlatform,
        category: newCategory,
        title: newTitle.trim(),
        content: newContent.trim(),
        scheduled_date: newDate,
        scheduled_time: newTime,
        media_url: newMediaUrl,
      });
      resetForm();
      setShowSchedule(false);
      fetchPosts();
    } catch (err) {
      console.error('Error scheduling post:', err);
    }
    setSaving(false);
  };

  const resetForm = () => {
    setNewPlatform('Instagram');
    setNewCategory('');
    setNewTitle('');
    setNewContent('');
    setNewDate('');
    setNewTime('');
    setNewMediaUrl('');
  };

  const lumiImport = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await apiClient.post('/api/content/import');
      fetchPosts();
    } catch (err) {
      console.error('Error importing:', err);
    }
  };

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

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
        <Text style={styles.title}>Content Planner</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.lumiBtn} onPress={lumiImport}>
            <Ionicons name="sparkles" size={16} color={Colors.amber} />
            <Text style={styles.lumiBtnText}>Lumi Import</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowSchedule(true)}>
            <Ionicons name="add" size={22} color={Colors.amber} />
          </TouchableOpacity>
        </View>
      </View>

      {/* View Toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity style={[styles.toggleBtn, viewMode === 'list' && styles.toggleActive]} onPress={() => setViewMode('list')}>
          <Ionicons name="list" size={16} color={viewMode === 'list' ? '#080503' : Colors.textSecondary} />
          <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>List</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toggleBtn, viewMode === 'calendar' && styles.toggleActive]} onPress={() => setViewMode('calendar')}>
          <Ionicons name="calendar" size={16} color={viewMode === 'calendar' ? '#080503' : Colors.textSecondary} />
          <Text style={[styles.toggleText, viewMode === 'calendar' && styles.toggleTextActive]}>Calendar</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        <TouchableOpacity style={[styles.filterChip, !statusFilter && styles.filterActive]} onPress={() => setStatusFilter(null)}>
          <Text style={[styles.filterText, !statusFilter && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        {(['scheduled', 'posted', 'cancelled'] as Status[]).map((s) => (
          <TouchableOpacity key={s} style={[styles.filterChip, statusFilter === s && styles.filterActive]} onPress={() => setStatusFilter(statusFilter === s ? null : s)}>
            <Text style={[styles.filterText, statusFilter === s && styles.filterTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
        <View style={styles.filterDivider} />
        {PLATFORMS.map((p) => (
          <TouchableOpacity key={p} style={[styles.filterChip, platformFilter === p && { backgroundColor: PLATFORM_COLORS[p] }]} onPress={() => setPlatformFilter(platformFilter === p ? null : p)}>
            <Text style={styles.filterText}>{PLATFORM_ICONS[p]} {p}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.amber} />}
      >
        {viewMode === 'list' ? (
          sortedDates.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No posts scheduled</Text>
              <Text style={styles.emptyText}>Tap + to schedule content</Text>
            </View>
          ) : (
            sortedDates.map((date) => (
              <View key={date} style={styles.dateGroup}>
                <Text style={styles.dateLabel}>
                  {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
                {groupedPosts[date].map((post) => (
                  <View key={post.id} style={styles.postCard}>
                    <Text style={styles.postPlatform}>{PLATFORM_ICONS[post.platform] || '📱'}</Text>
                    <View style={styles.postInfo}>
                      <Text style={styles.postTitle}>{post.title}</Text>
                      <Text style={styles.postMeta}>{post.platform} · {post.scheduled_time || 'No time'}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: post.status === 'scheduled' ? 'rgba(200,149,92,0.15)' : post.status === 'posted' ? 'rgba(75,175,125,0.15)' : 'rgba(224,82,82,0.15)' }]}>
                      <Text style={[styles.statusText, { color: post.status === 'scheduled' ? Colors.amber : post.status === 'posted' ? Colors.green : Colors.coral }]}>{post.status}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))
          )
        ) : (
          <>
            {/* Calendar View */}
            <View style={styles.calNav}>
              <TouchableOpacity onPress={() => setCalDate(new Date(year, month - 1, 1))}>
                <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.calMonth}>{calDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
              <TouchableOpacity onPress={() => setCalDate(new Date(year, month + 1, 1))}>
                <Ionicons name="chevron-forward" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.calDayHeaders}>
              {DAYS.map((d) => <Text key={d} style={styles.calDayHeader}>{d}</Text>)}
            </View>
            <View style={styles.calGrid}>
              {calendarDays.map((day, i) => {
                if (day === null) return <View key={i} style={styles.calEmpty} />;
                const dateStr = getDateString(day);
                const count = getPostCountForDate(dateStr);
                return (
                  <View key={i} style={styles.calCell}>
                    <Text style={styles.calDayText}>{day}</Text>
                    {count > 0 && (
                      <View style={[styles.calBadge, { backgroundColor: Colors.amber }]}>  
                        <Text style={styles.calBadgeText}>{count}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </>
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Schedule Post Modal */}
      <Modal visible={showSchedule} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Schedule Post</Text>

            <Text style={styles.fieldLabel}>Platform</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.platformScroll}>
              {PLATFORMS.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.platformChip, newPlatform === p && { backgroundColor: PLATFORM_COLORS[p] }]}
                  onPress={() => setNewPlatform(p)}
                >
                  <Text style={[styles.platformChipText, newPlatform === p && { color: '#fff' }]}>
                    {PLATFORM_ICONS[p]} {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput style={styles.input} placeholder="Category" placeholderTextColor={Colors.textMuted} value={newCategory} onChangeText={setNewCategory} />
            <TextInput style={styles.input} placeholder="Title" placeholderTextColor={Colors.textMuted} value={newTitle} onChangeText={setNewTitle} />
            <TextInput style={[styles.input, { minHeight: 60 }]} placeholder="Content" placeholderTextColor={Colors.textMuted} value={newContent} onChangeText={setNewContent} multiline />
            <View style={styles.dateRow}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Date (YYYY-MM-DD)" placeholderTextColor={Colors.textMuted} value={newDate} onChangeText={setNewDate} />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Time (HH:MM)" placeholderTextColor={Colors.textMuted} value={newTime} onChangeText={setNewTime} />
            </View>
            <TextInput style={styles.input} placeholder="Media URL (optional)" placeholderTextColor={Colors.textMuted} value={newMediaUrl} onChangeText={setNewMediaUrl} />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => { resetForm(); setShowSchedule(false); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSave, (!newTitle.trim() || !newDate) && { opacity: 0.5 }]} onPress={schedulePost} disabled={!newTitle.trim() || !newDate || saving}>
                <Text style={styles.modalSaveText}>{saving ? 'Scheduling...' : 'Schedule'}</Text>
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
  headerActions: { flexDirection: 'row', gap: 8 },
  lumiBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(200,149,92,0.12)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  lumiBtnText: { fontSize: Typography.micro.fontSize, color: Colors.amber, fontWeight: '600' },
  addBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(200,149,92,0.12)', justifyContent: 'center', alignItems: 'center' },
  toggleRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.card },
  toggleActive: { backgroundColor: Colors.amber },
  toggleText: { fontSize: Typography.caption.fontSize, color: Colors.textSecondary, fontWeight: '600' },
  toggleTextActive: { color: '#080503' },
  filterScroll: { maxHeight: 40, marginBottom: 12 },
  filterContent: { paddingHorizontal: 20, gap: 6 },
  filterChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: Colors.card },
  filterActive: { backgroundColor: Colors.amber },
  filterText: { fontSize: Typography.micro.fontSize, color: Colors.textSecondary },
  filterTextActive: { color: '#080503', fontWeight: '600' },
  filterDivider: { width: 1, backgroundColor: Colors.border },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: Typography.subtitle.fontSize, fontWeight: '600', color: Colors.textPrimary },
  emptyText: { fontSize: Typography.caption.fontSize, color: Colors.textMuted },
  dateGroup: { marginBottom: 16 },
  dateLabel: { fontSize: Typography.micro.fontSize, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  postCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 12, padding: 12, gap: 10, marginBottom: 6 },
  postPlatform: { fontSize: 20 },
  postInfo: { flex: 1 },
  postTitle: { fontSize: Typography.caption.fontSize, fontWeight: '600', color: Colors.textPrimary },
  postMeta: { fontSize: Typography.micro.fontSize, color: Colors.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 9, fontWeight: '600', textTransform: 'capitalize' },
  calNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  calMonth: { fontSize: Typography.subtitle.fontSize, fontWeight: '600', color: Colors.textPrimary },
  calDayHeaders: { flexDirection: 'row', marginBottom: 8 },
  calDayHeader: { flex: 1, textAlign: 'center', fontSize: Typography.micro.fontSize, color: Colors.textMuted, fontWeight: '600' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calEmpty: { width: '14.28%', aspectRatio: 1 },
  calCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
  calDayText: { fontSize: Typography.caption.fontSize, color: Colors.textPrimary },
  calBadge: { position: 'absolute', top: 2, right: 4, width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  calBadgeText: { fontSize: 8, fontWeight: '700', color: '#080503' },
  bottomPadding: { height: 80 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 10, maxHeight: '85%' },
  modalTitle: { fontSize: Typography.subtitle.fontSize, fontWeight: Typography.subtitle.fontWeight, color: Colors.textPrimary, marginBottom: 4 },
  fieldLabel: { fontSize: Typography.micro.fontSize, fontWeight: '600', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  platformScroll: { maxHeight: 36 },
  platformChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: Colors.card, marginRight: 6 },
  platformChipText: { fontSize: Typography.micro.fontSize, color: Colors.textSecondary },
  input: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, color: Colors.textPrimary, fontSize: Typography.body.fontSize },
  dateRow: { flexDirection: 'row', gap: 10 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  modalCancel: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: Colors.card, alignItems: 'center' },
  modalCancelText: { fontSize: Typography.body.fontSize, color: Colors.textSecondary },
  modalSave: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: Colors.amber, alignItems: 'center' },
  modalSaveText: { fontSize: Typography.body.fontSize, fontWeight: '600', color: '#080503' },
});
