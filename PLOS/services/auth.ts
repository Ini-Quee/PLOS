import * as SecureStore from 'expo-secure-store';
import apiClient from './api';
import { saveLocal, getLocal, clearAll } from '../utils/storage';

/**
 * User object structure from backend
 */
interface User {
  id: string;
  name: string;
  email: string;
}

/**
 * Login response from backend
 * POST /api/auth/login
 * Body: { email, password }
 */
interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

/**
 * Register response from backend
 * POST /api/auth/register
 * Body: { name, email, password }
 */
interface RegisterResponse {
  message: string;
  user: User;
}

/**
 * Refresh token response from backend
 * POST /api/auth/refresh
 * Body: { refreshToken: string }
 */
interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * Login user with email and password
 * 
 * Process:
 * 1. POST credentials to /api/auth/login
 * 2. Extract accessToken, refreshToken, and user from response
 * 3. Save access_token to SecureStore
 * 4. Save refresh_token to SecureStore
 * 5. Save user_profile to AsyncStorage
 * 6. Return user object
 * 
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise<User> - User object
 */
export async function login(email: string, password: string): Promise<User> {
  try {
    // Call login endpoint
    const response = await apiClient.post<LoginResponse>('/api/auth/login', {
      email,
      password,
    });

    // Extract tokens and user from response (Pattern A: camelCase)
    const { accessToken, refreshToken, user } = response.data;

    // Save access token to SecureStore
    await SecureStore.setItemAsync('access_token', accessToken);

    // Save refresh token to SecureStore
    await SecureStore.setItemAsync('refresh_token', refreshToken);

    // Save user to AsyncStorage
    await saveLocal('user_profile', user);

    // Return user object
    return user;
  } catch (error: any) {
    console.error('Login error:', error);
    throw error;
  }
}

/**
 * Register new user
 * 
 * Process:
 * 1. POST registration data to /api/auth/register
 * 2. Register returns { message, user } but NO tokens
 * 3. Automatically call login() to get tokens
 * 4. Return user object (from auto-login)
 * 
 * @param name - User's full name
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise<User> - User object from auto-login
 */
export async function register(
  name: string,
  email: string,
  password: string
): Promise<User> {
  try {
    // Call register endpoint
    // Register only returns { message, user }, no tokens
    await apiClient.post<RegisterResponse>('/api/auth/register', {
      name,
      email,
      password,
    });

    // Auto-login after successful registration to get tokens
    // login() will save tokens and user to storage
    const user = await login(email, password);

    // Return user from auto-login
    return user;
  } catch (error: any) {
    console.error('Registration error:', error);
    throw error;
  }
}

/**
 * Logout user and clear all stored data
 * 
 * Process:
 * 1. Delete access_token from SecureStore
 * 2. Delete refresh_token from SecureStore
 * 3. Clear all AsyncStorage data
 * 
 * Note: Navigation is handled by the calling screen, not here
 * 
 * @returns Promise<void>
 */
export async function logout(): Promise<void> {
  try {
    // Delete access token from SecureStore
    await SecureStore.deleteItemAsync('access_token');

    // Delete refresh token from SecureStore
    await SecureStore.deleteItemAsync('refresh_token');

    // Clear all AsyncStorage data
    await clearAll();

    // Note: Navigation is NOT handled here
    // The calling screen/component should handle navigation
  } catch (error: any) {
    console.error('Logout error:', error);
    throw error;
  }
}

/**
 * Get stored user from AsyncStorage
 * 
 * Returns the user object that was saved during login
 * Useful for checking if user data exists without validating tokens
 * 
 * @returns Promise<User | null> - User object or null if not found
 */
export async function getStoredUser(): Promise<User | null> {
  try {
    // Get user from AsyncStorage
    const user = await getLocal('user_profile');

    // Return user if found, otherwise null
    return user as User | null;
  } catch (error: any) {
    console.error('Get stored user error:', error);
    return null;
  }
}

/**
 * Refresh access token using refresh token
 * 
 * Process:
 * 1. Get refresh_token from SecureStore
 * 2. POST to /api/auth/refresh
 * 3. Save new tokens to SecureStore
 * 4. Return new access token
 * 
 * Note: This is primarily used by the api interceptor
 * but exported here for direct use if needed
 * 
 * @returns Promise<string | null> - New access token or null if refresh failed
 */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    // Get refresh token from SecureStore
    const refreshToken = await SecureStore.getItemAsync('refresh_token');

    if (!refreshToken) {
      console.error('No refresh token available');
      return null;
    }

    // Call refresh endpoint
    const response = await apiClient.post<RefreshResponse>('/api/auth/refresh', {
      refreshToken,
    });

    // Extract new tokens
    const { accessToken, refreshToken: newRefreshToken } = response.data;

    // Save new tokens
    await SecureStore.setItemAsync('access_token', accessToken);
    await SecureStore.setItemAsync('refresh_token', newRefreshToken);

    return accessToken;
  } catch (error: any) {
    console.error('Token refresh error:', error);
    return null;
  }
}

/**
 * Check if user is authenticated (has access token)
 * 
 * @returns Promise<boolean> - true if access token exists
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const token = await SecureStore.getItemAsync('access_token');
    return token !== null;
  } catch (error) {
    return false;
  }
}
