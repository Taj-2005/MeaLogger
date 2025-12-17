import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TodayActivityCardProps {
  todayMeals: number;
  todayCalories: number;
  remindersActive: boolean;
}

export default function TodayActivityCard({
  todayMeals,
  todayCalories,
  remindersActive,
}: TodayActivityCardProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, {
      damping: 15,
      stiffness: 400,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 400,
    });
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(300).duration(500).springify()}
      style={styles.container}
    >
      <AnimatedPressable
        onPress={() => router.push('./timeline')}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={animatedStyle}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${colors.primary}15` },
                ]}
              >
                <Ionicons name="today-outline" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                Today's Activity
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {todayMeals}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Meals
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {todayCalories || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Calories
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <View
                style={[
                  styles.statusIndicator,
                  {
                    backgroundColor: remindersActive
                      ? `${colors.success}20`
                      : `${colors.textSecondary}15`,
                  },
                ]}
              >
                <Ionicons
                  name={remindersActive ? 'notifications' : 'notifications-off'}
                  size={14}
                  color={remindersActive ? colors.success : colors.textSecondary}
                />
              </View>
              <Text
                style={[
                  styles.statLabel,
                  {
                    color: remindersActive ? colors.success : colors.textSecondary,
                    marginTop: 4,
                  },
                ]}
              >
                {remindersActive ? 'On' : 'Off'}
              </Text>
            </View>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  divider: {
    width: 1,
    height: 40,
    marginHorizontal: 16,
  },
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
});

