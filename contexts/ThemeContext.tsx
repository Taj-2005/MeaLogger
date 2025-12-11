import React, { createContext, useContext } from 'react';

interface Colors {
  primary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  divider: string;
  shadow: string;
}

interface ThemeContextType {
  colors: Colors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const colors: Colors = {
  primary: '#4A6CF7',
  accent: '#7C3AED',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  border: '#E2E8F0',
  divider: '#E2E8F0',
  shadow: 'rgba(0, 0, 0, 0.1)',
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value: ThemeContextType = {
    colors,
  };

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
