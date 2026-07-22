import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView,
  RefreshControl, ActivityIndicator, TextInput, Modal, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Typography } from '../../../constants/typography';
import { useThemeColors } from '../../../contexts/ThemeContext';
import type { ColorScheme } from '../../../constants/colors';
import apiClient from '../../../services/api';
import { LumiFace, VoiceCapture, ModeToggle } from '../../../components';

interface JournalEntry {
  id: string; content: string; entry_date: string; journal_type: string;
  template: string; created_at: string; fields?: any;
}

interface JournalBook {
  type: string; title: string; subtitle: string; emoji: string;
  color: string; spine: string; accent: string; entryCount: number;
  lastEntry: string | null; streak: number; completedDays: number[];
}

const BOOK_TYPES = [
  { type: 'personal', title: 'Everyday Life', subtitle: 'Thoughts & moments', emoji: '🌿', color: '#5a7a5a', spine: '#3d5c3d', accent: '#7fb87f' },
  { type: 'spiritual', title: 'Bible & Faith', subtitle: 'Scripture & reflection', emoji: '✝️', color: '#7a5a3a', spine: '#5c3d1e', accent: '#F5A623' },
  { type: 'goals', title: 'Goals & Vision', subtitle: 'Dreams I am building', emoji: '🎯', color: '#3a4a7a', spine: '#1e2d5c', accent: '#9b7fe8' },
  { type: 'business', title: 'My Business', subtitle: 'Build journal', emoji: '💡', color: '#7a6a3a', spine: '#5c4e1e', accent: '#ffbe4d' },
  { type: 'wellness', title: 'Mental Health', subtitle: 'How I really feel', emoji: '🌸', color: '#7a3a5a', spine: '#5c1e3d', accent: '#e87f9b' },
  { type: 'budget', title: 'Budget Diary', subtitle: 'Money & spending', emoji: '💰', color: '#3a7a6a', spine: '#1e5c4e', accent: '#00c9a7' },
];

const FILTERS = ['all', 'personal', 'spiritual', 'goals', 'business', 'wellness', 'budget'];

const FONTS = ['Handwriting', 'Elegant', 'Typewriter', 'Clean'];
const PAPER_STYLES = ['lined', 'dotted', 'grid', 'blank', 'kraft', 'dark'];
const ACCENT_COLORS = ['#C8955C', '#7fb87f', '#F5A623', '#9b7fe8', '#e87f9b', '#00c9a7', '#7AAEE8', '#E05252'];
const PAGE_COLORS = ['#fdf8ef', '#ffffff', '#e8e0f0', '#e0f0e8', '#f0e0e8', '#e0e8f0', '#d4c4a0', '#1a1612', '#e8f0e0', '#f0e8e0', '#f0e0e0', '#e0f0f0'];

const MOODS = ['😊', '😌', '😤', '🤩', '😢', '🥱', '💪', '😔'];

export default function JournalScreen() {
  const router = useRouter();
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [activeTab, setActiveTab] = useState<'books' | 'browse' | 'calendar' | 'insights'>('books');
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [selectedFont, setSelectedFont] = useState('Clean');
  const [selectedPaper, setSelectedPaper] = useState('lined');
  const [selectedAccent, setSelectedAccent] = useState(0);
  const [selectedPageColor, setSelectedPageColor] = useState(0);
  const [browseWeekOffset, setBrowseWeekOffset] = useState(0);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [showOpenBook, setShowOpenBook] = useState<string | null>(null);
  const [openBookTab, setOpenBookTab] = useState<'entries' | 'browse' | 'calendar' | 'insights'>('entries');

  const fetchEntries = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/journal/pages?limit=200');
      setEntries(res.data?.entries || []);
    } catch (err) { console.error('Error fetching journal:', err); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);
  const onRefresh = () => { setRefreshing(true); fetchEntries(); };

  // Build books
  const books: JournalBook[] = BOOK_TYPES.map((bt) => {
    const bookEntries = entries.filter((e) => e.journal_type === bt.type);
    const dates = new Set(bookEntries.map((e) => e.entry_date));
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      if (dates.has(d.toISOString().slice(0, 10))) streak++; else if (i > 0) break;
    }
    const completedDays = bookEntries.map((e) => new Date(e.entry_date).getDate());
    return { ...bt, entryCount: bookEntries.length, lastEntry: bookEntries[0]?.entry_date || null, streak, completedDays };
  });

  const filteredBooks = activeFilter === 'all' ? books : books.filter((b) => b.type === activeFilter);

  // Stats
  const totalEntries = entries.length;
  const dates = new Set(entries.map((e) => e.entry_date));
  let totalDaysWritten = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    if (dates.has(d.toISOString().slice(0, 10))) totalDaysWritten++;
  }
  const todayStr = new Date().toISOString().slice(0, 10);
  const writtenToday = entries.filter((e) => e.entry_date === todayStr).length;

  // Search. Entry text lives inside `fields` (not a top-level `content`), so
  // flatten the field values into one searchable string.
  const entryText = (e: JournalEntry) =>
    e.fields ? Object.values(e.fields).filter((v) => typeof v === 'string').join(' ').toLowerCase() : '';
  const searchResults = entries.filter((e) => {
    const matchesText = !searchQuery || entryText(e).includes(searchQuery.toLowerCase());
    const matchesDate = !searchDate || e.entry_date === searchDate;
    return matchesText && matchesDate;
  });

  // Browse week
  const getBrowseWeek = () => {
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay() + browseWeekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i);
      return { date: d.toISOString().slice(0, 10), day: d.toLocaleDateString('en-US', { weekday: 'short' }), num: d.getDate(), isToday: d.toDateString() === today.toDateString() };
    });
  };

  // Calendar
  const getCalendarDays = () => {
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const firstDow = new Date(calendarYear, calendarMonth, 1).getDay();
    const cells = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
    const writtenDays = new Set(entries.filter((e) => {
      const d = new Date(e.entry_date);
      return d.getMonth() === calendarMonth && d.getFullYear() === calendarYear;
    }).map((e) => new Date(e.entry_date).getDate()));
    return { cells, writtenDays, monthLabel: new Date(calendarYear, calendarMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) };
  };

  // Insights
  const getTypeStats = () => {
    return BOOK_TYPES.map((bt) => ({
      ...bt,
      count: entries.filter((e) => e.journal_type === bt.type).length,
    })).sort((a, b) => b.count - a.count);
  };

  const openBook = (type: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/(tabs)/journal/book?type=${type}`);
  };

  if (loading) {
    return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color={c.amber} /></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Journal</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setShowSearch(!showSearch)}>
            <Ionicons name="search" size={20} color={c.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setShowStylePanel(!showStylePanel)}>
            <Ionicons name="color-palette" size={20} color={c.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/(tabs)/lumi')}>
            <LumiFace mood="resting" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={c.textMuted} />
          <TextInput style={styles.searchInput} placeholder="Search entries..." placeholderTextColor={c.textMuted} value={searchQuery} onChangeText={setSearchQuery} />
          <TextInput style={styles.searchDateInput} placeholder="YYYY-MM-DD" placeholderTextColor={c.textMuted} value={searchDate} onChangeText={setSearchDate} />
          {(searchQuery || searchDate) && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchDate(''); }}>
              <Ionicons name="close" size={16} color={c.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Style Panel */}
      {showStylePanel && (
        <View style={styles.stylePanel}>
          <Text style={styles.styleLabel}>Font</Text>
          <View style={styles.styleRow}>
            {FONTS.map((f) => (
              <TouchableOpacity key={f} style={[styles.styleChip, selectedFont === f && styles.styleChipActive]} onPress={() => setSelectedFont(f)}>
                <Text style={[styles.styleChipText, selectedFont === f && styles.styleChipTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.styleLabel}>Paper</Text>
          <View style={styles.styleRow}>
            {PAPER_STYLES.map((p) => (
              <TouchableOpacity key={p} style={[styles.styleChip, selectedPaper === p && styles.styleChipActive]} onPress={() => setSelectedPaper(p)}>
                <Text style={[styles.styleChipText, selectedPaper === p && styles.styleChipTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.styleLabel}>Accent</Text>
          <View style={styles.styleRow}>
            {ACCENT_COLORS.map((c, i) => (
              <TouchableOpacity key={i} style={[styles.colorDot, { backgroundColor: c }, selectedAccent === i && styles.colorDotActive]} onPress={() => setSelectedAccent(i)} />
            ))}
          </View>
          <Text style={styles.styleLabel}>Page</Text>
          <View style={styles.styleRow}>
            {PAGE_COLORS.map((c, i) => (
              <TouchableOpacity key={i} style={[styles.colorDot, { backgroundColor: c, borderWidth: 1, borderColor: c.border }, selectedPageColor === i && styles.colorDotActive]} onPress={() => setSelectedPageColor(i)} />
            ))}
          </View>
        </View>
      )}

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {(['books', 'browse', 'calendar', 'insights'] as const).map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab === 'books' ? 'Books' : tab === 'browse' ? 'Browse' : tab === 'calendar' ? 'Calendar' : 'AI Insights'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalDaysWritten}</Text>
          <Text style={styles.statLabel}>days written</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalEntries}</Text>
          <Text style={styles.statLabel}>total entries</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{writtenToday}</Text>
          <Text style={styles.statLabel}>today</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{books.length}</Text>
          <Text style={styles.statLabel}>books</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.amber} />}>

        {/* BOOKS TAB */}
        {activeTab === 'books' && (
          <>
            {/* Filter chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {FILTERS.map((f) => (
                <TouchableOpacity key={f} style={[styles.filterChip, activeFilter === f && styles.filterChipActive]} onPress={() => setActiveFilter(f)}>
                  <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f === 'all' ? 'All Books' : BOOK_TYPES.find((b) => b.type === f)?.title || f}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Search results */}
            {(searchQuery || searchDate) && (
              <View style={styles.searchResults}>
                <Text style={styles.searchResultsTitle}>{searchResults.length} results</Text>
                {searchResults.slice(0, 10).map((entry) => (
                  <TouchableOpacity key={entry.id} style={styles.searchResult} onPress={() => openBook(entry.journal_type)}>
                    <Text style={styles.searchResultType}>{entry.journal_type}</Text>
                    <Text style={styles.searchResultContent} numberOfLines={2}>{entry.content}</Text>
                    <Text style={styles.searchResultDate}>{entry.entry_date}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Bookshelf */}
            <View style={styles.bookGrid}>
              {filteredBooks.map((book) => (
                <TouchableOpacity key={book.type} style={[styles.bookCard, { backgroundColor: book.color }]} onPress={() => openBook(book.type)} activeOpacity={0.8}>
                  <View style={[styles.bookSpine, { backgroundColor: book.spine }]} />
                  <View style={styles.bookContent}>
                    <View style={styles.bookTop}>
                      <Text style={styles.bookEmoji}>{book.emoji}</Text>
                      {book.streak > 0 && (
                        <View style={[styles.streakBadge, { backgroundColor: `${book.accent}40` }]}>
                          <Text style={[styles.streakText, { color: book.accent }]}>🔥 {book.streak}d</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.bookTitle}>{book.title}</Text>
                    <Text style={styles.bookSubtitle}>{book.subtitle}</Text>
                    <View style={styles.bookBottom}>
                      <Text style={styles.entryCount}>{book.entryCount} {book.entryCount === 1 ? 'entry' : 'entries'}</Text>
                      {book.lastEntry && <Text style={styles.lastEntry}>Last: {new Date(book.lastEntry).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>}
                    </View>
                  </View>
                  <View style={styles.paperTexture} />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* BROWSE TAB */}
        {activeTab === 'browse' && (
          <>
            <View style={styles.browseNav}>
              <TouchableOpacity onPress={() => setBrowseWeekOffset((o) => o - 1)}>
                <Ionicons name="chevron-back" size={20} color={c.textSecondary} />
              </TouchableOpacity>
              <Text style={styles.browseLabel}>Week of {getBrowseWeek()[0]?.date}</Text>
              <TouchableOpacity onPress={() => setBrowseWeekOffset((o) => o + 1)}>
                <Ionicons name="chevron-forward" size={20} color={c.textSecondary} />
              </TouchableOpacity>
            </View>
            {getBrowseWeek().map((day) => {
              const dayEntries = entries.filter((e) => e.entry_date === day.date);
              return (
                <View key={day.date} style={styles.browseDay}>
                  <View style={styles.browseDayHeader}>
                    <Text style={[styles.browseDayLabel, day.isToday && { color: c.amber }]}>{day.day} {day.num}</Text>
                    {day.isToday && <Text style={styles.todayBadge}>Today</Text>}
                  </View>
                  {dayEntries.length === 0 ? (
                    <Text style={styles.browseEmpty}>No entries</Text>
                  ) : (
                    dayEntries.map((entry) => (
                      <TouchableOpacity key={entry.id} style={styles.browseEntry} onPress={() => openBook(entry.journal_type)}>
                        <Text style={styles.browseEntryType}>{entry.journal_type}</Text>
                        <Text style={styles.browseEntryContent} numberOfLines={2}>{entry.content}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              );
            })}
          </>
        )}

        {/* CALENDAR TAB */}
        {activeTab === 'calendar' && (
          <>
            <View style={styles.calendarNav}>
              <TouchableOpacity onPress={() => { if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear((y) => y - 1); } else setCalendarMonth((m) => m - 1); }}>
                <Ionicons name="chevron-back" size={20} color={c.textSecondary} />
              </TouchableOpacity>
              <Text style={styles.calendarLabel}>{getCalendarDays().monthLabel}</Text>
              <TouchableOpacity onPress={() => { if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear((y) => y + 1); } else setCalendarMonth((m) => m + 1); }}>
                <Ionicons name="chevron-forward" size={20} color={c.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.calendarGrid}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <Text key={i} style={styles.calendarDayHeader}>{d}</Text>
              ))}
              {getCalendarDays().cells.map((d, i) => {
                if (!d) return <View key={i} style={styles.calendarCell} />;
                const written = getCalendarDays().writtenDays.has(d);
                const isToday = d === today.getDate() && calendarMonth === today.getMonth() && calendarYear === today.getFullYear();
                return (
                  <View key={i} style={[styles.calendarCell, isToday && styles.calendarToday, written && styles.calendarWritten]}>
                    <Text style={[styles.calendarNum, isToday && styles.calendarNumToday, written && styles.calendarNumWritten]}>{d}</Text>
                  </View>
                );
              })}
            </View>
            {/* Calendar stats */}
            <View style={styles.calendarStats}>
              <View style={styles.calendarStatCard}>
                <Text style={styles.calendarStatValue}>{getCalendarDays().writtenDays.size}</Text>
                <Text style={styles.calendarStatLabel}>days written</Text>
              </View>
              <View style={styles.calendarStatCard}>
                <Text style={styles.calendarStatValue}>{totalEntries}</Text>
                <Text style={styles.calendarStatLabel}>total entries</Text>
              </View>
              <View style={styles.calendarStatCard}>
                <Text style={styles.calendarStatValue}>{entries.filter((e) => { const d = new Date(e.entry_date); return d.getMonth() === calendarMonth && d.getFullYear() === calendarYear; }).length}</Text>
                <Text style={styles.calendarStatLabel}>this month</Text>
              </View>
            </View>
          </>
        )}

        {/* INSIGHTS TAB */}
        {activeTab === 'insights' && (
          <>
            <View style={styles.insightCard}>
              <LumiFace mood="resting" size={32} />
              <View style={styles.insightInfo}>
                <Text style={styles.insightTitle}>Lumi's Analysis</Text>
                <Text style={styles.insightSub}>Your journal patterns and themes</Text>
              </View>
            </View>
            <View style={styles.typeStatsGrid}>
              {getTypeStats().map((stat) => (
                <View key={stat.type} style={[styles.typeStatCard, { borderLeftColor: stat.accent }]}>
                  <Text style={styles.typeStatEmoji}>{stat.emoji}</Text>
                  <Text style={styles.typeStatTitle}>{stat.title}</Text>
                  <Text style={styles.typeStatCount}>{stat.count} entries</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Voice Capture FAB */}
      <View style={styles.fabContainer}>
        <VoiceCapture onTranscription={(text) => router.push(`/(tabs)/journal/book?type=personal`)} size={48} />
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: ColorScheme) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', color: c.textPrimary },
  headerRight: { flexDirection: 'row', gap: 8 },
  headerBtn: { padding: 6 },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 8, backgroundColor: c.card, borderRadius: 10, paddingHorizontal: 12, gap: 8 },
  searchInput: { flex: 1, height: 36, color: c.textPrimary, fontSize: 13 },
  searchDateInput: { width: 90, height: 36, color: c.textPrimary, fontSize: 12, textAlign: 'center' },
  stylePanel: { backgroundColor: c.card, marginHorizontal: 20, borderRadius: 12, padding: 12, marginBottom: 8 },
  styleLabel: { fontSize: 10, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 8 },
  styleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  styleChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
  styleChipActive: { backgroundColor: c.amber },
  styleChipText: { fontSize: 11, color: c.textSecondary },
  styleChipTextActive: { color: '#080503', fontWeight: '600' },
  colorDot: { width: 24, height: 24, borderRadius: 12 },
  colorDotActive: { borderWidth: 2, borderColor: '#fff' },
  tabBar: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 8, gap: 6 },
  tab: { flex: 1, paddingVertical: 7, borderRadius: 14, backgroundColor: c.card, alignItems: 'center' },
  tabActive: { backgroundColor: c.amber },
  tabText: { fontSize: 11, color: c.textSecondary, fontWeight: '500' },
  tabTextActive: { color: '#080503', fontWeight: '600' },
  statsBar: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 12, gap: 8 },
  statItem: { flex: 1, alignItems: 'center', backgroundColor: c.card, borderRadius: 10, padding: 8 },
  statValue: { fontSize: 16, fontWeight: '700', color: c.amber },
  statLabel: { fontSize: 9, color: c.textMuted },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  filterRow: { marginBottom: 12, gap: 6 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: c.card },
  filterChipActive: { backgroundColor: c.amber },
  filterText: { fontSize: 11, color: c.textSecondary },
  filterTextActive: { color: '#080503', fontWeight: '600' },
  searchResults: { marginBottom: 16 },
  searchResultsTitle: { fontSize: 12, color: c.textMuted, marginBottom: 8 },
  searchResult: { backgroundColor: c.card, borderRadius: 10, padding: 12, marginBottom: 6 },
  searchResultType: { fontSize: 10, color: c.amber, textTransform: 'uppercase', marginBottom: 4 },
  searchResultContent: { fontSize: 13, color: c.textPrimary, lineHeight: 18 },
  searchResultDate: { fontSize: 10, color: c.textMuted, marginTop: 4 },
  bookGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  bookCard: { width: '47%', borderRadius: 8, overflow: 'hidden', position: 'relative', minHeight: 180 },
  bookSpine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6 },
  bookContent: { padding: 14, paddingLeft: 18, flex: 1, justifyContent: 'space-between' },
  bookTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  bookEmoji: { fontSize: 24 },
  streakBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  streakText: { fontSize: 9, fontWeight: '600' },
  bookTitle: { fontSize: 14, fontWeight: '700', color: '#fff', lineHeight: 18, marginBottom: 3 },
  bookSubtitle: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 8 },
  bookBottom: { gap: 2 },
  entryCount: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },
  lastEntry: { fontSize: 9, color: 'rgba(255,255,255,0.5)' },
  paperTexture: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.05)' },
  browseNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  browseLabel: { fontSize: 13, color: c.textPrimary, fontWeight: '600' },
  browseDay: { marginBottom: 16 },
  browseDayHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  browseDayLabel: { fontSize: 12, fontWeight: '600', color: c.textMuted },
  todayBadge: { fontSize: 9, color: c.amber, backgroundColor: 'rgba(200,149,92,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  browseEmpty: { fontSize: 12, color: c.textMuted, fontStyle: 'italic' },
  browseEntry: { backgroundColor: c.card, borderRadius: 10, padding: 10, marginBottom: 4 },
  browseEntryType: { fontSize: 9, color: c.amber, textTransform: 'uppercase', marginBottom: 3 },
  browseEntryContent: { fontSize: 12, color: c.textPrimary, lineHeight: 16 },
  calendarNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  calendarLabel: { fontSize: 14, fontWeight: '600', color: c.textPrimary },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  calendarDayHeader: { width: '14.28%', textAlign: 'center', fontSize: 10, color: c.textMuted, marginBottom: 6 },
  calendarCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 6 },
  calendarToday: { backgroundColor: c.amber },
  calendarWritten: { backgroundColor: 'rgba(200,149,92,0.15)' },
  calendarNum: { fontSize: 12, color: c.textMuted },
  calendarNumToday: { color: '#080503', fontWeight: '700' },
  calendarNumWritten: { color: c.amber },
  calendarStats: { flexDirection: 'row', gap: 8 },
  calendarStatCard: { flex: 1, backgroundColor: c.card, borderRadius: 10, padding: 12, alignItems: 'center' },
  calendarStatValue: { fontSize: 18, fontWeight: '700', color: c.amber },
  calendarStatLabel: { fontSize: 9, color: c.textMuted, marginTop: 2 },
  insightCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.card, borderRadius: 14, padding: 16, marginBottom: 16 },
  insightInfo: { flex: 1 },
  insightTitle: { fontSize: 15, fontWeight: '600', color: c.textPrimary },
  insightSub: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
  typeStatsGrid: { gap: 8 },
  typeStatCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderRadius: 10, padding: 12, borderLeftWidth: 3, gap: 10 },
  typeStatEmoji: { fontSize: 20 },
  typeStatTitle: { flex: 1, fontSize: 13, color: c.textPrimary },
  typeStatCount: { fontSize: 12, color: c.textMuted },
  fabContainer: { position: 'absolute', bottom: 24, right: 20 },
  bottomPadding: { height: 80 },
});
