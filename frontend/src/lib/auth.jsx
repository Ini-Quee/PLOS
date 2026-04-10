import {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';
import api, { setAccessToken } from './api';

const AuthContext = createContext(null);

// Session storage key for encryption password
const ENCRYPTION_PASSWORD_KEY = 'plos_encryption_password';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [encryptionPassword, setEncryptionPasswordState] = useState(null);

  // Restore encryption password from sessionStorage on mount
  useEffect(() => {
    const storedPassword = sessionStorage.getItem(ENCRYPTION_PASSWORD_KEY);
    if (storedPassword) {
      setEncryptionPasswordState(storedPassword);
    }
  }, []);

  // Helper to set encryption password (persists to sessionStorage)
  function setEncryptionPassword(password) {
    if (password) {
      sessionStorage.setItem(ENCRYPTION_PASSWORD_KEY, password);
    } else {
      sessionStorage.removeItem(ENCRYPTION_PASSWORD_KEY);
    }
    setEncryptionPasswordState(password);
  }

  useEffect(() => {
    async function restoreSession() {
      try {
        const response = await api.post('/auth/refresh');
        setAccessToken(response.data.accessToken);
        const userResponse = await api.get('/auth/me');
        setUser(userResponse.data.user);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  async function login(email, password, mfaCode) {
    const response = await api.post('/auth/login', {
      email,
      password,
      mfaCode,
    });

    if (response.data.requiresMfa) {
      return { requiresMfa: true };
    }

    setAccessToken(response.data.accessToken);
    setUser(response.data.user);
    setEncryptionPassword(password);
    return { success: true };
  }

  async function register(email, password, name) {
    const response = await api.post('/auth/register', {
      email,
      password,
      name,
    });

    if (response.data.accessToken) {
      setAccessToken(response.data.accessToken);
      setUser(response.data.user);
    }

    return response.data;
  }

  async function setupMfa() {
    const response = await api.post('/auth/mfa/setup');
    return response.data;
  }

  async function verifyMfa(code) {
    const response = await api.post('/auth/mfa/verify', {
      code,
    });
    return response.data;
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
      setUser(null);
      setEncryptionPassword(null);
    }

  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        encryptionPassword,
        login,
        register,
        setupMfa,
        verifyMfa,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}