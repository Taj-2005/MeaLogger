import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateName: (name: string) => Promise<void>;
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
  const auth = getAuth();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore remembered session
  useEffect(() => {
    const restoreSession = async () => {
      setIsLoading(true);
      try {
        const remember = await AsyncStorage.getItem('rememberMe');
        if (remember === 'true') {
          const email = await AsyncStorage.getItem('storedEmail');
          const password = await AsyncStorage.getItem('storedPassword');

          if (email && password) {
            await signInWithEmailAndPassword(auth, email, password);
            console.log('Auto-login from AsyncStorage');
          }
        }
      } catch (error) {
        console.error('Error restoring session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });

    return unsubscribe;
  }, [auth]);

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);

      if (rememberMe) {
        await AsyncStorage.setItem('rememberMe', 'true');
        await AsyncStorage.setItem('storedEmail', email);
        await AsyncStorage.setItem('storedPassword', password);
      } else {
        await clearStoredCredentials();
      }

    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name });
        setUser({ ...auth.currentUser });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      await clearStoredCredentials();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateName = async (name: string) => {
    if (!auth.currentUser) throw new Error('No user logged in');
    setIsLoading(true);
    try {
      await updateProfile(auth.currentUser, { displayName: name });
      setUser({ ...auth.currentUser });
    } finally {
      setIsLoading(false);
    }
  };

  const clearStoredCredentials = async () => {
    await AsyncStorage.multiRemove(['rememberMe', 'storedEmail', 'storedPassword']);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
