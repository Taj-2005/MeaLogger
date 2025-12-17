import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function GreetingHeader() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <Animated.View
      entering={FadeInDown.delay(100).duration(500).springify()}
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top + 16, 32),
          paddingBottom: 20,
        },
      ]}
    >
      <Animated.View entering={FadeInUp.delay(200).duration(400)}>
        <Text
          style={[styles.greeting, { color: colors.textPrimary }]}
        >
          {getGreeting()}
        </Text>
        <Text
          style={[styles.name, { color: colors.textPrimary }]}
        >
          {firstName} 👋
        </Text>
      </Animated.View>
      <Animated.View entering={FadeInUp.delay(300).duration(400)}>
        <Text
          style={[styles.subtitle, { color: colors.textSecondary }]}
        >
          Let's track your meals today
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  name: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
  },
});

