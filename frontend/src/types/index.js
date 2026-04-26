/**
 * PLOS Type Definitions
 *
 * Central type system for the entire application.
 * All API responses, store state, and component props reference these.
 */

// ═══════════════════════════════════════
// USER & AUTHENTICATION
// ═══════════════════════════════════════

export const UserRole = {
  PERSONAL: 'personal',
  STUDENT: 'student',
  DOCTOR: 'doctor',
  CREATOR: 'creator',
  OTHER: 'other',
};

export const SubscriptionPlan = {
  FREE: 'free',
  GROWTH: 'growth',
  PRO: 'pro',
};

// ═══════════════════════════════════════
// JOURNAL
// ═══════════════════════════════════════

export const JournalType = {
  DAILY: 'daily',
  BUDGET: 'budget',
  PLANNER: 'planner',
  STUDY: 'study',
  PRAYER: 'prayer',
  FITNESS: 'fitness',
};

export const JournalCoverStyle = {
  LEATHER_BROWN: 'leather-brown',
  LEATHER_BLACK: 'leather-black',
  FABRIC_BLUE: 'fabric-blue',
  FABRIC_GREEN: 'fabric-green',
  MINIMAL_WHITE: 'minimal-white',
  VINTAGE_RED: 'vintage-red',
  CRAFT_BROWN: 'craft-brown',
  MARBLE_BLACK: 'marble-black',
};

// ═══════════════════════════════════════
// HABITS
// ═══════════════════════════════════════

export const HabitCategory = {
  HEALTH: 'health',
  FAITH: 'faith',
  PRODUCTIVITY: 'productivity',
  FINANCE: 'finance',
  SOCIAL: 'social',
  PERSONAL: 'personal',
};

// ═══════════════════════════════════════
// BUDGET
// ═══════════════════════════════════════

export const BudgetCategory = {
  ESSENTIAL: 'essential',
  IMPORTANT: 'important',
  LIFESTYLE: 'lifestyle',
};

export const EntryType = {
  EXPENSE: 'expense',
  INCOME: 'income',
};

export const Currency = {
  NGN: 'NGN',
  USD: 'USD',
  GBP: 'GBP',
  EUR: 'EUR',
};

// ═══════════════════════════════════════
// API ERROR CODES
// ═══════════════════════════════════════

export const ApiErrorCode = {
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  NO_INTERNET: 'NO_INTERNET',
  TIMEOUT: 'TIMEOUT',
  SERVER_ERROR: 'SERVER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  LIMIT_EXCEEDED: 'LIMIT_EXCEEDED',
  UNAUTHORIZED: 'UNAUTHORIZED',
};

// Default/empty objects for initialization
export const defaultJournalEntry = {
  id: '',
  recordedAt: new Date().toISOString(),
  aiMood: null,
  aiSummary: null,
  wordCount: 0,
  durationSeconds: 0,
  encryptedContent: '',
  decryptedContent: '',
  encryptionIv: '',
  encryptionSalt: '',
};

export const defaultBook = {
  id: '',
  title: 'Untitled',
  type: JournalType.DAILY,
  coverStyle: JournalCoverStyle.LEATHER_BROWN,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  entryCount: 0,
  color: '#8B5CF6',
};

// Journal template configurations
export const JournalTemplates = {
  [JournalType.DAILY]: {
    name: 'Daily Journal',
    icon: '📓',
    color: '#8B5CF6',
    coverStyle: JournalCoverStyle.LEATHER_BROWN,
    paperTexture: 'cream',
    fontFamily: "'Caveat', cursive",
    placeholder: 'Tell me about your day...',
  },
  [JournalType.BUDGET]: {
    name: 'Budget Book',
    icon: '💰',
    color: '#14B8A6',
    coverStyle: JournalCoverStyle.FABRIC_GREEN,
    paperTexture: 'white',
    fontFamily: "'Inter', sans-serif",
    placeholder: 'What did you spend today?',
  },
  [JournalType.PLANNER]: {
    name: 'Life Planner',
    icon: '📋',
    color: '#F5A623',
    coverStyle: JournalCoverStyle.VINTAGE_RED,
    paperTexture: 'cream',
    fontFamily: "'DM Serif Display', serif",
    placeholder: 'What are your plans?',
  },
  [JournalType.STUDY]: {
    name: 'Study Notes',
    icon: '📚',
    color: '#4A9EFF',
    coverStyle: JournalCoverStyle.FABRIC_BLUE,
    paperTexture: 'white',
    fontFamily: "'Courier Prime', monospace",
    placeholder: 'What did you learn today?',
  },
  [JournalType.PRAYER]: {
    name: 'Prayer Journal',
    icon: '🙏',
    color: '#6366F1',
    coverStyle: JournalCoverStyle.LEATHER_BLACK,
    paperTexture: 'cream',
    fontFamily: "'DM Serif Display', serif",
    placeholder: 'Speak your prayers...',
  },
  [JournalType.FITNESS]: {
    name: 'Fitness Log',
    icon: '💪',
    color: '#10B981',
    coverStyle: JournalCoverStyle.MARBLE_BLACK,
    paperTexture: 'white',
    fontFamily: "'Inter', sans-serif",
    placeholder: 'Track your workout...',
  },
};

// Export all as default
export default {
  UserRole,
  SubscriptionPlan,
  JournalType,
  JournalCoverStyle,
  HabitCategory,
  BudgetCategory,
  EntryType,
  Currency,
  ApiErrorCode,
  defaultJournalEntry,
  defaultBook,
  JournalTemplates,
};
