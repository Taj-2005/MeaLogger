import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface MotivationBannerProps {
  streak: number;
  todayMeals: number;
}

export default function MotivationBanner({
  streak,
  todayMeals,
}: MotivationBannerProps) {
  const { colors } = useTheme();

  const getMessage = () => {
    if (streak === 0) {
      return {
        text: "Start your meal logging journey today!",
        icon: 'rocket-outline' as const,
        bgColor: `${colors.primary}10`,
        iconColor: colors.primary,
      };
    } else if (streak < 3) {
      return {
        text: "Great start! Keep logging to build your streak!",
        icon: 'trending-up-outline' as const,
        bgColor: `${colors.success}10`,
        iconColor: colors.success,
      };
    } else if (streak < 7) {
      return {
        text: "You're on fire! Keep the momentum going!",
        icon: 'flame' as const,
        bgColor: `${colors.warning}10`,
        iconColor: colors.warning,
      };
    } else {
      return {
        text: "Incredible dedication! You're a champion!",
        icon: 'trophy-outline' as const,
        bgColor: `${colors.accent}10`,
        iconColor: colors.accent,
      };
    }
  };

  const message = getMessage();

  return (
    <View
      className="mx-5 mb-6 rounded-2xl px-5 py-4 flex-row items-center mt-4"
      style={{ backgroundColor: message.bgColor }}
    >
      <Ionicons name={message.icon} size={24} color={message.iconColor} />
      <Text
        className="text-sm font-semibold ml-3 flex-1 leading-snug"
        style={{ color: colors.textPrimary }}
      >
        {message.text}
      </Text>
    </View>
  );
}

