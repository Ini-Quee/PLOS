import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView,
  TextInput, Modal, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Typography } from '../../../../constants/typography';
import { useThemeColors } from '../../../../contexts/ThemeContext';
import type { ColorScheme } from '../../../../constants/colors';
import apiClient from '../../../../services/api';
import { LumiFace, VoiceCapture } from '../../../../components';

const BOOK_CONFIG: Record<string, { title: string; emoji: string; color: string; accent: string; templates: string[]; stickers: string[] }> = {
  personal: { title: 'Everyday Life', emoji: '🌿', color: '#5a7a5a', accent: '#7fb87f', templates: ['Blank Page', 'Classic Diary', 'Morning Pages', 'Reflection', 'Brain Dump', 'Gratitude Log', 'Travel Memory'], stickers: ['📝', '💌', '🌸', '☀️', '🌙', '💭', '🦋', '🌿', '✨', '❤️', '🎵', '🌈', '📸', '🕊️', '🌺', '💐', '🌻', '🎉', '🥰', '🍃'] },
  spiritual: { title: 'Bible & Faith', emoji: '✝️', color: '#7a5a3a', accent: '#F5A623', templates: ['Blank Page', 'Daily Devotion', 'Prayer Journal', 'Bible Study', 'Sermon Notes', 'Faith Walk', 'Verse of the Day'], stickers: ['🙏', '✝️', '📖', '🕯️', '🌟', '🕊️', '💜', '⭐', '🌅', '🌿', '🙌', '💫', '🌸', '📿', '✨', '🌙', '🫶', '📜', '🌾', '🏛️'] },
  goals: { title: 'Goals & Vision', emoji: '🎯', color: '#3a4a7a', accent: '#9b7fe8', templates: ['Blank Page', 'Year Vision', 'Quarterly Plan', 'Weekly Wins', 'Project Board', 'Milestone Log', 'Vision Map'], stickers: ['🎯', '🚀', '🏆', '⭐', '💡', '🌟', '🗺️', '🧭', '🔑', '💪', '📋', '✅', '🏅', '🌱', '🎉', '💫', '🔥', '🎊', '🌈', '🦅'] },
  business: { title: 'My Business', emoji: '💡', color: '#7a6a3a', accent: '#ffbe4d', templates: ['Blank Page', 'Morning Pages', 'Brain Dump', 'Project Board', 'Milestone Log', 'Vision Map', 'Accountability Log'], stickers: ['💡', '📊', '🏢', '🤝', '💰', '📈', '🚀', '🔑', '💼', '📋', '✅', '🏆', '🎯', '💫', '🌟', '🔥', '⚡', '🎊', '🦅', '💎'] },
  wellness: { title: 'Mental Health', emoji: '🌸', color: '#7a3a5a', accent: '#e87f9b', templates: ['Blank Page', 'Daily Wellness', 'Mood Tracker', 'Symptoms Diary', 'Fitness Log', 'Habit Tracker', 'Sleep Log'], stickers: ['💊', '🩺', '🧘', '💧', '🥗', '❤️', '🌡️', '🏃', '😴', '🧬', '🍎', '💪', '🌿', '🩹', '🧠', '🌸', '⚕️', '🥦', '🫶', '🫁'] },
  budget: { title: 'Budget Diary', emoji: '💰', color: '#3a7a6a', accent: '#00c9a7', templates: ['Blank Page', 'Daily Expenses', 'Weekly Budget', 'Income Tracker', 'Savings Goal', 'Bills Planner', 'Spending Review'], stickers: ['💰', '💳', '📊', '🏦', '💵', '🎯', '📈', '🛒', '🏠', '✅', '🔐', '💡', '🎁', '📉', '🌱', '💎', '🏆', '🧾', '💸', '🪙'] },
};

const PAPER_STYLES = ['lined', 'dotted', 'grid', 'blank', 'kraft', 'dark'];
const ACCENT_COLORS = ['#C8955C', '#7fb87f', '#F5A623', '#9b7fe8', '#e87f9b', '#00c9a7', '#7AAEE8', '#E05252'];
const PAGE_COLORS = ['#fdf8ef', '#ffffff', '#e8e0f0', '#e0f0e8', '#f0e0e8', '#e0e8f0', '#d4c4a0', '#1a1612'];
const MOODS = ['😊', '😌', '😤', '🤩', '😢', '🥱', '💪', '😔'];

// Template field definitions
const TEMPLATE_FIELDS: Record<string, { label: string; placeholder: string; multiline?: boolean }[]> = {
  'Classic Diary': [
    { label: 'Today\'s entry', placeholder: 'Write about your day...', multiline: true },
    { label: 'Highlight 1', placeholder: 'Best moment today' },
    { label: 'Highlight 2', placeholder: 'Something you learned' },
    { label: 'Highlight 3', placeholder: 'What you\'re grateful for' },
  ],
  'Morning Pages': [
    { label: 'Stream of consciousness', placeholder: 'Write whatever comes to mind...', multiline: true },
    { label: 'Today\'s intention', placeholder: 'What do you want to focus on?' },
  ],
  'Reflection': [
    { label: 'What went well?', placeholder: '...', multiline: true },
    { label: 'What could be better?', placeholder: '...', multiline: true },
    { label: 'What did I learn?', placeholder: '...' },
    { label: 'What will I do differently?', placeholder: '...' },
  ],
  'Gratitude Log': [
    { label: 'Gratitude 1', placeholder: 'I\'m grateful for...' },
    { label: 'Gratitude 2', placeholder: '...' },
    { label: 'Gratitude 3', placeholder: '...' },
    { label: 'Gratitude 4', placeholder: '...' },
    { label: 'Gratitude 5', placeholder: '...' },
    { label: 'Why I appreciate this', placeholder: '...', multiline: true },
  ],
  'Daily Devotion': [
    { label: 'Today\'s verse', placeholder: 'Enter the verse...', multiline: true },
    { label: 'What it means', placeholder: '...', multiline: true },
    { label: 'How to apply it', placeholder: '...' },
    { label: 'Prayer', placeholder: '...', multiline: true },
  ],
  'Prayer Journal': [
    { label: 'Praise', placeholder: 'What I\'m thankful for...', multiline: true },
    { label: 'Confession', placeholder: '...', multiline: true },
    { label: 'Requests', placeholder: 'What I\'m praying for...', multiline: true },
    { label: 'Answered prayers', placeholder: '...' },
  ],
  'Daily Expenses': [
    { label: 'Expenses', placeholder: 'Item - ₦amount - category', multiline: true },
    { label: 'Income today', placeholder: '₦' },
    { label: 'Total spent', placeholder: '₦' },
    { label: 'Notes', placeholder: '...' },
  ],
  'Daily Wellness': [
    { label: 'Mood', placeholder: 'How are you feeling?' },
    { label: 'Body feeling', placeholder: '...' },
    { label: 'Health actions', placeholder: 'What did you do for your health?' },
    { label: 'Notes', placeholder: '...', multiline: true },
  ],
  'Mood Tracker': [
    { label: 'Current mood', placeholder: 'How are you feeling?' },
    { label: 'Influences', placeholder: 'What\'s affecting your mood?' },
    { label: 'What would help', placeholder: '...' },
    { label: 'Notes', placeholder: '...', multiline: true },
  ],
};

export default function JournalBookScreen() {
  const router = useRouter();
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { type } = useLocalSearchParams<{ type: string }>();
  const bookType = type || 'personal';
  const config = BOOK_CONFIG[bookType] || BOOK_CONFIG.personal;

  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTemplate, setSelectedTemplate] = useState('Blank Page');
  const [content, setContent] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [mood, setMood] = useState<string | null>(null);
  const [water, setWater] = useState(0);
  const [stickers, setStickers] = useState<{ emoji: string; x: number; y: number }[]>([]);
  const [stickyNotes, setStickyNotes] = useState<{ text: string; color: string; x: number; y: number }[]>([]);
  const [showStickerModal, setShowStickerModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState('lined');
  const [selectedAccent, setSelectedAccent] = useState(0);
  const [selectedPageColor, setSelectedPageColor] = useState(0);
  const [lumiInput, setLumiInput] = useState('');
  const [lumiResponse, setLumiResponse] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  const fetchEntries = useCallback(async () => {
    try {
      const dateStr = currentDate.toISOString().slice(0, 10);
      const res = await apiClient.get(`/api/journal/pages?journal_type=${bookType}&from=${dateStr}&to=${dateStr}`);
      const dayEntries = res.data?.entries || [];
      setEntries(dayEntries);
      if (dayEntries.length > 0) {
        const entry = dayEntries[0];
        // Text/mood/water are stored inside `fields` (the backend has no
        // top-level content column), so read them back out of fields.
        setContent(entry.fields?.freewrite ?? entry.content ?? '');
        setFields(entry.fields || {});
        setMood(entry.fields?.mood ?? entry.mood ?? null);
        setWater(entry.fields?.water ?? entry.water ?? 0);
      } else {
        setContent('');
        setFields({});
        setMood(null);
        setWater(0);
      }
    } catch (err) { console.error('Error fetching entries:', err); }
    finally { setLoading(false); }
  }, [bookType, currentDate]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  // Auto-save
  const triggerAutoSave = () => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => savePage(), 1500);
  };

  const savePage = async () => {
    setSaving(true);
    try {
      await apiClient.post('/api/journal/pages', {
        journal_type: bookType,
        // Backend REQUIRES `template_name` (not `template`) — sending the wrong
        // key made every save fail validation with a 400. It also only persists
        // `fields`, so fold the free-write text, mood and water into fields.
        template_name: selectedTemplate || 'Free Write',
        fields: { ...fields, freewrite: content, mood, water },
        entry_date: currentDate.toISOString().slice(0, 10),
      });
      setLastSaved(new Date());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) { console.error('Error saving:', err); }
    setSaving(false);
  };

  const handleContentChange = (text: string) => {
    setContent(text);
    triggerAutoSave();
  };

  const handleFieldChange = (key: string, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    triggerAutoSave();
  };

  // Date navigation
  const goToPrevDay = () => {
    const d = new Date(currentDate); d.setDate(d.getDate() - 1); setCurrentDate(d);
  };
  const goToNextDay = () => {
    const d = new Date(currentDate); d.setDate(d.getDate() + 1); setCurrentDate(d);
  };
  const goToToday = () => setCurrentDate(new Date());

  // 7-day strip
  const getDayStrip = () => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentDate); d.setDate(currentDate.getDate() - 3 + i);
      return { date: d, dateStr: d.toISOString().slice(0, 10), isToday: d.toDateString() === new Date().toDateString(), isSelected: d.toDateString() === currentDate.toDateString() };
    });
  };

  // Lumi AI
  const askLumi = async () => {
    if (!lumiInput.trim()) return;
    setLumiResponse('Thinking...');
    try {
      const res = await apiClient.post('/api/lumi/chat', { text: `In my ${config.title} journal, ${lumiInput}` });
      setLumiResponse(res.data?.message || res.data?.response || 'Done!');
    } catch { setLumiResponse('Could not reach Lumi.'); }
  };

  // Add sticker
  const addSticker = (emoji: string) => {
    setStickers((prev) => [...prev, { emoji, x: Math.random() * 200 + 50, y: Math.random() * 200 + 100 }]);
    setShowStickerModal(false);
  };

  // Add sticky note
  const addStickyNote = () => {
    const colors = ['#fef3c7', '#dbeafe', '#fce7f3', '#d1fae5', '#ede9fe'];
    setStickyNotes((prev) => [...prev, { text: 'Note...', color: colors[prev.length % colors.length], x: 50, y: 300 + prev.length * 80 }]);
  };

  const isToday = currentDate.toDateString() === new Date().toDateString();

  if (loading) {
    return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color={config.accent} /></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: `${config.accent}20` }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={c.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerEmoji}>{config.emoji}</Text>
            <Text style={styles.headerTitle}>{config.title}</Text>
          </View>
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: config.accent }]} onPress={savePage}>
            <Text style={styles.saveBtnText}>{saving ? '...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        {/* Date Navigation */}
        <View style={styles.dateNav}>
          <TouchableOpacity onPress={goToPrevDay}><Ionicons name="chevron-back" size={18} color={c.textSecondary} /></TouchableOpacity>
          <TouchableOpacity onPress={goToToday}>
            <Text style={[styles.dateText, isToday && { color: config.accent }]}>{isToday ? 'Today' : currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={goToNextDay}><Ionicons name="chevron-forward" size={18} color={c.textSecondary} /></TouchableOpacity>
        </View>

        {/* 7-day strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayStrip}>
          {getDayStrip().map((day) => (
            <TouchableOpacity key={day.dateStr} style={[styles.dayChip, day.isSelected && { backgroundColor: config.accent, borderColor: config.accent }]} onPress={() => setCurrentDate(day.date)}>
              <Text style={[styles.dayChipText, day.isSelected && { color: '#080503', fontWeight: '700' }]}>{day.date.getDate()}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Template Selector */}
        <TouchableOpacity style={styles.templateBtn} onPress={() => setShowTemplateModal(true)}>
          <Ionicons name="document-text-outline" size={16} color={config.accent} />
          <Text style={[styles.templateBtnText, { color: config.accent }]}>{selectedTemplate}</Text>
          <Ionicons name="chevron-down" size={14} color={c.textMuted} />
        </TouchableOpacity>

        {/* Mood & Water */}
        <View style={styles.metaRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moodRow}>
            {MOODS.map((m) => (
              <TouchableOpacity key={m} style={[styles.moodBtn, mood === m && { backgroundColor: `${config.accent}30`, borderColor: config.accent }]} onPress={() => { setMood(m); triggerAutoSave(); }}>
                <Text style={styles.moodEmoji}>{m}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.waterRow}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((d) => (
              <TouchableOpacity key={d} onPress={() => { setWater(d); triggerAutoSave(); }}>
                <Text style={[styles.waterDrop, d <= water && { color: config.accent }]}>💧</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Content Area */}
        <ScrollView style={styles.contentArea} contentContainerStyle={styles.contentAreaContainer}>
          {/* Template Fields */}
          {selectedTemplate !== 'Blank Page' && TEMPLATE_FIELDS[selectedTemplate] && (
            <View style={styles.fieldsContainer}>
              {TEMPLATE_FIELDS[selectedTemplate].map((field, i) => (
                <View key={i} style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <TextInput
                    style={[styles.fieldInput, field.multiline && styles.fieldInputMultiline]}
                    placeholder={field.placeholder}
                    placeholderTextColor={c.textMuted}
                    value={fields[field.label] || ''}
                    onChangeText={(text) => handleFieldChange(field.label, text)}
                    multiline={field.multiline}
                  />
                </View>
              ))}
            </View>
          )}

          {/* Main content (for Blank Page or additional notes) */}
          <TextInput
            style={[styles.mainInput, { minHeight: selectedTemplate === 'Blank Page' ? 300 : 120 }]}
            placeholder={selectedTemplate === 'Blank Page' ? 'Start writing...' : 'Additional notes...'}
            placeholderTextColor={c.textMuted}
            value={content}
            onChangeText={handleContentChange}
            multiline
          />

          {/* Stickers */}
          {stickers.map((s, i) => (
            <View key={i} style={[styles.placedSticker, { left: s.x, top: s.y }]}>
              <Text style={styles.placedStickerEmoji}>{s.emoji}</Text>
            </View>
          ))}

          {/* Sticky Notes */}
          {stickyNotes.map((n, i) => (
            <View key={i} style={[styles.stickyNote, { backgroundColor: n.color, left: n.x, top: n.y }]}>
              <TextInput style={styles.stickyNoteText} value={n.text} onChangeText={(text) => { const updated = [...stickyNotes]; updated[i].text = text; setStickyNotes(updated); }} multiline />
            </View>
          ))}

          {/* Lumi AI Response */}
          {lumiResponse && (
            <View style={styles.lumiResponseCard}>
              <LumiFace mood="resting" size={20} />
              <Text style={styles.lumiResponseText}>{lumiResponse}</Text>
            </View>
          )}
        </ScrollView>

        {/* Bottom Toolbar */}
        <View style={styles.toolbar}>
          <TouchableOpacity style={styles.toolBtn} onPress={() => setShowStickerModal(true)}>
            <Ionicons name="happy-outline" size={20} color={c.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolBtn} onPress={addStickyNote}>
            <Ionicons name="document-text-outline" size={20} color={c.textSecondary} />
          </TouchableOpacity>
          <VoiceCapture onTranscription={(text) => setContent((prev) => prev + ' ' + text)} size={36} />
          <TextInput style={styles.lumiInput} placeholder="Ask Lumi..." placeholderTextColor={c.textMuted} value={lumiInput} onChangeText={setLumiInput} onSubmitEditing={askLumi} />
          <TouchableOpacity style={[styles.lumiSendBtn, { backgroundColor: config.accent }]} onPress={askLumi}>
            <Ionicons name="send" size={16} color="#080503" />
          </TouchableOpacity>
        </View>

        {/* Save indicator */}
        {lastSaved && (
          <Text style={styles.savedIndicator}>Saved {lastSaved.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</Text>
        )}
      </KeyboardAvoidingView>

      {/* Sticker Modal */}
      <Modal visible={showStickerModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Stickers</Text>
            <View style={styles.stickerGrid}>
              {config.stickers.map((emoji) => (
                <TouchableOpacity key={emoji} style={styles.stickerBtn} onPress={() => addSticker(emoji)}>
                  <Text style={styles.stickerEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowStickerModal(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Template Modal */}
      <Modal visible={showTemplateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Templates</Text>
            {config.templates.map((tmpl) => (
              <TouchableOpacity key={tmpl} style={[styles.templateOption, selectedTemplate === tmpl && { backgroundColor: `${config.accent}20` }]} onPress={() => { setSelectedTemplate(tmpl); setShowTemplateModal(false); }}>
                <Text style={[styles.templateOptionText, selectedTemplate === tmpl && { color: config.accent }]}>{tmpl}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowTemplateModal(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (c: ColorScheme) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  flex: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  headerEmoji: { fontSize: 22 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: c.textPrimary },
  saveBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14 },
  saveBtnText: { fontSize: 12, fontWeight: '600', color: '#080503' },
  dateNav: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, paddingVertical: 8 },
  dateText: { fontSize: 14, fontWeight: '600', color: c.textPrimary },
  dayStrip: { paddingHorizontal: 16, gap: 6, marginBottom: 8 },
  dayChip: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: c.border },
  dayChipText: { fontSize: 12, color: c.textSecondary },
  templateBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, backgroundColor: c.card, marginBottom: 8 },
  templateBtnText: { fontSize: 12, fontWeight: '500' },
  metaRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8, gap: 12 },
  moodRow: { gap: 4 },
  moodBtn: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  moodEmoji: { fontSize: 14 },
  waterRow: { flexDirection: 'row', gap: 2 },
  waterDrop: { fontSize: 14, opacity: 0.3 },
  contentArea: { flex: 1, paddingHorizontal: 16 },
  contentAreaContainer: { paddingBottom: 20 },
  fieldsContainer: { marginBottom: 12 },
  fieldGroup: { marginBottom: 10 },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  fieldInput: { backgroundColor: c.card, borderRadius: 8, padding: 10, color: c.textPrimary, fontSize: 14 },
  fieldInputMultiline: { minHeight: 60, textAlignVertical: 'top' },
  mainInput: { backgroundColor: c.card, borderRadius: 10, padding: 14, color: c.textPrimary, fontSize: 15, lineHeight: 22, textAlignVertical: 'top' },
  placedSticker: { position: 'absolute' },
  placedStickerEmoji: { fontSize: 28 },
  stickyNote: { position: 'absolute', width: 120, padding: 8, borderRadius: 6 },
  stickyNoteText: { fontSize: 11, color: '#1a1612' },
  lumiResponseCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(200,149,92,0.06)', borderRadius: 10, padding: 10, marginTop: 12 },
  lumiResponseText: { flex: 1, fontSize: 12, color: c.textPrimary, lineHeight: 16 },
  toolbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: c.border, gap: 8 },
  toolBtn: { padding: 6 },
  lumiInput: { flex: 1, height: 36, backgroundColor: c.card, borderRadius: 18, paddingHorizontal: 12, color: c.textPrimary, fontSize: 12 },
  lumiSendBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  savedIndicator: { textAlign: 'center', fontSize: 10, color: c.textMuted, paddingBottom: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: c.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '60%' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: c.textPrimary, marginBottom: 16 },
  stickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stickerBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.card, justifyContent: 'center', alignItems: 'center' },
  stickerEmoji: { fontSize: 24 },
  templateOption: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, marginBottom: 4 },
  templateOptionText: { fontSize: 14, color: c.textPrimary },
  modalClose: { marginTop: 16, alignItems: 'center' },
  modalCloseText: { fontSize: 14, color: c.textMuted },
});
