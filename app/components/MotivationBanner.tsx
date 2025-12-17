import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
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
    <Animated.View
      entering={FadeInUp.delay(200).duration(400)}
      style={[
        styles.container,
        { backgroundColor: message.bgColor },
      ]}
    >
      <Ionicons name={message.icon} size={26} color={message.iconColor} />
      <Text
        style={[styles.text, { color: colors.textPrimary }]}
      >
        {message.text}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});

