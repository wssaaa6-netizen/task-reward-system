import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthResponse } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: {
    full_name: string;
    email: string;
    mobile?: string;
    password: string;
    confirm_password: string;
    referral_code?: string;
  }) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('t2c_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('t2c_access_token'));
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const currentToken = localStorage.getItem('t2c_access_token');
    if (!currentToken) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      if (res.data?.success && res.data.data) {
        setUser(res.data.data);
        localStorage.setItem('t2c_user', JSON.stringify(res.data.data));
      }
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();

    const handleLogoutEvent = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('t2c_auth_logout', handleLogoutEvent);
    return () => window.removeEventListener('t2c_auth_logout', handleLogoutEvent);
  }, [refreshProfile]);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await api.post<any>('/auth/login', credentials);
    if (res.data?.success && res.data.data) {
      const authData: AuthResponse = res.data.data;
      localStorage.setItem('t2c_access_token', authData.access_token);
      localStorage.setItem('t2c_refresh_token', authData.refresh_token);
      localStorage.setItem('t2c_user', JSON.stringify(authData.user));
      setToken(authData.access_token);
      setUser(authData.user);
    } else {
      throw new Error(res.data?.message || 'Login failed');
    }
  };

  const register = async (data: {
    full_name: string;
    email: string;
    mobile?: string;
    password: string;
    confirm_password: string;
    referral_code?: string;
  }) => {
    const res = await api.post<any>('/auth/register', data);
    if (res.data?.success && res.data.data) {
      const authData: AuthResponse = res.data.data;
      localStorage.setItem('t2c_access_token', authData.access_token);
      localStorage.setItem('t2c_refresh_token', authData.refresh_token);
      localStorage.setItem('t2c_user', JSON.stringify(authData.user));
      setToken(authData.access_token);
      setUser(authData.user);
    } else {
      throw new Error(res.data?.message || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('t2c_access_token');
    localStorage.removeItem('t2c_refresh_token');
    localStorage.removeItem('t2c_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'ADMIN',
        loading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
