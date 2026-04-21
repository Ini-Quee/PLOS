import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  timeout: 15000,
});

let accessToken = null;

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
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle network errors
    if (!error.response) {
      console.error('Network error - API unreachable:', error.message);
      return Promise.reject({
        response: {
          data: {
            error: 'Unable to connect to server. Please check your connection.',
          },
        },
      });
    }

    // Handle 401 with expired token
    if (
      error.response.status === 401 &&
      error.response.data &&
      error.response.data.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await axios.post(
          `${API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true, timeout: 10000 }
        );
        const newToken = refreshResponse.data.accessToken;
        setAccessToken(newToken);
        originalRequest.headers.Authorization = 'Bearer ' + newToken;
        return api(originalRequest);
      } catch (refreshError) {
        setAccessToken(null);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other 401 errors (not expired token)
    if (error.response.status === 401 && !originalRequest._retry) {
      setAccessToken(null);
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
