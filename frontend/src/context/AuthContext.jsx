import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { authApi } from '../api/auth';
import { clearSession, readSession, saveSession } from '../utils/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);

  const applySession = useCallback((payload) => {
    const nextSession = {
      access_token: payload.access_token,
      user: payload.user,
    };
    saveSession(nextSession);
    setSession(nextSession);
  }, []);

  const login = useCallback(
    async (credentials) => {
      const { data } = await authApi.login(credentials);
      applySession(data);
      return data;
    },
    [applySession],
  );

  const register = useCallback(
    async (details) => {
      const { data } = await authApi.register(details);
      applySession(data);
      return data;
    },
    [applySession],
  );

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [logout]);

  const value = useMemo(
    () => ({
      token: session?.access_token ?? null,
      user: session?.user ?? null,
      isAuthenticated: Boolean(session),
      login,
      register,
      logout,
    }),
    [session, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
