import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './AuthContextObject';
import {
  getStoredAccessToken,
  getStoredUser,
  clearAuthStorage,
  setStoredAccessToken,
  setStoredUser
} from '../utils/authStorage';
import {
  getCurrentUserRequest,
  loginRequest,
  logoutRequest,
  refreshTokenRequest,
  registerRequest
} from '../services/authService';

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(() => getStoredAccessToken());
  const [user, setUser] = useState(() => getStoredUser());
  const [isLoading, setIsLoading] = useState(true);

  const saveAuth = useCallback((data) => {
    setAccessToken(data.accessToken);
    setUser(data.user);
    setStoredAccessToken(data.accessToken);
    setStoredUser(data.user);
  }, []);

  const clearAuth = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    clearAuthStorage();
  }, []);

  const login = useCallback(
    async (credentials) => {
      const data = await loginRequest(credentials);
      saveAuth(data);
      return data;
    },
    [saveAuth]
  );

  const register = useCallback(
    async (payload) => {
      const data = await registerRequest(payload);
      saveAuth(data);
      return data;
    },
    [saveAuth]
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        if (getStoredAccessToken()) {
          const data = await getCurrentUserRequest();
          setUser(data.user);
          setStoredUser(data.user);
          return;
        }

        const data = await refreshTokenRequest();
        saveAuth(data);
      } catch {
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, [clearAuth, saveAuth]);

  useEffect(() => {
    window.addEventListener('auth:logout', clearAuth);
    return () => window.removeEventListener('auth:logout', clearAuth);
  }, [clearAuth]);

  const value = useMemo(
    () => ({
      accessToken,
      user,
      isAuthenticated: Boolean(accessToken && user),
      isLoading,
      login,
      register,
      logout
    }),
    [accessToken, user, isLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
