import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

export default function GreetingHeader() {
  const { colors } = useTheme();
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <View className="px-5 pt-4 pb-6">
      <Text
        className="text-3xl font-bold tracking-tight"
        style={{ color: colors.textPrimary }}
      >
        {getGreeting()}, {firstName} 👋
      </Text>
      <Text
        className="text-base mt-1 leading-snug"
        style={{ color: colors.textSecondary }}
      >
        Let's track your meals today
      </Text>
    </View>
  );
}

