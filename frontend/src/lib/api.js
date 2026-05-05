import axios from 'axios';
import { isQueueable, enqueue, flushQueue, queueSize } from './offlineQueue';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  timeout: 15000,
});

let accessToken = null;

// FIX: Add flags to prevent infinite retry loops
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export function setAccessToken(token) {
  accessToken = token;
  // Also store in localStorage for persistence across refreshes
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
}

export function getAccessToken() {
  // Return from memory or fallback to localStorage
  return accessToken || localStorage.getItem('accessToken');
}

// Initialize token from localStorage on module load
const storedToken = localStorage.getItem('accessToken');
if (storedToken) {
  accessToken = storedToken;
}

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = 'Bearer ' + token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    // Flush any queued offline writes now that we have connectivity
    if (queueSize() > 0) flushQueue(api)
    return response
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle network errors — queue safe writes, reject the rest gracefully
    if (!error.response) {
      if (originalRequest) {
        const baseURL = api.defaults.baseURL || ''
        const fullUrl  = originalRequest.url || ''
        const relUrl   = fullUrl.startsWith(baseURL)
          ? fullUrl.slice(baseURL.length)
          : fullUrl
        const method   = originalRequest.method || 'GET'
        let body
        try { body = originalRequest.data ? JSON.parse(originalRequest.data) : undefined } catch { body = undefined }

        if (isQueueable(method, relUrl)) {
          enqueue(method, relUrl, body)
          // Return a synthetic success so optimistic UI stays intact
          return Promise.resolve({ data: { queued: true }, status: 202, queued: true })
        }
      }

      return Promise.reject({
        response: {
          data: { error: 'Unable to connect to server. Please check your connection.' },
        },
      });
    }

    // Handle 401 errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        // No refresh token — clear auth keys only (preserve offline queue, preferences)
        if (!refreshToken) {
          setAccessToken(null);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          sessionStorage.removeItem('plos_encryption_password');
          window.location.href = '/login';
          return Promise.reject(error);
        }

        const response = await axios.post(
          `${API_URL}/api/auth/refresh`,
          { refreshToken },
          { withCredentials: true, timeout: 10000 }
        );

        const newToken = response.data.accessToken;
        setAccessToken(newToken);
        
        // Process any queued requests
        processQueue(null, newToken);
        
        // Retry the original request
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed — clear auth keys only (preserve offline queue, preferences)
        processQueue(refreshError, null);
        setAccessToken(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        sessionStorage.removeItem('plos_encryption_password');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Flush offline queue when browser comes back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => flushQueue(api))
}

export default api;
