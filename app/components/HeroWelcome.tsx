import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface HeroWelcomeProps {
  streak: number;
  todayMeals: number;
}

export default function HeroWelcome({ streak, todayMeals }: HeroWelcomeProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const rotate = useSharedValue(0);

  useEffect(() => {
    // Waving animation: rotate from -15deg to 15deg repeatedly
    rotate.value = withRepeat(
      withTiming(30, {
        duration: 500,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, []);

  const wavingStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${rotate.value - 15}deg`,
        },
      ],
    };
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <Animated.View
      entering={FadeInDown.delay(50).duration(600).springify()}
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top + 20, 40),
          backgroundColor: colors.background,
        },
      ]}
    >
      <Animated.View
        entering={FadeInUp.delay(150).duration(500)}
        style={styles.content}
      >
        <Text style={[styles.greeting, { color: colors.textSecondary }]}>
          {getGreeting()}
        </Text>
        <View style={styles.nameContainer}>
          <Text style={[styles.name, { color: colors.textPrimary }]}>
            {firstName}
          </Text>
          <Animated.Text
            style={[styles.waveEmoji, wavingStyle]}
            entering={FadeInUp.delay(200).duration(400)}
          >
            👋
          </Animated.Text>
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.delay(250).duration(500)}
        style={[
          styles.statsContainer,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.statItem}>
          <View
            style={[
              styles.statIconContainer,
              { backgroundColor: `${colors.warning}15` },
            ]}
          >
            <Ionicons name="flame" size={20} color={colors.warning} />
          </View>
          <View style={styles.statContent}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {streak}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Day Streak
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.statItem}>
          <View
            style={[
              styles.statIconContainer,
              { backgroundColor: `${colors.primary}15` },
            ]}
          >
            <Ionicons name="restaurant" size={20} color={colors.primary} />
          </View>
          <View style={styles.statContent}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {todayMeals}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Today's Meals
            </Text>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  content: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 42,
  },
  waveEmoji: {
    fontSize: 32,
    lineHeight: 38,
  },
  statsContainer: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  divider: {
    width: 1,
    marginHorizontal: 20,
  },
});

