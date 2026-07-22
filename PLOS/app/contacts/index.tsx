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

interface Contact {
  id: string;
  name: string;
  email: string;
}

interface EmailStats {
  total_contacts: number;
  sent_today: number;
  sent_this_week: number;
}

export default function ContactsScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<EmailStats>({ total_contacts: 0, sent_today: 0, sent_this_week: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showEmail, setShowEmail] = useState<Contact | null>(null);
  const [saving, setSaving] = useState(false);

  // Add form
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');

  // Email form
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sending, setSending] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [contactsRes, statsRes] = await Promise.allSettled([
        apiClient.get('/api/contacts'),
        apiClient.get('/api/contacts/stats'),
      ]);
      if (contactsRes.status === 'fulfilled') setContacts(contactsRes.value.data?.contacts || []);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data?.stats || { total_contacts: 0, sent_today: 0, sent_this_week: 0 });
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const addContact = async () => {
    if (!newName.trim() || !newEmail.trim()) return;
    setSaving(true);
    try {
      await apiClient.post('/api/contacts', { name: newName.trim(), email: newEmail.trim() });
      setNewName('');
      setNewEmail('');
      setShowAdd(false);
      fetchData();
    } catch (err) {
      console.error('Error adding contact:', err);
    }
    setSaving(false);
  };

  const sendEmail = async () => {
    if (!showEmail || !emailSubject.trim() || !emailBody.trim()) return;
    setSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await apiClient.post('/api/contacts/email', {
        contact_id: showEmail.id,
        subject: emailSubject.trim(),
        body: emailBody.trim(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEmailSubject('');
      setEmailBody('');
      setShowEmail(null);
      fetchData();
    } catch (err) {
      console.error('Error sending email:', err);
    }
    setSending(false);
  };

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

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
        <Text style={styles.title}>Contacts</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={22} color={Colors.amber} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total_contacts}</Text>
          <Text style={styles.statLabel}>Total Contacts</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.sent_today}</Text>
          <Text style={styles.statLabel}>Sent Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.sent_this_week}</Text>
          <Text style={styles.statLabel}>Sent This Week</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.amber} />}
      >
        {contacts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No contacts yet</Text>
            <Text style={styles.emptyText}>Add contacts to start emailing</Text>
          </View>
        ) : (
          contacts.map((contact) => (
            <View key={contact.id} style={styles.contactCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitial(contact.name)}</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactEmail}>{contact.email}</Text>
              </View>
              <TouchableOpacity
                style={styles.emailBtn}
                onPress={() => { setEmailSubject(''); setEmailBody(''); setShowEmail(contact); }}
              >
                <Ionicons name="mail" size={16} color={Colors.amber} />
                <Text style={styles.emailBtnText}>Email</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Add Contact Modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Contact</Text>
            <TextInput style={styles.input} placeholder="Name" placeholderTextColor={Colors.textMuted} value={newName} onChangeText={setNewName} />
            <TextInput style={styles.input} placeholder="Email" placeholderTextColor={Colors.textMuted} value={newEmail} onChangeText={setNewEmail} keyboardType="email-address" autoCapitalize="none" />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowAdd(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSave, (!newName.trim() || !newEmail.trim()) && { opacity: 0.5 }]} onPress={addContact} disabled={!newName.trim() || !newEmail.trim() || saving}>
                <Text style={styles.modalSaveText}>{saving ? 'Adding...' : 'Add Contact'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Email Modal */}
      <Modal visible={!!showEmail} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Email {showEmail?.name}</Text>
            <Text style={styles.modalSub}>{showEmail?.email}</Text>
            <TextInput style={styles.input} placeholder="Subject" placeholderTextColor={Colors.textMuted} value={emailSubject} onChangeText={setEmailSubject} />
            <TextInput style={[styles.input, { minHeight: 100 }]} placeholder="Body" placeholderTextColor={Colors.textMuted} value={emailBody} onChangeText={setEmailBody} multiline textAlignVertical="top" />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowEmail(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSave, (!emailSubject.trim() || !emailBody.trim()) && { opacity: 0.5 }]} onPress={sendEmail} disabled={!emailSubject.trim() || !emailBody.trim() || sending}>
                <Text style={styles.modalSaveText}>{sending ? 'Sending...' : 'Send Email'}</Text>
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
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: Typography.subtitle.fontSize, fontWeight: '600', color: Colors.textPrimary },
  emptyText: { fontSize: Typography.caption.fontSize, color: Colors.textMuted },
  contactCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 14, padding: 14, marginBottom: 8, gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(200,149,92,0.15)', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700', color: Colors.amber },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  contactEmail: { fontSize: Typography.caption.fontSize, color: Colors.textMuted, marginTop: 1 },
  emailBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(200,149,92,0.12)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  emailBtnText: { fontSize: Typography.micro.fontSize, color: Colors.amber, fontWeight: '600' },
  bottomPadding: { height: 80 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 12 },
  modalTitle: { fontSize: Typography.subtitle.fontSize, fontWeight: Typography.subtitle.fontWeight, color: Colors.textPrimary },
  modalSub: { fontSize: Typography.caption.fontSize, color: Colors.textMuted },
  input: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, color: Colors.textPrimary, fontSize: Typography.body.fontSize },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  modalCancel: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: Colors.card, alignItems: 'center' },
  modalCancelText: { fontSize: Typography.body.fontSize, color: Colors.textSecondary },
  modalSave: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: Colors.amber, alignItems: 'center' },
  modalSaveText: { fontSize: Typography.body.fontSize, fontWeight: '600', color: '#080503' },
});
