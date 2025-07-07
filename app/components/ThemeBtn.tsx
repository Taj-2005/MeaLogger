import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface FloatingThemeButtonProps {
  size?: number;
  right?: number;
  top?: number;
  bottom?: number;
}

export const FloatingThemeButton: React.FC<FloatingThemeButtonProps> = ({ 
  size = 24, 
  right = 20,
  top,
  bottom = 100,
}) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      className={`absolute p-3 rounded-full shadow-lg`}
      style={{
        right,
        top,
        bottom,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      }}
      activeOpacity={0.8}
    >
      <Ionicons
        name={theme === 'light' ? 'moon' : 'sunny'}
        size={size}
        color={isDark ? '#fbbf24' : '#3730a3'}
      />
    </TouchableOpacity>
  );
};