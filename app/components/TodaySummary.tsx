import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface TodaySummaryProps {
  todayMeals: number;
  todayCalories: number;
  remindersActive: boolean;
}

export default function TodaySummary({
  todayMeals,
  todayCalories,
  remindersActive,
}: TodaySummaryProps) {
  const router = useRouter();
  const { colors } = useTheme();

  const stats = [
    {
      id: 'meals',
      label: 'Meals Today',
      value: todayMeals,
      icon: 'restaurant-outline' as const,
      color: colors.primary,
      onPress: () => router.push('./timeline'),
    },
    {
      id: 'calories',
      label: 'Calories',
      value: todayCalories || '0',
      icon: 'flame-outline' as const,
      color: colors.warning,
      onPress: () => router.push('./timeline'),
    },
    {
      id: 'reminders',
      label: 'Reminders',
      value: remindersActive ? 'On' : 'Off',
      icon: 'notifications-outline' as const,
      color: remindersActive ? colors.success : colors.textSecondary,
      onPress: () => router.push('./remainder'),
    },
  ];

  const padding = 40;
  const totalGaps = 24;
  const cardWidth = (width - padding - totalGaps) / 3;

  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

  const StatCard = ({
    stat,
    index,
  }: {
    stat: (typeof stats)[0];
    index: number;
  }) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
      scale.value = withSpring(0.95, {
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
        entering={FadeInDown.delay(150 + index * 50).duration(400).springify()}
        style={{ width: cardWidth, marginRight: index < stats.length - 1 ? 12 : 0 }}
      >
        <AnimatedPressable
          onPress={stat.onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={animatedStyle}
        >
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: colors.surface,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${stat.color}15` },
              ]}
            >
              <Ionicons name={stat.icon} size={20} color={stat.color} />
            </View>
            <Text
              style={[styles.statValue, { color: colors.textPrimary }]}
            >
              {stat.value}
            </Text>
            <Text
              style={[styles.statLabel, { color: colors.textSecondary }]}
            >
              {stat.label}
            </Text>
          </View>
        </AnimatedPressable>
      </Animated.View>
    );
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(100).duration(400)}
      style={styles.container}
    >
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
        Today at a Glance
      </Text>
      <View style={styles.statsRow}>
        {stats.map((stat, index) => (
          <StatCard key={stat.id} stat={stat} index={index} />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statCard: {
    borderRadius: 18,
    padding: 18,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
});
