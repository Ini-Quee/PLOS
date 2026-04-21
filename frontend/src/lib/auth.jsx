import {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';
import api, { setAccessToken, getAccessToken } from './api';

const AuthContext = createContext(null);

// localStorage keys
const USER_KEY = 'user';
const ENCRYPTION_PASSWORD_KEY = 'plos_encryption_password';

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [encryptionPassword, setEncryptionPasswordState] = useState(null);

  // Helper to get user from localStorage
  function getStoredUser() {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  // Helper to set user state and localStorage
  function setUser(userData) {
    setUserState(userData);
    if (userData) {
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }

  // Restore user and encryption password from localStorage on mount
  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUserState(storedUser);
    }
    
    const storedPassword = localStorage.getItem(ENCRYPTION_PASSWORD_KEY);
    if (storedPassword) {
      setEncryptionPasswordState(storedPassword);
    }
  }, []);

  // Helper to set encryption password (persists to localStorage)
  function setEncryptionPassword(password) {
    if (password) {
      localStorage.setItem(ENCRYPTION_PASSWORD_KEY, password);
    } else {
      localStorage.removeItem(ENCRYPTION_PASSWORD_KEY);
    }
    setEncryptionPasswordState(password);
  }

  // Restore session on mount - check for existing token
  useEffect(() => {
    async function restoreSession() {
      try {
        // Check if we have a stored token
        const token = getAccessToken();
        
        if (!token) {
          // No token, user is not logged in
          setLoading(false);
          return;
        }

        // Try to refresh the token
        const response = await api.post('/auth/refresh');
        setAccessToken(response.data.accessToken);
        
        // Get user data
        const userResponse = await api.get('/auth/me');
        setUser(userResponse.data.user);
      } catch (err) {
        console.error('Session restore failed:', err);
        // Clear invalid token
        setAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    
    restoreSession();
  }, []);

  async function login(email, password, mfaCode) {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
        mfaCode,
      });

      if (response.data.requiresMfa) {
        return { requiresMfa: true };
      }

      // Store access token
      setAccessToken(response.data.accessToken);
      setUser(response.data.user);
      setEncryptionPassword(password);
      
      return { success: true, user: response.data.user };
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  }

  async function register(email, password, name) {
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        name,
      });

      // Registration returns access token and user
      if (response.data.accessToken) {
        setAccessToken(response.data.accessToken);
        setUser(response.data.user);
      }

      return response.data;
    } catch (err) {
      console.error('Registration error:', err);
      throw err;
    }
  }

  async function setupMfa() {
    try {
      const response = await api.post('/auth/mfa/setup');
      return response.data;
    } catch (err) {
      console.error('MFA setup error:', err);
      throw err;
    }
  }

  async function verifyMfa(code) {
    try {
      const response = await api.post('/auth/mfa/verify', { code });
      
      // Update user to reflect MFA is now enabled
      const currentUser = getStoredUser();
      if (currentUser) {
        setUser({ ...currentUser, mfaEnabled: true });
      }
      
      return response.data;
    } catch (err) {
      console.error('MFA verify error:', err);
      throw err;
    }
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Always clear local state even if API call fails
      setAccessToken(null);
      setUser(null);
      setEncryptionPassword(null);
    }
  }

  // Check if user is authenticated
  const isAuthenticated = !!user && !!getAccessToken();

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        encryptionPassword,
        isAuthenticated,
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
