import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import apiClient from '../../services/api';

interface ScheduleItem {
  id: string;
  title: string;
  time: string;
  category: string;
  date: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  work: '#7AAEE8',
  personal: '#C8955C',
  health: '#4CAF7D',
  social: '#9B7FD4',
  learning: '#D4A06A',
  finance: '#5BA88A',
  spiritual: '#7ABFB8',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarScreen() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const fetchSchedule = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/schedule');
      setScheduleItems(res.data?.schedule || []);
    } catch (err) {
      console.error('Error fetching schedule:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);
  const onRefresh = () => { setRefreshing(true); fetchSchedule(); };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);

  const prevMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  const getDateString = (day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const getItemsForDate = (dateStr: string) =>
    scheduleItems.filter((item) => item.date === dateStr);

  const getCategoriesForDate = (dateStr: string) => {
    const items = getItemsForDate(dateStr);
    return [...new Set(items.map((i) => i.category))];
  };

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const selectedItems = selectedDate ? getItemsForDate(selectedDate) : [];

  // Legend categories
  const allCategories = [...new Set(scheduleItems.map((i) => i.category))];

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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
        <TouchableOpacity style={styles.dailyBtn} onPress={() => router.push('/schedule')}>
          <Text style={styles.dailyBtnText}>Daily View</Text>
          <Ionicons name="arrow-forward" size={14} color={Colors.amber} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.amber} />}
      >
        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Day Headers */}
        <View style={styles.dayHeaders}>
          {DAYS.map((day) => (
            <Text key={day} style={styles.dayHeader}>{day}</Text>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {calendarDays.map((day, i) => {
            if (day === null) return <View key={i} style={styles.emptyCell} />;
            const dateStr = getDateString(day);
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;
            const categories = getCategoriesForDate(dateStr);
            return (
              <TouchableOpacity
                key={i}
                style={[styles.dayCell, isToday && styles.todayCell, isSelected && styles.selectedCell]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedDate(dateStr); }}
              >
                <Text style={[styles.dayText, isToday && styles.todayText, isSelected && styles.selectedText]}>
                  {day}
                </Text>
                {categories.length > 0 && (
                  <View style={styles.dotRow}>
                    {categories.slice(0, 3).map((cat) => (
                      <View key={cat} style={[styles.dot, { backgroundColor: CATEGORY_COLORS[cat] || Colors.amber }]} />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Legend */}
        {allCategories.length > 0 && (
          <View style={styles.legend}>
            <Text style={styles.legendTitle}>Categories</Text>
            <View style={styles.legendRow}>
              {allCategories.map((cat) => (
                <View key={cat} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: CATEGORY_COLORS[cat] || Colors.amber }]} />
                  <Text style={styles.legendText}>{cat}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Selected Date Panel */}
        {selectedDate && (
          <View style={styles.selectedPanel}>
            <Text style={styles.selectedDateLabel}>
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
            {selectedItems.length === 0 ? (
              <Text style={styles.noItemsText}>No items scheduled</Text>
            ) : (
              selectedItems.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={[styles.itemDot, { backgroundColor: CATEGORY_COLORS[item.category] || Colors.amber }]} />
                  <Text style={styles.itemTime}>{item.time || '—'}</Text>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <View style={[styles.itemBadge, { backgroundColor: `${CATEGORY_COLORS[item.category] || Colors.amber}20` }]}>
                    <Text style={[styles.itemBadgeText, { color: CATEGORY_COLORS[item.category] || Colors.amber }]}>{item.category}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
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
  dailyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(200,149,92,0.12)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  dailyBtnText: { fontSize: Typography.caption.fontSize, color: Colors.amber, fontWeight: '600' },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.card, justifyContent: 'center', alignItems: 'center' },
  monthLabel: { fontSize: Typography.subtitle.fontSize, fontWeight: '600', color: Colors.textPrimary },
  dayHeaders: { flexDirection: 'row', marginBottom: 8 },
  dayHeader: { flex: 1, textAlign: 'center', fontSize: Typography.micro.fontSize, color: Colors.textMuted, fontWeight: '600' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  emptyCell: { width: '14.28%', aspectRatio: 1 },
  dayCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  todayCell: { backgroundColor: 'rgba(200,149,92,0.12)' },
  selectedCell: { backgroundColor: Colors.amber },
  dayText: { fontSize: Typography.caption.fontSize, color: Colors.textPrimary },
  todayText: { color: Colors.amber, fontWeight: '700' },
  selectedText: { color: '#080503', fontWeight: '700' },
  dotRow: { flexDirection: 'row', gap: 2, marginTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  legend: { marginTop: 16, backgroundColor: Colors.card, borderRadius: 12, padding: 12 },
  legendTitle: { fontSize: Typography.micro.fontSize, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: Typography.caption.fontSize, color: Colors.textSecondary },
  selectedPanel: { marginTop: 16, backgroundColor: Colors.card, borderRadius: 14, padding: 16 },
  selectedDateLabel: { fontSize: Typography.subtitle.fontSize, fontWeight: '600', color: Colors.textPrimary, marginBottom: 12 },
  noItemsText: { fontSize: Typography.caption.fontSize, color: Colors.textMuted, textAlign: 'center', paddingVertical: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  itemDot: { width: 8, height: 8, borderRadius: 4 },
  itemTime: { fontSize: Typography.caption.fontSize, color: Colors.textMuted, width: 50 },
  itemTitle: { flex: 1, fontSize: Typography.caption.fontSize, color: Colors.textPrimary },
  itemBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  itemBadgeText: { fontSize: 9, fontWeight: '600' },
  bottomPadding: { height: 80 },
});
