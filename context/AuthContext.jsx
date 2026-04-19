'use client';
/**
 * context/AuthContext.jsx
 * Global authentication state — persisted in localStorage.
 * Also reads `wh_token_init` cookie after a Google OAuth redirect.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext(null);

function readCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      // 1. Check for post-Google-OAuth init cookie (short-lived, readable)
      const initCookie = readCookie('wh_token_init');
      if (initCookie) {
        const { token: t, user: u } = JSON.parse(initCookie);
        localStorage.setItem('wh_token', t);
        localStorage.setItem('wh_user', JSON.stringify(u));
        setToken(t);
        setUser(u);
        deleteCookie('wh_token_init');
        setLoading(false);
        return;
      }

      // 2. Restore from localStorage on normal page load
      const savedToken = localStorage.getItem('wh_token');
      const savedUser = localStorage.getItem('wh_user');
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch {
      localStorage.removeItem('wh_token');
      localStorage.removeItem('wh_user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback((tokenData, userData) => {
    localStorage.setItem('wh_token', tokenData);
    localStorage.setItem('wh_user', JSON.stringify(userData));
    setToken(tokenData);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('wh_token');
    localStorage.removeItem('wh_user');
    document.cookie = 'wh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setToken(null);
    setUser(null);
    router.push('/');
  }, [router]);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('wh_user', JSON.stringify(updatedUser));
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    isAdmin: ['admin', 'superadmin'].includes(user?.role),
    isSuperAdmin: user?.role === 'superadmin',
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
