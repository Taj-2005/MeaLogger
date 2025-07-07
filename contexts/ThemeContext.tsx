import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme = 'light' | 'dark';

interface Colors {
  primaryBackground: string;
  cardBackground: string;
  surface: string;
  border: string;
  textPrimary: string;
  textMuted: string;
  icon: string;
  iconMuted: string;
  accent: string;
  switchTrackFalse: string;
  switchTrackTrue: string;
  switchThumb: string;
}

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
  colors: Colors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const THEME_STORAGE_KEY = '@theme_preference';

// Tailwind-inspired color scales
const lightColors: Colors = {
  primaryBackground: '#ffffff',         // white
  cardBackground: '#f3f4f6',            // gray-100
  surface: '#e5e7eb',                   // gray-200
  border: '#d1d5db',                    // gray-300
  textPrimary: '#1e293b',               // gray-900
  textMuted: '#6b7280',                 // gray-500
  icon: '#2563eb',                      // blue-600
  iconMuted: '#6b7280',                 // gray-500
  accent: '#2563eb',                    // blue-600
  switchTrackFalse: '#d1d5db',          // gray-300
  switchTrackTrue: '#2563eb',           // blue-600
  switchThumb: '#ffffff',               // white
};

const darkColors: Colors = {
  primaryBackground: '#000000',         // black
  cardBackground: '#111827',            // gray-900
  surface: '#1f2937',                   // gray-800
  border: '#374151',                    // gray-700
  textPrimary: '#f9fafb',               // gray-50
  textMuted: '#9ca3af',                 // gray-400
  icon: '#60a5fa',                      // blue-400
  iconMuted: '#9ca3af',                 // gray-400
  accent: '#60a5fa',                    // blue-400
  switchTrackFalse: '#4b5563',          // gray-600
  switchTrackTrue: '#60a5fa',           // blue-400
  switchThumb: '#f3f4f6',               // gray-100
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme === 'dark' || savedTheme === 'light') {
          setTheme(savedTheme);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  const toggleTheme = async () => {
    try {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const isDark = theme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    isDark,
    colors,
  };

  if (isLoading) return null;

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
