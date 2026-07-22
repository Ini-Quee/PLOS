import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const API_PORT = 3000;

/**
 * Resolve the backend URL automatically.
 *
 * On a physical phone running Expo Go, "localhost" points at the PHONE, not your
 * computer — so requests die silently. Instead we read the IP of the computer
 * running the Expo dev server (the same machine your backend runs on) straight
 * from the Expo connection, so it works on any Wi-Fi without hardcoding an IP.
 *
 * Override anytime by setting EXPO_PUBLIC_API_URL (e.g. http://10.0.0.5:3000).
 */
function resolveBaseUrl(): string {
  // 1. Explicit override wins.
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');

  // 2. Web / browser preview talks to localhost directly.
  if (Platform.OS === 'web') return `http://localhost:${API_PORT}`;

  // 3. Derive the dev machine's LAN IP from the Expo host (e.g. "192.168.1.22:8081").
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants.expoGoConfig as any)?.debuggerHost ||
    (Constants.manifest2 as any)?.extra?.expoGo?.debuggerHost ||
    '';
  const host = String(hostUri).split(':')[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:${API_PORT}`;
  }

  // 4. Last-resort fallbacks.
  return Platform.OS === 'android'
    ? `http://10.0.2.2:${API_PORT}` // Android emulator -> host machine
    : `http://localhost:${API_PORT}`;
}

const BASE_URL = resolveBaseUrl();
if (__DEV__) console.log('[api] BASE_URL =', BASE_URL);

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    // Tells the backend we're a native client so it returns the refresh token
    // in the response body (mobile can't read httpOnly cookies).
    'X-Client-Platform': Platform.OS,
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting access token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh
let isRefreshing = false;
let failedQueue: { resolve: (value: unknown) => void; reject: (reason?: any) => void }[] = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Handle 401 errors
    if (error.response?.status === 401) {
      if (isRefreshing) {
        // Queue the request while token is being refreshed
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }).catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

// Try to refresh the token
      const response = await axios.post(
        `${BASE_URL}/api/auth/refresh`,
          { refreshToken }
        );

        const { accessToken } = response.data;
        
        // Save new access token
        await SecureStore.setItemAsync('access_token', accessToken);
        
        // Update the original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        processQueue(null, accessToken);
        isRefreshing = false;
        
        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        isRefreshing = false;

        // Only force a logout when the refresh genuinely failed auth:
        //   - the server rejected the refresh token (401/403), or
        //   - there is no refresh token to use at all.
        // A transient NETWORK error (no HTTP response) must NOT log the user
        // out — that would interrupt a testing session for a momentary blip.
        const status = (refreshError as AxiosError)?.response?.status;
        const noResponse = !(refreshError as AxiosError)?.response;
        const missingToken =
          refreshError instanceof Error &&
          refreshError.message === 'No refresh token available';

        const isAuthFailure = status === 401 || status === 403 || missingToken;

        if (isAuthFailure) {
          await SecureStore.deleteItemAsync('access_token');
          await SecureStore.deleteItemAsync('refresh_token');
          router.replace('/(auth)/login');
        } else if (noResponse) {
          // Network hiccup — keep the session; the next request can retry.
          console.warn('[api] token refresh skipped (network); keeping session');
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
