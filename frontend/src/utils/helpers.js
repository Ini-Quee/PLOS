/**
 * General Helper Functions
 *
 * Pure utility functions used across the app.
 * No side effects, just data transformation.
 */

import { Colors } from '../lib/colors';

/**
 * Get contextual greeting based on current time
 * Returns: "Good Morning" | "Good Afternoon" | "Good Evening" | "Good Night"
 */
export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  if (hour >= 17 && hour < 21) return 'Good Evening';
  return 'Good Night';
};

/**
 * Format date for display
 * Input: Date object (or undefined for current date)
 * Output: "Wednesday, April 16"
 */
export const formatDate = (date) => {
  const targetDate = date || new Date();
  const options = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  };
  return targetDate.toLocaleDateString('en-US', options);
};

/**
 * Format currency with proper symbol
 * Handles NGN (₦), USD ($), GBP (£), EUR (€)
 */
export const formatCurrency = (amount, currency = 'NGN') => {
  const symbols = {
    NGN: '₦',
    USD: '$',
    GBP: '£',
    EUR: '€',
  };
  const symbol = symbols[currency];
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: currency === 'NGN' ? 0 : 2,
    maximumFractionDigits: currency === 'NGN' ? 0 : 2,
  });
  return `${symbol}${formatted}`;
};

/**
 * Get theme color based on time of day
 * Used for dynamic UI elements that change with time
 */
export const getTimeOfDayColor = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return Colors.gold; // Morning - golden sunrise
  if (hour >= 12 && hour < 17) return Colors.blue; // Afternoon - bright sky
  if (hour >= 17 && hour < 21) return Colors.purple; // Evening - sunset purple
  return Colors.indigo; // Night - deep indigo
};

/**
 * Truncate text with ellipsis
 * Useful for previews and cards
 */
export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Calculate time remaining until a target time
 * Returns object with hours and minutes
 */
export const getTimeUntil = (targetTime) => {
  const now = new Date();
  const [time, period] = targetTime.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  let targetHour = hours;

  if (period === 'PM' && hours !== 12) targetHour += 12;
  if (period === 'AM' && hours === 12) targetHour = 0;

  const target = new Date();
  target.setHours(targetHour, minutes, 0, 0);

  // If target is earlier today, it's for tomorrow
  if (target < now) {
    target.setDate(target.getDate() + 1);
  }

  const diff = target.getTime() - now.getTime();
  const totalMinutes = Math.floor(diff / 60000);

  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  };
};

/**
 * Format duration in seconds to readable string
 * Examples: "2m 30s", "1h 15m", "45s"
 */
export const formatDuration = (seconds) => {
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0
    ? `${hours}h ${remainingMinutes}m`
    : `${hours}h`;
};

/**
 * Get initials from full name
 * Used for avatar placeholders
 */
export const getInitials = (name) => {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[0].charAt(0).toUpperCase() +
    parts[parts.length - 1].charAt(0).toUpperCase()
  );
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Calculate password strength
 * Returns: 0 (weak) to 4 (strong)
 */
export const getPasswordStrength = (password) => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z\d]/.test(password)) strength++;
  return Math.min(strength, 4);
};

/**
 * Get password strength label and color
 */
export const getPasswordStrengthInfo = (password) => {
  const strength = getPasswordStrength(password);
  const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const colors = [Colors.coral, Colors.coral, Colors.gold, Colors.green, Colors.green];
  return {
    label: labels[strength],
    color: colors[strength],
    progress: (strength + 1) / 5,
  };
};

/**
 * Debounce function for search/input optimization
 */
export const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Generate a unique ID
 * Simple implementation for client-side IDs
 */
export const generateId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const getRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Capitalize first letter of string
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Convert kebab-case to camelCase
 */
export const toCamelCase = (str) => {
  return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
};

/**
 * Deep clone an object
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if object is empty
 */
export const isEmptyObject = (obj) => {
  return Object.keys(obj).length === 0;
};

/**
 * Group array by key
 */
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    result[group] = result[group] || [];
    result[group].push(item);
    return result;
  }, {});
};

/**
 * Sort array by date (newest first)
 */
export const sortByDate = (array, dateKey = 'createdAt') => {
  return [...array].sort((a, b) => new Date(b[dateKey]) - new Date(a[dateKey]));
};

// Export all as default
export default {
  getGreeting,
  formatDate,
  formatCurrency,
  getTimeOfDayColor,
  truncateText,
  getTimeUntil,
  formatDuration,
  getInitials,
  isValidEmail,
  getPasswordStrength,
  getPasswordStrengthInfo,
  debounce,
  generateId,
  getRelativeTime,
  capitalize,
  toCamelCase,
  deepClone,
  isEmptyObject,
  groupBy,
  sortByDate,
};
