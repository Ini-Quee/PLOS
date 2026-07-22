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

type Tab = 'reading' | 'completed';
type Category = 'Personal Growth' | 'Professional' | 'Fiction' | 'Technical' | 'Biography';

interface Book {
  id: string;
  title: string;
  author: string;
  total_pages: number;
  pages_read: number;
  category: Category;
  status: 'reading' | 'completed';
  completed_at?: string;
  created_at: string;
}

const CATEGORIES: Category[] = ['Personal Growth', 'Professional', 'Fiction', 'Technical', 'Biography'];

const CATEGORY_ICONS: Record<Category, string> = {
  'Personal Growth': '🌱',
  'Professional': '💼',
  'Fiction': '📖',
  'Technical': '⚙️',
  'Biography': '👤',
};

const CATEGORY_COLORS: Record<Category, string> = {
  'Personal Growth': '#4CAF7D',
  'Professional': '#7AAEE8',
  'Fiction': '#9B7FD4',
  'Technical': '#D4A06A',
  'Biography': '#7ABFB8',
};

export default function BooksScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<Tab>('reading');
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  // Add form
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newPages, setNewPages] = useState('');
  const [newCategory, setNewCategory] = useState<Category>('Personal Growth');

  const fetchBooks = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/books');
      setBooks(res.data?.books || []);
    } catch (err) {
      console.error('Error fetching books:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);
  const onRefresh = () => { setRefreshing(true); fetchBooks(); };

  const totalBooks = books.length;
  const completedBooks = books.filter((b) => b.status === 'completed').length;
  const totalPagesRead = books.reduce((sum, b) => sum + b.pages_read, 0);

  const filteredBooks = books.filter((b) => b.status === tab);

  const addBook = async () => {
    if (!newTitle.trim() || !newPages) return;
    setSaving(true);
    try {
      await apiClient.post('/api/books', {
        title: newTitle.trim(),
        author: newAuthor.trim(),
        total_pages: parseInt(newPages) || 0,
        category: newCategory,
      });
      setNewTitle('');
      setNewAuthor('');
      setNewPages('');
      setNewCategory('Personal Growth');
      setShowAdd(false);
      fetchBooks();
    } catch (err) {
      console.error('Error adding book:', err);
    }
    setSaving(false);
  };

  const updateProgress = async (book: Book, pagesRead: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await apiClient.put(`/api/books/${book.id}`, { pages_read: pagesRead });
      fetchBooks();
    } catch (err) {
      console.error('Error updating progress:', err);
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
        <Text style={styles.title}>Books</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={22} color={Colors.amber} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalBooks}</Text>
          <Text style={styles.statLabel}>Total Books</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{completedBooks}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalPagesRead.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Pages Read</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'reading' && styles.tabActive]}
          onPress={() => setTab('reading')}
        >
          <Text style={[styles.tabText, tab === 'reading' && styles.tabTextActive]}>Currently Reading</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'completed' && styles.tabActive]}
          onPress={() => setTab('completed')}
        >
          <Text style={[styles.tabText, tab === 'completed' && styles.tabTextActive]}>Completed</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.amber} />}
      >
        {filteredBooks.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>{tab === 'reading' ? 'No books in progress' : 'No completed books'}</Text>
            <Text style={styles.emptyText}>{tab === 'reading' ? 'Add a book to start tracking' : 'Finish a book to see it here'}</Text>
          </View>
        ) : (
          filteredBooks.map((book) => {
            const progress = book.total_pages > 0 ? Math.round((book.pages_read / book.total_pages) * 100) : 0;
            const remaining = book.total_pages - book.pages_read;
            return (
              <View key={book.id} style={styles.bookCard}>
                <View style={styles.bookHeader}>
                  <Text style={styles.categoryIcon}>{CATEGORY_ICONS[book.category]}</Text>
                  <View style={styles.bookInfo}>
                    <Text style={styles.bookTitle}>{book.title}</Text>
                    <Text style={styles.bookAuthor}>{book.author}</Text>
                  </View>
                  <View style={[styles.categoryBadge, { backgroundColor: `${CATEGORY_COLORS[book.category]}20` }]}>
                    <Text style={[styles.categoryText, { color: CATEGORY_COLORS[book.category] }]}>{book.category}</Text>
                  </View>
                </View>
                <View style={styles.progressSection}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: CATEGORY_COLORS[book.category] }]} />
                  </View>
                  <Text style={styles.progressText}>{progress}%</Text>
                </View>
                <View style={styles.pagesRow}>
                  <Text style={styles.pagesText}>{book.pages_read}/{book.total_pages} pages</Text>
                  <Text style={styles.pagesRemaining}>{remaining > 0 ? `${remaining} remaining` : 'Done!'}</Text>
                </View>
                {tab === 'reading' && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.progressBtn, { backgroundColor: CATEGORY_COLORS[book.category] }]}
                      onPress={() => updateProgress(book, Math.min(book.pages_read + 10, book.total_pages))}
                    >
                      <Text style={styles.progressBtnText}>+10 pages</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.progressBtn, { backgroundColor: CATEGORY_COLORS[book.category] }]}
                      onPress={() => updateProgress(book, book.total_pages)}
                    >
                      <Text style={styles.progressBtnText}>Finish</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Add Book Modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Book</Text>

            <TextInput
              style={styles.input}
              placeholder="Book title"
              placeholderTextColor={Colors.textMuted}
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <TextInput
              style={styles.input}
              placeholder="Author"
              placeholderTextColor={Colors.textMuted}
              value={newAuthor}
              onChangeText={setNewAuthor}
            />

            <TextInput
              style={styles.input}
              placeholder="Total pages"
              placeholderTextColor={Colors.textMuted}
              value={newPages}
              onChangeText={setNewPages}
              keyboardType="numeric"
            />

            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.catRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, newCategory === cat && { backgroundColor: CATEGORY_COLORS[cat] }]}
                  onPress={() => setNewCategory(cat)}
                >
                  <Text style={[styles.catChipText, newCategory === cat && { color: '#080503' }]}>
                    {CATEGORY_ICONS[cat]} {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowAdd(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSave, (!newTitle.trim() || !newPages) && { opacity: 0.5 }]}
                onPress={addBook}
                disabled={!newTitle.trim() || !newPages || saving}
              >
                <Text style={styles.modalSaveText}>{saving ? 'Adding...' : 'Add Book'}</Text>
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
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: Colors.card, borderRadius: 12, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: Colors.amber },
  statLabel: { fontSize: Typography.micro.fontSize, color: Colors.textMuted, marginTop: 2 },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.card, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.amber },
  tabText: { fontSize: Typography.caption.fontSize, color: Colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: '#080503' },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: Typography.subtitle.fontSize, fontWeight: '600', color: Colors.textPrimary },
  emptyText: { fontSize: Typography.caption.fontSize, color: Colors.textMuted },
  bookCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 14, marginBottom: 10 },
  bookHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  categoryIcon: { fontSize: 24 },
  bookInfo: { flex: 1 },
  bookTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  bookAuthor: { fontSize: Typography.caption.fontSize, color: Colors.textMuted, marginTop: 1 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  categoryText: { fontSize: 9, fontWeight: '600' },
  progressSection: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  progressBar: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: Typography.micro.fontSize, color: Colors.amber, fontWeight: '600', width: 32, textAlign: 'right' },
  pagesRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  pagesText: { fontSize: Typography.caption.fontSize, color: Colors.textSecondary },
  pagesRemaining: { fontSize: Typography.caption.fontSize, color: Colors.textMuted },
  actionRow: { flexDirection: 'row', gap: 8 },
  progressBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  progressBtnText: { fontSize: Typography.caption.fontSize, fontWeight: '600', color: '#080503' },
  bottomPadding: { height: 80 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 12 },
  modalTitle: { fontSize: Typography.subtitle.fontSize, fontWeight: Typography.subtitle.fontWeight, color: Colors.textPrimary, marginBottom: 4 },
  input: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, color: Colors.textPrimary, fontSize: Typography.body.fontSize },
  fieldLabel: { fontSize: Typography.micro.fontSize, fontWeight: '600', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: Colors.card },
  catChipText: { fontSize: Typography.micro.fontSize, color: Colors.textSecondary },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  modalCancel: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: Colors.card, alignItems: 'center' },
  modalCancelText: { fontSize: Typography.body.fontSize, color: Colors.textSecondary },
  modalSave: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: Colors.amber, alignItems: 'center' },
  modalSaveText: { fontSize: Typography.body.fontSize, fontWeight: '600', color: '#080503' },
});
