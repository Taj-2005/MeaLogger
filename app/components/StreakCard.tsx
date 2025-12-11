import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface StreakCardProps {
  streak: number;
  label?: string;
}

export default function StreakCard({ streak, label = 'Day Streak' }: StreakCardProps) {
  const { colors } = useTheme();

  return (
    <View
      className="rounded-2xl p-6 items-center justify-center"
      style={{
        backgroundColor: colors.surface,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      <View className="flex-row items-center mb-2">
        <Ionicons name="flame" size={32} color={colors.warning} />
        <Text
          className="text-5xl font-bold ml-3"
          style={{ color: colors.textPrimary }}
        >
          {streak}
        </Text>
      </View>
      <Text
        className="text-base font-semibold"
        style={{ color: colors.textSecondary }}
      >
        {label}
      </Text>
      {streak > 0 && (
        <View className="flex-row items-center mt-2">
          <Ionicons name="checkmark-circle" size={16} color={colors.success} style={{ marginRight: 4 }} />
          <Text
            className="text-sm text-center"
            style={{ color: colors.textSecondary }}
          >
            Keep it up!
          </Text>
        </View>
      )}
    </View>
  );
}

