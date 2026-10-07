import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const STORAGE_KEY = 'medicare_user';
const TOKEN_KEY = 'medicare_token';

function normalizeUser(userData) {
  return {
    ...userData,
    name: userData.name || userData.full_name,
    role: String(userData.role || '').toLowerCase(),
  };
}

function readStoredUser() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  useEffect(() => {
    if (!token) {
      return;
    }

    api
      .get('/auth/me')
      .then(({ data }) => {
        const normalizedUser = normalizeUser(data);
        setUser(normalizedUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedUser));
      })
      .catch(() => {
        setUser(null);
        setToken(null);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(TOKEN_KEY);
      });
  }, [token]);

  const login = ({ access_token, user: userData }) => {
    const normalizedUser = normalizeUser(userData);

    setUser(normalizedUser);
    setToken(access_token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedUser));
    localStorage.setItem(TOKEN_KEY, access_token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      login,
      logout,
      isAuthenticated: Boolean(user && token),
    }),
    [user, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
