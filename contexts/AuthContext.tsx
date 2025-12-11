import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { cancelAllNotifications } from '../utils/notifications';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateName: (name: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      setIsLoading(true);
      try {
        const accessToken = await AsyncStorage.getItem('accessToken');
        const refreshToken = await AsyncStorage.getItem('refreshToken');

        if (!accessToken && !refreshToken) {
          setIsLoading(false);
          return;
        }

        if (accessToken) {
          try {
            const result = await api.getProfile();
            if (result.success && result.data) {
              setUser(result.data.user);
              setIsLoading(false);
              return;
            }
          } catch (error: any) {
            if (error.message?.includes('Session expired') || error.message?.includes('401')) {
              if (refreshToken) {
                try {
                  const refreshed = await api.refreshAccessToken();
                  if (refreshed) {
                    const result = await api.getProfile();
                    if (result.success && result.data) {
                      setUser(result.data.user);
                      setIsLoading(false);
                      return;
                    }
                  }
                } catch (refreshError) {
                  console.error('Error refreshing token during session restore:', refreshError);
                }
              }
            } else {
              console.error('Error restoring session:', error);
            }
          }
        } else if (refreshToken) {
          try {
            const refreshed = await api.refreshAccessToken();
            if (refreshed) {
              const result = await api.getProfile();
              if (result.success && result.data) {
                setUser(result.data.user);
                setIsLoading(false);
                return;
              }
            }
          } catch (refreshError) {
            console.error('Error refreshing token during session restore:', refreshError);
          }
        }

        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      } catch (error) {
        console.error('Error restoring session:', error);
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    setIsLoading(true);
    try {
      const data = await api.login(email, password);
      setUser(data.user);

      if (rememberMe) {
        await AsyncStorage.setItem('rememberMe', 'true');
        await AsyncStorage.setItem('storedEmail', email);
      } else {
        await AsyncStorage.multiRemove(['rememberMe', 'storedEmail']);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await api.register(name, email, password);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.logout();
      await cancelAllNotifications();
      setUser(null);
      await AsyncStorage.multiRemove(['rememberMe', 'storedEmail']);
    } finally {
      setIsLoading(false);
    }
  };

  const updateName = async (name: string) => {
    setIsLoading(true);
    try {
      await api.updateProfile(name);
      setUser((prev) => (prev ? { ...prev, name } : null));
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const result = await api.getProfile();
      if (result.success && result.data) {
        setUser(result.data.user);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateName,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
