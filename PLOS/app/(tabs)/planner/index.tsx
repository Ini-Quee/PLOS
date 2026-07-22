import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Typography } from '../../../constants/typography';
import { useThemeColors } from '../../../contexts/ThemeContext';
import type { ColorScheme } from '../../../constants/colors';
import apiClient from '../../../services/api';
import { LumiFace, ModeToggle } from '../../../components';

type Tab = 'today' | 'week' | 'plans';

interface ScheduleItem {
  id: string;
  title: string;
  description: string;
  category: string;
  start_time: string;
  end_time: string;
  repeat_pattern: string;
  repeat_days: number[];
  target_date: string;
  is_high_priority: boolean;
  is_locked: boolean;
  reminder_minutes: number | null;
  completed?: boolean;
}

const TIME_SECTIONS = [
  { key: 'morning_routine', label: 'Morning Routine', start: '05:00', end: '07:00' },
  { key: 'morning', label: 'Morning', start: '07:00', end: '10:00' },
  { key: 'mid_morning', label: 'Mid-Morning', start: '10:00', end: '12:00' },
  { key: 'afternoon', label: 'Afternoon', start: '12:00', end: '15:00' },
  { key: 'late_afternoon', label: 'Late Afternoon', start: '15:00', end: '17:00' },
  { key: 'evening', label: 'Evening', start: '17:00', end: '20:00' },
  { key: 'night', label: 'Night', start: '20:00', end: '23:59' },
];

const CAT_COLORS: Record<string, string> = {
  spiritual: '#a5b4fc',
  health: '#6ee7b7',
  meal: '#fbbf24',
  work: '#2dd4bf',
  social: '#f9a8d4',
  sleep: '#93c5fd',
  personal: '#c4b5fd',
};

const REMINDER_OPTIONS = [
  { label: 'Off', value: null },
  { label: '5 min', value: 5 },
  { label: '10 min', value: 10 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hr', value: 60 },
];

export default function PlannerScreen() {
  const router = useRouter();
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLumiPanel, setShowLumiPanel] = useState(false);
  const [lumiInput, setLumiInput] = useState('');
  const [lumiResponse, setLumiResponse] = useState('');
  const [showReminder, setShowReminder] = useState<string | null>(null);
  const [isNight, setIsNight] = useState(false);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'Week' },
    { key: 'plans', label: 'My Plans' },
  ];

  const fetchData = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/schedule');
      setSchedules(res.data?.schedules || []);
    } catch (err) {
      console.error('Error fetching schedules:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const hour = new Date().getHours();
    setIsNight(hour >= 21);
  }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

  // Get today's items
  const todayItems = schedules.filter((s) => {
    if (s.repeat_pattern === 'daily') return true;
    if (s.repeat_pattern === 'weekdays') { const dow = now.getDay(); return dow >= 1 && dow <= 5; }
    if (s.repeat_pattern === 'weekly' || s.repeat_pattern === 'custom') return Array.isArray(s.repeat_days) && s.repeat_days.includes(now.getDay());
    if (s.repeat_pattern === 'none') return s.target_date === now.toISOString().slice(0, 10);
    return false;
  }).sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

  // Group by time section
  const getSection = (time: string) => {
    const t = time?.slice(0, 5) || '00:00';
    for (const section of TIME_SECTIONS) {
      if (t >= section.start && t < section.end) return section.key;
    }
    return 'night';
  };

  const groupedToday = TIME_SECTIONS.map((section) => ({
    ...section,
    items: todayItems.filter((s) => getSection(s.start_time) === section.key),
  })).filter((s) => s.items.length > 0);

  // Week days
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - now.getDay() + i);
    return { name: dayNames[d.getDay()], num: d.getDate(), today: d.toDateString() === now.toDateString(), dateStr: d.toISOString().slice(0, 10), dayIndex: i };
  });

  const getEntriesForDay = (dayIndex: number, dateStr: string) => {
    return schedules.filter((s) => {
      if (s.is_high_priority) return true;
      if (s.repeat_pattern === 'none') return s.target_date === dateStr;
      if (s.repeat_pattern === 'daily') return true;
      if (s.repeat_pattern === 'weekdays') return dayIndex >= 1 && dayIndex <= 5;
      if (s.repeat_pattern === 'weekly' || s.repeat_pattern === 'custom') return Array.isArray(s.repeat_days) && s.repeat_days.includes(dayIndex);
      return false;
    }).sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
  };

  // Completion stats
  const completedToday = todayItems.filter((s) => s.completed).length;
  const totalToday = todayItems.length;
  const pctDone = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  const toggleComplete = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSchedules((prev) => prev.map((s) => s.id === id ? { ...s, completed: !s.completed } : s));
    try { await apiClient.post(`/api/schedule/${id}/complete`); } catch { fetchData(); }
  };

  const toggleLock = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSchedules((prev) => prev.map((s) => s.id === id ? { ...s, is_locked: !s.is_locked } : s));
    try { await apiClient.patch(`/api/schedule/${id}`, { is_locked: !schedules.find(s => s.id === id)?.is_locked }); } catch { fetchData(); }
  };

  const setReminder = async (id: string, minutes: number | null) => {
    setShowReminder(null);
    setSchedules((prev) => prev.map((s) => s.id === id ? { ...s, reminder_minutes: minutes } : s));
    try { await apiClient.patch(`/api/schedule/${id}/reminder`, { reminder_minutes: minutes }); } catch { fetchData(); }
  };

  const sendToLumi = async () => {
    if (!lumiInput.trim()) return;
    const input = lumiInput.trim();
    setLumiInput('');
    setLumiResponse('Thinking...');
    try {
      const res = await apiClient.post('/api/lumi/chat', { text: input });
      setLumiResponse(res.data?.message || res.data?.response || 'Done!');
    } catch { setLumiResponse('Could not reach Lumi.'); }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={c.amber} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Planner</Text>
        <TouchableOpacity style={styles.lumiBtn} onPress={() => setShowLumiPanel(true)}>
          <LumiFace mood="resting" size={28} />
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity key={tab.key} style={[styles.tab, activeTab === tab.key && styles.tabActive]} onPress={() => setActiveTab(tab.key)}>
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Night Banner */}
      {isNight && activeTab === 'today' && (
        <TouchableOpacity style={styles.nightBanner} onPress={() => setShowLumiPanel(true)}>
          <Text style={styles.nightText}>🌙 Plan tomorrow with Lumi?</Text>
          <Ionicons name="arrow-forward" size={16} color={c.amber} />
        </TouchableOpacity>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.amber} />}
      >
        {/* TODAY TAB */}
        {activeTab === 'today' && (
          <>
            {/* Progress Ring */}
            <View style={styles.progressCard}>
              <View style={styles.progressRing}>
                <Text style={styles.progressPct}>{pctDone}%</Text>
                <Text style={styles.progressLabel}>done</Text>
              </View>
              <View style={styles.progressStats}>
                <View style={styles.statBadge}>
                  <Text style={styles.statText}>{completedToday} / {totalToday} done</Text>
                </View>
                <View style={styles.statBadge}>
                  <Text style={styles.statText}>{todayItems.filter(s => s.is_locked).length} locked</Text>
                </View>
              </View>
            </View>

            {/* Time Sections */}
            {groupedToday.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📅</Text>
                <Text style={styles.emptyTitle}>Your day is open</Text>
                <Text style={styles.emptyText}>No routines scheduled. Talk to Lumi to build your day.</Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowLumiPanel(true)}>
                  <Text style={styles.emptyBtnText}>✨ Plan with Lumi</Text>
                </TouchableOpacity>
              </View>
            ) : (
              groupedToday.map((section) => (
                <View key={section.key} style={styles.section}>
                  <Text style={styles.sectionLabel}>{section.label}</Text>
                  {section.items.map((item) => {
                    const isCurrentTime = currentTimeStr >= (item.start_time || '00:00') && currentTimeStr < (item.end_time || '23:59');
                    return (
                      <View key={item.id}>
                        {isCurrentTime && <View style={styles.nowLine}><Text style={styles.nowText}>now</Text></View>}
                        <View style={[styles.taskCard, item.completed && styles.taskCardDone]}>
                          <Text style={styles.taskTime}>{item.start_time?.slice(0, 5)}</Text>
                          <View style={[styles.categoryDot, { backgroundColor: CAT_COLORS[item.category] || '#c4b5fd' }]} />
                          <View style={styles.taskInfo}>
                            <Text style={[styles.taskTitle, item.completed && styles.taskTitleDone]}>{item.title}</Text>
                            {item.description && <Text style={styles.taskDesc}>{item.description}</Text>}
                          </View>
                          {/* Reminder bell */}
                          <TouchableOpacity style={styles.bellBtn} onPress={() => setShowReminder(showReminder === item.id ? null : item.id)}>
                            <Ionicons name={item.reminder_minutes ? 'alarm' : 'alarm-outline'} size={16} color={item.reminder_minutes ? c.amber : c.textMuted} />
                          </TouchableOpacity>
                          {/* Lock */}
                          <TouchableOpacity style={styles.lockBtn} onPress={() => toggleLock(item.id)}>
                            <Ionicons name={item.is_locked ? 'lock-closed' : 'lock-open-outline'} size={14} color={item.is_locked ? c.amber : c.textMuted} />
                          </TouchableOpacity>
                          {/* Complete */}
                          <TouchableOpacity style={[styles.checkBtn, item.completed && styles.checkBtnDone]} onPress={() => toggleComplete(item.id)}>
                            {item.completed && <Ionicons name="checkmark" size={14} color="#080503" />}
                          </TouchableOpacity>
                        </View>
                        {/* Reminder dropdown */}
                        {showReminder === item.id && (
                          <View style={styles.reminderDropdown}>
                            {REMINDER_OPTIONS.map((opt) => (
                              <TouchableOpacity key={opt.label} style={[styles.reminderOption, item.reminder_minutes === opt.value && styles.reminderOptionActive]} onPress={() => setReminder(item.id, opt.value)}>
                                <Text style={[styles.reminderText, item.reminder_minutes === opt.value && styles.reminderTextActive]}>{opt.label}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              ))
            )}
          </>
        )}

        {/* WEEK TAB */}
        {activeTab === 'week' && (
          <View style={styles.weekGrid}>
            {weekDays.map((day) => {
              const dayEntries = getEntriesForDay(day.dayIndex, day.dateStr);
              return (
                <View key={day.name + day.num} style={[styles.dayColumn, day.today && styles.dayColumnToday]}>
                  <Text style={[styles.dayName, day.today && styles.dayNameToday]}>{day.name}</Text>
                  <Text style={[styles.dayNum, day.today && styles.dayNumToday]}>{day.num}</Text>
                  <View style={styles.dayChips}>
                    {dayEntries.slice(0, 4).map((entry) => (
                      <View key={entry.id} style={[styles.dayChip, { borderLeftColor: CAT_COLORS[entry.category] || '#c4b5fd' }]}>
                        <Text style={styles.dayChipText} numberOfLines={1}>{entry.start_time?.slice(0, 5)} {entry.title}</Text>
                      </View>
                    ))}
                    {dayEntries.length > 4 && <Text style={styles.dayOverflow}>+{dayEntries.length - 4}</Text>}
                    {dayEntries.length === 0 && <Text style={styles.dayEmpty}>—</Text>}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* PLANS TAB */}
        {activeTab === 'plans' && (
          <>
            {/* Life Audit CTA */}
            <TouchableOpacity style={styles.planCard} onPress={() => router.push('/(tabs)/lumi')} activeOpacity={0.7}>
              <Text style={styles.planEmoji}>✨</Text>
              <View style={styles.planInfo}>
                <Text style={styles.planTitle}>Let Lumi plan your life</Text>
                <Text style={styles.planSub}>A 10-minute interview across 8 areas</Text>
              </View>
              <Ionicons name="arrow-forward" size={18} color={c.amber} />
            </TouchableOpacity>

            {/* Recurring Plans */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Recurring Plans</Text>
              {schedules.filter(s => s.repeat_pattern !== 'none').length === 0 ? (
                <Text style={styles.emptyText}>No recurring plans yet.</Text>
              ) : (
                schedules.filter(s => s.repeat_pattern !== 'none').map((item) => (
                  <View key={item.id} style={styles.taskCard}>
                    <Text style={styles.taskTime}>{item.start_time?.slice(0, 5)}</Text>
                    <View style={[styles.categoryDot, { backgroundColor: CAT_COLORS[item.category] || '#c4b5fd' }]} />
                    <View style={styles.taskInfo}>
                      <Text style={styles.taskTitle}>{item.title}</Text>
                      <Text style={styles.taskDesc}>{item.repeat_pattern}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* FABs */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab} onPress={() => setShowLumiPanel(true)}>
          <Ionicons name="sparkles" size={22} color="#080503" />
        </TouchableOpacity>
      </View>

      {/* Lumi Side Panel */}
      <Modal visible={showLumiPanel} transparent animationType="slide">
        <View style={styles.lumiOverlay}>
          <View style={styles.lumiPanel}>
            <View style={styles.lumiPanelHeader}>
              <Text style={styles.lumiPanelTitle}>Ask Lumi</Text>
              <TouchableOpacity onPress={() => setShowLumiPanel(false)}>
                <Ionicons name="close" size={24} color={c.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Quick prompts */}
            <View style={styles.quickPrompts}>
              {['Plan my entire week', 'Fix a conflict', 'Plan my evening', "What's next?"].map((prompt) => (
                <TouchableOpacity key={prompt} style={styles.promptChip} onPress={() => { setLumiInput(prompt); }}>
                  <Text style={styles.promptText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Response */}
            {lumiResponse && (
              <View style={styles.lumiResponseCard}>
                <LumiFace mood="resting" size={20} />
                <Text style={styles.lumiResponseText}>{lumiResponse}</Text>
              </View>
            )}

            {/* Input */}
            <View style={styles.lumiInputRow}>
              <TextInput style={styles.lumiInput} placeholder="Ask about your schedule..." placeholderTextColor={c.textMuted} value={lumiInput} onChangeText={setLumiInput} onSubmitEditing={sendToLumi} />
              <TouchableOpacity style={styles.lumiSendBtn} onPress={sendToLumi}>
                <Ionicons name="send" size={18} color="#080503" />
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
  lumiBtn: { padding: 4 },
  tabBar: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 12, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: c.card },
  tabActive: { backgroundColor: c.amber },
  tabText: { fontSize: 13, color: c.textSecondary, fontWeight: '500' },
  tabTextActive: { color: '#080503', fontWeight: '600' },
  nightBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, marginBottom: 12, padding: 12, backgroundColor: 'rgba(139,92,246,0.08)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)' },
  nightText: { fontSize: 13, color: c.textPrimary },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  progressCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: 14, padding: 16, marginBottom: 16, gap: 16 },
  progressRing: { width: 68, height: 68, borderRadius: 34, borderWidth: 6, borderColor: c.amber, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(200,149,92,0.08)' },
  progressPct: { fontSize: 18, fontWeight: '700', color: c.amber },
  progressLabel: { fontSize: 9, color: c.textMuted },
  progressStats: { flex: 1, gap: 8 },
  statBadge: { backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5 },
  statText: { fontSize: 11, color: c.textPrimary },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: c.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  nowLine: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  nowText: { fontSize: 10, fontWeight: '700', color: c.amber, marginRight: 8 },
  taskCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderRadius: 10, padding: 12, marginBottom: 6, gap: 10 },
  taskCardDone: { opacity: 0.6 },
  taskTime: { fontSize: 11, color: c.textMuted, width: 40 },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 13, color: c.textPrimary },
  taskTitleDone: { textDecorationLine: 'line-through', color: c.textMuted },
  taskDesc: { fontSize: 10, color: c.textMuted, marginTop: 2 },
  bellBtn: { padding: 4 },
  lockBtn: { padding: 4 },
  checkBtn: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: c.border, justifyContent: 'center', alignItems: 'center' },
  checkBtnDone: { backgroundColor: c.amber, borderColor: c.amber },
  reminderDropdown: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 40, paddingVertical: 6, marginBottom: 6 },
  reminderOption: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: c.card },
  reminderOptionActive: { backgroundColor: 'rgba(200,149,92,0.2)' },
  reminderText: { fontSize: 11, color: c.textSecondary },
  reminderTextActive: { color: c.amber, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingTop: 48 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: c.textPrimary, marginBottom: 6 },
  emptyText: { fontSize: 13, color: c.textSecondary, textAlign: 'center', paddingHorizontal: 40, marginBottom: 16 },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: c.amber },
  emptyBtnText: { fontSize: 13, fontWeight: '600', color: '#080503' },
  weekGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayColumn: { width: '30%', backgroundColor: c.card, borderRadius: 10, padding: 10, minHeight: 120 },
  dayColumnToday: { borderWidth: 1, borderColor: c.amber },
  dayName: { fontSize: 10, fontWeight: '700', color: c.textMuted, textTransform: 'uppercase' },
  dayNameToday: { color: c.amber },
  dayNum: { fontSize: 20, fontWeight: '600', color: c.textPrimary, marginVertical: 4 },
  dayNumToday: { color: c.amber },
  dayChips: { gap: 3 },
  dayChip: { backgroundColor: 'rgba(255,255,255,0.04)', borderLeftWidth: 3, borderRadius: 4, paddingVertical: 3, paddingHorizontal: 6 },
  dayChipText: { fontSize: 9, color: c.textPrimary },
  dayOverflow: { fontSize: 9, color: c.textMuted, marginTop: 2 },
  dayEmpty: { fontSize: 12, color: c.textMuted, textAlign: 'center', marginTop: 8 },
  planCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(200,149,92,0.10)', borderRadius: 14, padding: 16, marginBottom: 16, gap: 12 },
  planEmoji: { fontSize: 28 },
  planInfo: { flex: 1 },
  planTitle: { fontSize: 15, fontWeight: '600', color: c.textPrimary },
  planSub: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
  fabContainer: { position: 'absolute', bottom: 24, right: 20, gap: 12 },
  fab: { width: 56, height: 56, borderRadius: 28, backgroundColor: c.amber, justifyContent: 'center', alignItems: 'center', shadowColor: c.amber, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  lumiOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  lumiPanel: { backgroundColor: c.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '70%' },
  lumiPanelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  lumiPanelTitle: { fontSize: 18, fontWeight: '600', color: c.textPrimary },
  quickPrompts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  promptChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: c.card },
  promptText: { fontSize: 12, color: c.textPrimary },
  lumiResponseCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: 'rgba(200,149,92,0.06)', borderRadius: 12, padding: 12, marginBottom: 12 },
  lumiResponseText: { flex: 1, fontSize: 13, color: c.textPrimary, lineHeight: 18 },
  lumiInputRow: { flexDirection: 'row', gap: 10 },
  lumiInput: { flex: 1, height: 42, backgroundColor: c.card, borderRadius: 21, paddingHorizontal: 16, color: c.textPrimary, fontSize: 14 },
  lumiSendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: c.amber, justifyContent: 'center', alignItems: 'center' },
  bottomPadding: { height: 80 },
});
