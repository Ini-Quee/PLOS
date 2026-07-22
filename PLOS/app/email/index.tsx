import { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView,
  ActivityIndicator, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import apiClient from '../../services/api';

interface EmailBlock {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  sending: boolean;
  sent: boolean;
}

export default function EmailComposeScreen() {
  const [context, setContext] = useState('');
  const [emails, setEmails] = useState<EmailBlock[]>([]);
  const [parsing, setParsing] = useState(false);
  const [sendingAll, setSendingAll] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(true);

  const parseContext = async () => {
    if (!context.trim()) return;
    setParsing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await apiClient.post('/api/gmail/extract', { context: context.trim() });
      const parsed = res.data?.emails || res.data?.drafts || [];
      const blocks: EmailBlock[] = parsed.map((e: any, i: number) => ({
        id: `email-${Date.now()}-${i}`,
        recipient: e.recipient || '',
        subject: e.subject || '',
        body: e.body || '',
        sending: false,
        sent: false,
      }));
      if (blocks.length === 0) {
        blocks.push({
          id: `email-${Date.now()}`,
          recipient: '',
          subject: '',
          body: '',
          sending: false,
          sent: false,
        });
      }
      setEmails(blocks);
    } catch (err) {
      console.error('Error parsing context:', err);
      setEmails([{
        id: `email-${Date.now()}`,
        recipient: '',
        subject: '',
        body: '',
        sending: false,
        sent: false,
      }]);
    }
    setParsing(false);
  };

  const updateEmail = (id: string, field: keyof EmailBlock, value: string) => {
    setEmails((prev) => prev.map((e) => e.id === id ? { ...e, [field]: value } : e));
  };

  const addEmailBlock = () => {
    setEmails((prev) => [...prev, {
      id: `email-${Date.now()}`,
      recipient: '',
      subject: '',
      body: '',
      sending: false,
      sent: false,
    }]);
  };

  const removeEmail = (id: string) => {
    setEmails((prev) => prev.filter((e) => e.id !== id));
  };

  const sendEmail = async (id: string) => {
    const email = emails.find((e) => e.id === id);
    if (!email || !email.recipient || !email.subject || !email.body) return;
    setEmails((prev) => prev.map((e) => e.id === id ? { ...e, sending: true } : e));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await apiClient.post('/api/gmail/send', {
        to: email.recipient,
        subject: email.subject,
        body: email.body,
      });
      setEmails((prev) => prev.map((e) => e.id === id ? { ...e, sending: false, sent: true } : e));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Error sending email:', err);
      setEmails((prev) => prev.map((e) => e.id === id ? { ...e, sending: false } : e));
      Alert.alert('Error', 'Failed to send email.');
    }
  };

  const sendAll = async () => {
    const unsent = emails.filter((e) => !e.sent && e.recipient && e.subject && e.body);
    if (unsent.length === 0) return;
    setSendingAll(true);
    for (const email of unsent) {
      await sendEmail(email.id);
    }
    setSendingAll(false);
  };

  const unsentCount = emails.filter((e) => !e.sent && e.recipient && e.subject && e.body).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Email Compose</Text>
        {emails.length > 0 && (
          <TouchableOpacity style={styles.addBtn} onPress={addEmailBlock}>
            <Ionicons name="add" size={22} color={Colors.amber} />
          </TouchableOpacity>
        )}
      </View>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {!gmailConnected && (
          <View style={styles.noticeCard}>
            <Ionicons name="warning" size={20} color={Colors.coral} />
            <View style={styles.noticeInfo}>
              <Text style={styles.noticeTitle}>Gmail Not Connected</Text>
              <Text style={styles.noticeText}>Connect your Gmail account in Settings to send emails.</Text>
            </View>
          </View>
        )}
        <View style={styles.contextCard}>
          <Text style={styles.sectionTitle}>SMART COMPOSE</Text>
          <Text style={styles.contextHint}>Paste your client context below. Lumi will extract recipient, subject, and body.</Text>
          <TextInput
            style={styles.contextInput}
            placeholder="Paste context here..."
            placeholderTextColor={Colors.textMuted}
            value={context}
            onChangeText={setContext}
            multiline
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.parseBtn, !context.trim() && { opacity: 0.5 }]}
            onPress={parseContext}
            disabled={!context.trim() || parsing}
          >
            {parsing ? (
              <ActivityIndicator size="small" color="#080503" />
            ) : (
              <Ionicons name="sparkles" size={16} color="#080503" />
            )}
            <Text style={styles.parseBtnText}>{parsing ? 'Parsing...' : 'Lumi Parse'}</Text>
          </TouchableOpacity>
        </View>
        {emails.map((email, index) => (
          <View key={email.id} style={[styles.emailCard, email.sent && styles.emailSent]}>
            <View style={styles.emailHeader}>
              <Text style={styles.emailNumber}>Email {index + 1}</Text>
              {email.sent && (
                <View style={styles.sentBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.green} />
                  <Text style={styles.sentText}>Sent</Text>
                </View>
              )}
              {!email.sent && (
                <TouchableOpacity onPress={() => removeEmail(email.id)}>
                  <Ionicons name="trash-outline" size={16} color={Colors.coral} />
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={styles.emailInput}
              placeholder="Recipient email"
              placeholderTextColor={Colors.textMuted}
              value={email.recipient}
              onChangeText={(v) => updateEmail(email.id, 'recipient', v)}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!email.sent}
            />
            <TextInput
              style={styles.emailInput}
              placeholder="Subject"
              placeholderTextColor={Colors.textMuted}
              value={email.subject}
              onChangeText={(v) => updateEmail(email.id, 'subject', v)}
              editable={!email.sent}
            />
            <TextInput
              style={[styles.emailInput, { minHeight: 80 }]}
              placeholder="Body"
              placeholderTextColor={Colors.textMuted}
              value={email.body}
              onChangeText={(v) => updateEmail(email.id, 'body', v)}
              multiline
              textAlignVertical="top"
              editable={!email.sent}
            />
            {!email.sent && (
              <TouchableOpacity
                style={[styles.sendBtn, (!email.recipient || !email.subject || !email.body) && { opacity: 0.5 }]}
                onPress={() => sendEmail(email.id)}
                disabled={!email.recipient || !email.subject || !email.body || email.sending}
              >
                {email.sending ? (
                  <ActivityIndicator size="small" color="#080503" />
                ) : (
                  <Ionicons name="send" size={14} color="#080503" />
                )}
                <Text style={styles.sendBtnText}>{email.sending ? 'Sending...' : 'Send'}</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        {emails.length === 0 && !parsing && (
          <View style={styles.emptyState}>
            <Ionicons name="mail-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Smart Email Composer</Text>
            <Text style={styles.emptyText}>Paste client context above and let Lumi draft your emails</Text>
          </View>
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>
      {unsentCount > 1 && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.sendAllBtn} onPress={sendAll} disabled={sendingAll}>
            {sendingAll ? (
              <ActivityIndicator size="small" color="#080503" />
            ) : (
              <Ionicons name="send" size={16} color="#080503" />
            )}
            <Text style={styles.sendAllText}>{sendingAll ? 'Sending...' : `Send All (${unsentCount})`}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: Typography.title.fontSize, fontWeight: Typography.title.fontWeight, color: Colors.textPrimary },
  addBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(200,149,92,0.12)', justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingBottom: 100 },
  noticeCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(224,82,82,0.1)', borderRadius: 12, padding: 14, marginBottom: 16 },
  noticeInfo: { flex: 1 },
  noticeTitle: { fontSize: Typography.caption.fontSize, fontWeight: '600', color: Colors.coral },
  noticeText: { fontSize: Typography.micro.fontSize, color: Colors.textMuted, marginTop: 2 },
  contextCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: Typography.micro.fontSize, fontWeight: '600', color: Colors.textMuted, letterSpacing: 0.5, marginBottom: 6 },
  contextHint: { fontSize: Typography.caption.fontSize, color: Colors.textSecondary, marginBottom: 12, lineHeight: 18 },
  contextInput: { backgroundColor: Colors.background, borderRadius: 12, padding: 14, color: Colors.textPrimary, fontSize: Typography.body.fontSize, minHeight: 100, textAlignVertical: 'top', marginBottom: 12 },
  parseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.amber, padding: 14, borderRadius: 12 },
  parseBtnText: { fontSize: Typography.body.fontSize, fontWeight: '600', color: '#080503' },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: Typography.subtitle.fontSize, fontWeight: '600', color: Colors.textPrimary },
  emptyText: { fontSize: Typography.caption.fontSize, color: Colors.textMuted, textAlign: 'center' },
  emailCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 14, marginBottom: 10 },
  emailSent: { opacity: 0.7 },
  emailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  emailNumber: { fontSize: Typography.caption.fontSize, fontWeight: '600', color: Colors.amber },
  sentBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sentText: { fontSize: Typography.micro.fontSize, color: Colors.green, fontWeight: '600' },
  emailInput: { backgroundColor: Colors.background, borderRadius: 10, padding: 12, color: Colors.textPrimary, fontSize: Typography.caption.fontSize, marginBottom: 8 },
  sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.amber, padding: 10, borderRadius: 10, marginTop: 4 },
  sendBtnText: { fontSize: Typography.caption.fontSize, fontWeight: '600', color: '#080503' },
  bottomPadding: { height: 20 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: Colors.background },
  sendAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.amber, padding: 16, borderRadius: 14 },
  sendAllText: { fontSize: Typography.body.fontSize, fontWeight: '600', color: '#080503' },
});
