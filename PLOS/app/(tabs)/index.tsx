import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '../../contexts/ThemeContext';
import type { ColorScheme } from '../../constants/colors';
import { useAuthStore } from '../../store/useAuthStore';
import apiClient from '../../services/api';
import { HeroCard, GlanceCard, NudgeBar, LumiFace } from '../../components';
import ScreenState from '../../components/ScreenState';

interface ScheduleItem {
  id: string;
  title: string;
  category: string;
  start_time: string;
  completed: boolean;
}
interface Habit {
  id: string;
  completed_today: boolean;
}
interface JournalEntry {
  id: string;
  entry_date: string;
  journal_type: string;
  fields?: Record<string, any>;
}

// Journal entries store their text inside `fields` (e.g. fields.freewrite),
// not a top-level `content`. Pull the first meaningful line for a preview.
function journalPreview(entry: JournalEntry | null): string {
  const f = entry?.fields;
  if (!f) return '';
  const preferred = f.freewrite || f.entry || f.reflection || f.note || f.content || f.gratitude;
  if (typeof preferred === 'string' && preferred.trim()) return preferred.trim();
  for (const v of Object.values(f)) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

/**
 * Today — the calm command center.
 * One hero, one nudge, a small glance row, a recent-journal peek, and Lumi.
 * Theme-aware: switches with Light / Dark / Auto instantly.
 */
export default function TodayScreen() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [todaySpend, setTodaySpend] = useState(0);
  const [lastJournal, setLastJournal] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const greeting = () => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Good morning';
    if (h >= 12 && h < 17) return 'Good afternoon';
    if (h >= 17 && h < 21) return 'Good evening';
    return 'Good night';
  };
  const moodEmoji = () => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return '☀️';
    if (h >= 12 && h < 17) return '🌤';
    if (h >= 17 && h < 21) return '🌙';
    return '✨';
  };
  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const fetchData = useCallback(async () => {
    setError(false);
    try {
      const [sched, hab, budget, jrnl] = await Promise.allSettled([
        apiClient.get('/api/schedule/today'),
        apiClient.get('/api/habits'),
        apiClient.get('/api/budget/summary'),
        apiClient.get('/api/journal/pages?limit=1'),
      ]);
      if (sched.status === 'fulfilled') setSchedules(sched.value.data?.schedules || []);
      if (hab.status === 'fulfilled') setHabits(hab.value.data?.habits || []);
      if (budget.status === 'fulfilled') setTodaySpend(budget.value.data?.today_spend || 0);
      if (jrnl.status === 'fulfilled') setLastJournal(jrnl.value.data?.entries?.[0] || null);

      // Only treat it as an error if EVERYTHING failed (e.g. no connection).
      if (sched.status === 'rejected' && hab.status === 'rejected' && budget.status === 'rejected' && jrnl.status === 'rejected') {
        setError(true);
      }
    } catch (e) {
      console.error('Today fetch error:', e);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const completed = habits.filter((h) => h.completed_today).length;
  const nextEvent = schedules.find((s) => !s.completed);
  const hero = nextEvent || schedules[0];
  const remaining = schedules.filter((s) => !s.completed).length;

  const nudge = () => {
    if (habits.length > 0 && completed === habits.length) return 'All habits done today. Beautiful.';
    if (schedules.length === 0 && habits.length === 0) return "Your day is open — tell Lumi what's on your mind.";
    return `${remaining} task${remaining !== 1 ? 's' : ''} left today. One at a time.`;
  };

  if (loading || error) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenState
          loading={loading}
          error={error}
          errorMessage="Couldn't reach your day just now."
          onRetry={() => {
            setLoading(true);
            fetchData();
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.amber} />}
      >
        {/* Greeting */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <View style={styles.greetRow}>
              <LumiFace mood="resting" size={26} />
              <Text style={styles.date}>{dateLabel} · {moodEmoji()}</Text>
            </View>
            <Text style={styles.greeting}>
              {greeting()}, {user?.name?.split(' ')[0] || 'friend'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <TouchableOpacity onPress={() => router.push('/more')} hitSlop={8}>
              <Ionicons name="apps-outline" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/profile')} hitSlop={8}>
              <Ionicons name="person-circle-outline" size={30} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero — the one thing that matters */}
        <HeroCard
          icon={hero ? '📖' : '✨'}
          title={hero ? hero.title : 'Your day is open'}
          subtitle={hero ? `${hero.start_time?.slice(0, 5)} · the one that matters` : 'Plan it with Lumi, or add one thing'}
          action={hero ? 'Start →' : 'Plan my day'}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (hero) apiClient.post(`/api/schedule/${hero.id}/complete`).then(fetchData).catch(() => {});
            else router.push('/(tabs)/planner');
          }}
        />

        {/* Lumi's nudge */}
        <NudgeBar message={nudge()} />

        {/* Glance row — small, peripheral */}
        <View style={styles.glanceRow}>
          <GlanceCard icon="🔥" label="Habits" value={`${completed}/${habits.length}`} sub="today" onPress={() => router.push('/(tabs)/habits')} />
          <GlanceCard icon="📅" label="Next" value={nextEvent ? nextEvent.start_time?.slice(0, 5) : '—'} sub={nextEvent ? 'up next' : 'free'} onPress={() => router.push('/(tabs)/planner')} />
          <GlanceCard icon="💰" label="Today" value={`₦${(todaySpend / 1000).toFixed(1)}k`} sub="spent" onPress={() => router.push('/budget')} />
        </View>

        {/* Recent journal — one quiet peek */}
        <TouchableOpacity style={styles.journalCard} onPress={() => router.push('/(tabs)/journal')} activeOpacity={0.8}>
          <Text style={styles.journalLabel}>RECENT JOURNAL</Text>
          {journalPreview(lastJournal) ? (
            <Text style={styles.journalText} numberOfLines={2}>"{journalPreview(lastJournal)}"</Text>
          ) : (
            <Text style={styles.journalEmpty}>Write a line — how's today going?</Text>
          )}
        </TouchableOpacity>

        {/* Talk to Lumi */}
        <TouchableOpacity style={styles.lumiBar} onPress={() => router.push('/(tabs)/lumi')} activeOpacity={0.8}>
          <LumiFace mood="resting" size={24} />
          <Text style={styles.lumiText}>Tell Lumi anything…</Text>
          <Ionicons name="mic-outline" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: ColorScheme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: { paddingHorizontal: 20, paddingTop: 14 },
    header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 },
    greetRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    date: { fontSize: 12, color: c.textSecondary },
    greeting: { fontSize: 26, fontWeight: '500', color: c.textPrimary, fontFamily: 'Georgia' },
    glanceRow: { flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 16 },
    journalCard: { backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 14 },
    journalLabel: { fontSize: 10, color: c.textMuted, letterSpacing: 1, marginBottom: 6 },
    journalText: { fontSize: 14, color: c.textPrimary, fontFamily: 'Georgia', lineHeight: 20 },
    journalEmpty: { fontSize: 13, color: c.textSecondary },
    lumiBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(155,127,212,0.10)', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 13 },
    lumiText: { flex: 1, fontSize: 13, color: c.textMuted },
  });
