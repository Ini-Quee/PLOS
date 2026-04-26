/**
 * Local Storage Utilities
 *
 * Wrapper around localStorage with type safety and error handling.
 * Handles daily usage limits for freemium model.
 */

// Storage keys as constants to prevent typos
export const STORAGE_KEYS = {
  USER_PROFILE: 'user_profile',
  USAGE_LIMITS: 'usage_limits',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  AI_NAME: 'ai_name',
  USER_ROLE: 'user_role',
  THEME_PREFERENCE: 'theme_preference',
  LAST_SYNC: 'last_sync',
  ACCESS_TOKEN: 'accessToken',
  USER: 'user',
  LUMI_CONVERSATION: 'lumi_conversation',
  LUMI_NAME: 'lumi_name',
  PLOS_BACKGROUND_THEME: 'plos_background_theme',
  PLOS_LIVING_BACKGROUND: 'plos_living_background',
};

/**
 * Save any value to local storage
 * Automatically stringifies objects
 */
export const saveLocal = async (key, value) => {
  try {
    const stringValue = JSON.stringify(value);
    localStorage.setItem(key, stringValue);
  } catch (error) {
    console.error(`Failed to save ${key} to storage:`, error);
    // Don't throw - storage failures shouldn't crash the app
  }
};

/**
 * Get a value from local storage
 * Automatically parses JSON
 * Returns null if key doesn't exist or parsing fails
 */
export const getLocal = (key) => {
  try {
    const value = localStorage.getItem(key);
    if (value === null) return null;
    return JSON.parse(value);
  } catch (error) {
    console.error(`Failed to get ${key} from storage:`, error);
    return null;
  }
};

/**
 * Remove a specific key from storage
 */
export const removeLocal = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove ${key} from storage:`, error);
  }
};

/**
 * Clear all app data from storage
 * Used on logout
 */
export const clearAll = () => {
  try {
    localStorage.clear();
    console.log('All local storage cleared');
  } catch (error) {
    console.error('Failed to clear storage:', error);
  }
};

// ═══════════════════════════════════════
// USAGE LIMITS MANAGEMENT (FREEMIUM)
// ═══════════════════════════════════════

/**
 * Get default usage limits for free tier
 */
const getDefaultLimits = () => ({
  voiceEntriesToday: 0,
  photoScansToday: 0,
  maxVoiceFree: 5,
  maxPhotosFree: 2,
  lastResetDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
});

/**
 * Save usage limits to storage
 */
export const saveUsageLimits = async (limits) => {
  await saveLocal(STORAGE_KEYS.USAGE_LIMITS, limits);
};

/**
 * Get current usage limits
 * Returns default limits if none saved
 */
export const getUsageLimits = async () => {
  const limits = getLocal(STORAGE_KEYS.USAGE_LIMITS);
  if (!limits) {
    const defaults = getDefaultLimits();
    await saveUsageLimits(defaults);
    return defaults;
  }

  // Check if we need to reset daily limits (new day)
  const today = new Date().toISOString().split('T')[0];
  if (limits.lastResetDate !== today) {
    const resetLimits = {
      ...limits,
      voiceEntriesToday: 0,
      photoScansToday: 0,
      lastResetDate: today,
    };
    await saveUsageLimits(resetLimits);
    return resetLimits;
  }

  return limits;
};

/**
 * Increment voice entry usage counter
 * Returns false if user has hit their limit (free tier)
 * Returns true if increment successful
 */
export const incrementVoiceUsage = async (userPlan = 'free') => {
  // Premium users have unlimited
  if (userPlan === 'growth' || userPlan === 'pro') {
    return true;
  }

  const limits = await getUsageLimits();

  // Check if user has exceeded free limit
  if (limits.voiceEntriesToday >= limits.maxVoiceFree) {
    return false; // Blocked - need to upgrade
  }

  // Increment and save
  const updatedLimits = {
    ...limits,
    voiceEntriesToday: limits.voiceEntriesToday + 1,
  };
  await saveUsageLimits(updatedLimits);
  return true; // Allowed
};

/**
 * Increment photo scan usage counter
 * Returns false if user has hit their limit
 */
export const incrementPhotoUsage = async (userPlan = 'free') => {
  // Premium users have unlimited
  if (userPlan === 'growth' || userPlan === 'pro') {
    return true;
  }

  const limits = await getUsageLimits();

  // Check if user has exceeded free limit
  if (limits.photoScansToday >= limits.maxPhotosFree) {
    return false; // Blocked
  }

  // Increment and save
  const updatedLimits = {
    ...limits,
    photoScansToday: limits.photoScansToday + 1,
  };
  await saveUsageLimits(updatedLimits);
  return true; // Allowed
};

/**
 * Manually reset daily limits
 * Called at midnight or on app open if new day
 */
export const resetDailyLimits = async () => {
  const limits = await getUsageLimits();
  const today = new Date().toISOString().split('T')[0];

  if (limits.lastResetDate !== today) {
    const resetLimits = {
      ...limits,
      voiceEntriesToday: 0,
      photoScansToday: 0,
      lastResetDate: today,
    };
    await saveUsageLimits(resetLimits);
    console.log('Daily usage limits reset');
  }
};

// Export storage keys for use in other modules
export default {
  saveLocal,
  getLocal,
  removeLocal,
  clearAll,
  STORAGE_KEYS,
  saveUsageLimits,
  getUsageLimits,
  incrementVoiceUsage,
  incrementPhotoUsage,
  resetDailyLimits,
};
