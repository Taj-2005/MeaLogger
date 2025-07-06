import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebaseConfig';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  getUserSession: () => Promise<any>;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        setIsAuthenticated(true);
        
        // Update session data if remember me is enabled
        try {
          const rememberMeStatus = await AsyncStorage.getItem('rememberMe');
          if (rememberMeStatus === 'true') {
            const sessionData = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              loginTime: new Date().toISOString(),
            };
            await AsyncStorage.setItem('userSession', JSON.stringify(sessionData));
          }
        } catch (error) {
          console.error('Error updating session:', error);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
        
        // Clear session data on logout
        try {
          await AsyncStorage.removeItem('userSession');
          await AsyncStorage.removeItem('rememberMe');
        } catch (error) {
          console.error('Error clearing session:', error);
        }
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('userSession');
      await AsyncStorage.removeItem('rememberMe');
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  const getUserSession = async (): Promise<any> => {
    try {
      const sessionData = await AsyncStorage.getItem('userSession');
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      console.error('Error getting user session:', error);
      return null;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    logout,
    getUserSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};