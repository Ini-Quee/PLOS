/**
 * PLOS Type Definitions
 *
 * Central type system for the entire application.
 * All API responses, store state, and component props reference these.
 */

// ═══════════════════════════════════════
// USER & AUTHENTICATION
// ═══════════════════════════════════════

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  aiName: string;
  plan: SubscriptionPlan;
  createdAt: string;
}

export type UserRole =
  | 'personal'
  | 'student'
  | 'doctor'
  | 'creator'
  | 'other';

export type SubscriptionPlan =
  | 'free'
  | 'growth'
  | 'pro';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

// ═══════════════════════════════════════
// JOURNAL
// ═══════════════════════════════════════

export interface JournalEntry {
  id: string;
  recordedAt: string;
  aiMood: string | null;
  aiSummary: string | null;
  wordCount: number;
  durationSeconds?: number;
  encryptedContent?: string;
  decryptedContent?: string;
  encryptionIv?: string;
  encryptionSalt?: string;
}

export interface CreateJournalEntryPayload {
  encryptedContent: string;
  encryptionIv: string;
  encryptionSalt: string;
  wordCount: number;
  durationSeconds: number;
  recordedAt: string;
}

// ═══════════════════════════════════════
// HABITS
// ═══════════════════════════════════════

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  streak: number;
  completedToday: boolean;
  category: HabitCategory;
  createdAt: string;
}

export type HabitCategory =
  | 'health'
  | 'faith'
  | 'productivity'
  | 'finance'
  | 'social'
  | 'personal';

export interface HabitCompletion {
  habitId: string;
  completedAt: string;
}

// ═══════════════════════════════════════
// BUDGET
// ═══════════════════════════════════════

export interface BudgetEntry {
  id: string;
  amount: number;
  category: BudgetCategory;
  note: string;
  date: string;
  type: 'expense' | 'income';
  currency: Currency;
}

export type BudgetCategory =
  | 'essential' // Rent, utilities, groceries
  | 'important' // Transport, phone, internet
  | 'lifestyle'; // Entertainment, dining, shopping

export type Currency = 'NGN' | 'USD' | 'GBP' | 'EUR';

export interface BudgetSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  byCategory: {
    essential: number;
    important: number;
    lifestyle: number;
  };
}

// ═══════════════════════════════════════
// DAILY PLANNING
// ═══════════════════════════════════════

export interface DailyPlan {
  id: string;
  title: string;
  time: string;
  completed: boolean;
  icon: string;
  category?: string;
}

export interface SleepTarget {
  targetBedtime: string; // "10:30 PM"
  targetWakeup: string; // "6:00 AM"
  windDownMinutes: number;
}

// ═══════════════════════════════════════
// USAGE LIMITS (FREEMIUM)
// ═══════════════════════════════════════

export interface UsageLimits {
  voiceEntriesToday: number;
  photoScansToday: number;
  maxVoiceFree: number;
  maxPhotosFree: number;
  lastResetDate: string;
}

export interface UsageCheckResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  requiresUpgrade: boolean;
}

// ═══════════════════════════════════════
// ONBOARDING
// ═══════════════════════════════════════

export interface OnboardingData {
  name: string;
  role: UserRole;
  aiName: string;
  selectedHabits: string[];
  completedAt?: string;
}

export interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  isComplete: boolean;
}

// ═══════════════════════════════════════
// APP STATE
// ═══════════════════════════════════════

export interface AppState {
  aiName: string;
  userRole: UserRole;
  dailyPlan: DailyPlan[];
  habits: Habit[];
  lifeScore: number;
  hasCompletedOnboarding: boolean;
  sleepTarget: SleepTarget;
}

// ═══════════════════════════════════════
// API RESPONSES
// ═══════════════════════════════════════

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ═══════════════════════════════════════
// ERRORS
// ═══════════════════════════════════════

export type ApiErrorCode =
  | 'SESSION_EXPIRED'
  | 'NO_INTERNET'
  | 'TIMEOUT'
  | 'SERVER_ERROR'
  | 'VALIDATION_ERROR'
  | 'LIMIT_EXCEEDED'
  | 'UNAUTHORIZED';

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  details?: any;
}

// ═══════════════════════════════════════
// JOURNAL BOOK TYPES (NEW)
// ═══════════════════════════════════════

export type JournalType =
  | 'daily'
  | 'budget'
  | 'planner'
  | 'study'
  | 'prayer'
  | 'fitness';

export type JournalCoverStyle =
  | 'leather-brown'
  | 'leather-black'
  | 'fabric-blue'
  | 'fabric-green'
  | 'minimal-white'
  | 'vintage-red'
  | 'craft-brown'
  | 'marble-black';

export interface JournalBook {
  id: string;
  title: string;
  type: JournalType;
  coverStyle: JournalCoverStyle;
  createdAt: string;
  updatedAt: string;
  entryCount: number;
  color: string;
  icon: string;
}

export interface JournalTemplate {
  name: string;
  icon: string;
  color: string;
  coverStyle: JournalCoverStyle;
  paperTexture: 'cream' | 'white';
  fontFamily: string;
  placeholder: string;
}
