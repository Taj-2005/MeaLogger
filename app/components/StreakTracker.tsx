import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface StreakTrackerProps {
  streak: number;
  todayMeals: number;
}

export default function StreakTracker({ streak, todayMeals }: StreakTrackerProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 100,
    });
    opacity.value = withSpring(1, {
      damping: 15,
      stiffness: 100,
    });
  }, [streak]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const progress = Math.min(streak / 7, 1);

  return (
    <Animated.View
      entering={FadeInDown.delay(150).duration(500).springify()}
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          shadowColor: colors.shadow,
        },
        animatedStyle,
      ]}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <View style={styles.streakHeader}>
            <Ionicons name="flame" size={32} color={colors.warning} />
            <Text
              style={[styles.streakNumber, { color: colors.textPrimary }]}
            >
              {streak}
            </Text>
          </View>
          <Text
            style={[styles.streakLabel, { color: colors.textSecondary }]}
          >
            Day Streak
          </Text>
          {todayMeals > 0 && (
            <Text
              style={[styles.todayMeals, { color: colors.textSecondary }]}
            >
              {todayMeals} meal{todayMeals > 1 ? 's' : ''} logged today
            </Text>
          )}
        </View>

        <View style={styles.circleContainer}>
          <View
            style={[
              styles.circleBase,
              { borderColor: `${colors.warning}20` },
            ]}
          />
          {streak > 0 && (
            <View
              style={[
                styles.circleProgress,
                {
                  borderColor: colors.warning,
                  borderTopColor: progress > 0.5 ? colors.warning : 'transparent',
                  borderRightColor: progress > 0.25 ? colors.warning : 'transparent',
                  borderBottomColor: progress > 0.75 ? colors.warning : 'transparent',
                  borderLeftColor: progress > 0 ? colors.warning : 'transparent',
                },
              ]}
            />
          )}
          <View
            style={[
              styles.circleInner,
              { backgroundColor: `${colors.warning}10` },
            ]}
          >
            {streak > 0 ? (
              <Ionicons name="checkmark-circle" size={36} color={colors.success} />
            ) : (
              <Ionicons name="flame-outline" size={32} color={colors.warning} />
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flex: 1,
    paddingLeft: 8,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: '800',
    marginLeft: 12,
    letterSpacing: -1,
  },
  streakLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  todayMeals: {
    fontSize: 13,
    lineHeight: 18,
  },
  circleContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBase: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 6,
    position: 'absolute',
  },
  circleProgress: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 6,
    position: 'absolute',
    transform: [{ rotate: '-90deg' }],
  },
  circleInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

