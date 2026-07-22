import { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Typography } from '../../../constants/typography';
import { useThemeColors } from '../../../contexts/ThemeContext';
import type { ColorScheme } from '../../../constants/colors';
import { useAuthStore } from '../../../store/useAuthStore';
import apiClient from '../../../services/api';
import { LumiFace, VoiceCapture } from '../../../components';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const SUGGESTIONS = [
  { emoji: '🌅', label: 'Plan my morning' },
  { emoji: '🎯', label: 'Set a goal' },
  { emoji: '📖', label: 'Journal prompt' },
  { emoji: '💰', label: 'Log an expense' },
  { emoji: '🔥', label: 'Add a habit' },
];

export default function LumiScreen() {
  const user = useAuthStore((state) => state.user);
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsThinking(true);

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Wire to POST /api/lumi/chat
      const res = await apiClient.post('/api/lumi/chat', { text: text.trim() });
      const lumiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: res.data?.message || res.data?.response || "I'm here to help. Tell me more about what you need.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, lumiMessage]);
    } catch {
      const lumiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting right now. Let's try again in a moment.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, lumiMessage]);
    }
    setIsThinking(false);

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleVoiceTranscription = (text: string) => {
    sendMessage(text);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        {/* Header */}
        <View style={styles.header}>
          <LumiFace mood={isThinking ? 'thinking' : 'resting'} size={36} />
          <View style={styles.headerText}>
            <Text style={styles.title}>Talk to Lumi</Text>
            <Text style={styles.subtitle}>
              {isThinking ? 'Thinking…' : 'Your AI life companion'}
            </Text>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.length === 0 && (
            <View style={styles.emptyState}>
              <LumiFace mood="happy" size={72} />
              <Text style={styles.emptyTitle}>
                Hey {user?.name?.split(' ')[0] || 'there'}!
              </Text>
              <Text style={styles.emptyText}>
                I'm Lumi — your life companion. Talk to me about your day, goals, or anything on your mind.
              </Text>

              {/* Suggestion chips */}
              <View style={styles.suggestions}>
                {SUGGESTIONS.map((s) => (
                  <TouchableOpacity
                    key={s.label}
                    style={styles.chip}
                    onPress={() => sendMessage(s.label)}
                  >
                    <Text style={styles.chipEmoji}>{s.emoji}</Text>
                    <Text style={styles.chipLabel}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[styles.messageBubble, msg.isUser ? styles.userBubble : styles.lumiBubble]}
            >
              {!msg.isUser && (
                <View style={styles.lumiAvatar}>
                  <LumiFace mood="resting" size={24} />
                </View>
              )}
              <View style={[styles.messageContent, msg.isUser ? styles.userContent : styles.lumiContent]}>
                <Text style={[styles.messageText, msg.isUser && styles.userText]}>
                  {msg.text}
                </Text>
              </View>
            </View>
          ))}

          {isThinking && (
            <View style={[styles.messageBubble, styles.lumiBubble]}>
              <View style={styles.lumiAvatar}>
                <LumiFace mood="thinking" size={24} />
              </View>
              <View style={[styles.messageContent, styles.lumiContent]}>
                <Text style={styles.thinkingText}>Thinking…</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Voice + Text Input */}
        <View style={styles.inputBar}>
          <VoiceCapture onTranscription={handleVoiceTranscription} size={44} />
          <TextInput
            style={styles.input}
            placeholder="Type a message…"
            placeholderTextColor={c.textMuted}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => sendMessage(inputText)}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (c: ColorScheme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: Typography.subtitle.fontSize,
    fontWeight: Typography.subtitle.fontWeight,
    color: c.textPrimary,
  },
  subtitle: {
    fontSize: Typography.caption.fontSize,
    color: c.textSecondary,
    marginTop: 2,
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyTitle: {
    fontSize: Typography.title.fontSize,
    fontWeight: Typography.title.fontWeight,
    color: c.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: Typography.caption.fontSize,
    color: c.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.card,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  chipEmoji: {
    fontSize: 14,
  },
  chipLabel: {
    fontSize: Typography.caption.fontSize,
    color: c.textPrimary,
    fontWeight: '500',
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 12,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
  },
  lumiBubble: {
    alignSelf: 'flex-start',
  },
  lumiAvatar: {
    marginRight: 8,
    marginTop: 4,
  },
  messageContent: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userContent: {
    backgroundColor: c.amber,
    borderBottomRightRadius: 4,
  },
  lumiContent: {
    backgroundColor: c.card,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: Typography.body.fontSize,
    color: c.textPrimary,
    lineHeight: 22,
  },
  userText: {
    color: '#080503',
  },
  thinkingText: {
    fontSize: Typography.caption.fontSize,
    color: c.textMuted,
    fontStyle: 'italic',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: c.border,
    gap: 10,
  },
  input: {
    flex: 1,
    height: 42,
    backgroundColor: c.card,
    borderRadius: 21,
    paddingHorizontal: 16,
    color: c.textPrimary,
    fontSize: Typography.body.fontSize,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: c.amber,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendIcon: {
    fontSize: 18,
    color: '#080503',
    fontWeight: '700',
  },
});
