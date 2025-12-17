import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Meal {
  _id: string;
  title: string;
  type: string;
  date: string;
  time?: string;
  imageUrl: string;
  calories?: number;
}

interface TodayMealsPreviewProps {
  meals: Meal[];
  onViewAll?: () => void;
}

// Separate component for meal card to allow hooks
const MealPreviewCard = ({
  meal,
  index,
  onPress,
}: {
  meal: Meal;
  index: number;
  onPress: () => void;
}) => {
  const { colors } = useTheme();
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

  const getMealIcon = (mealType: string): keyof typeof Ionicons.glyphMap => {
    switch (mealType?.toLowerCase()) {
      case 'breakfast':
        return 'sunny-outline';
      case 'lunch':
        return 'restaurant-outline';
      case 'dinner':
        return 'moon-outline';
      case 'snack':
        return 'cafe-outline';
      default:
        return 'restaurant-outline';
    }
  };

  const formatTime = (dateString: string, timeString?: string) => {
    if (timeString) {
      try {
        const timeDate = new Date(timeString);
        return timeDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      } catch {
        // Fallback
      }
    }
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(300).springify()}
    >
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={animatedStyle}
      >
        <View
          style={[
            styles.mealCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: meal.imageUrl }}
              style={styles.mealImage}
              resizeMode="cover"
            />
            <View
              style={[
                styles.iconOverlay,
                { backgroundColor: `${colors.primary}20` },
              ]}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${colors.primary}15` },
                ]}
              >
                <Ionicons
                  name={getMealIcon(meal.type)}
                  size={16}
                  color={colors.primary}
                />
              </View>
            </View>
          </View>
          <View style={styles.mealInfo}>
            <Text
              style={[styles.mealTitle, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {meal.title}
            </Text>
            <View style={styles.mealMeta}>
              <Text
                style={[styles.mealTime, { color: colors.textSecondary }]}
              >
                {formatTime(meal.date, meal.time)}
              </Text>
              {meal.calories && meal.calories > 0 && (
                <View
                  style={[
                    styles.caloriesBadge,
                    { backgroundColor: `${colors.accent}15` },
                  ]}
                >
                  <Ionicons
                    name="flame"
                    size={10}
                    color={colors.accent}
                    style={styles.caloriesIcon}
                  />
                  <Text
                    style={[styles.caloriesText, { color: colors.accent }]}
                  >
                    {meal.calories}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
};

export default function TodayMealsPreview({
  meals,
  onViewAll,
}: TodayMealsPreviewProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      router.push('./timeline');
    }
  };

  const renderMeal = ({ item, index }: { item: Meal; index: number }) => {
    return (
      <MealPreviewCard
        meal={item}
        index={index}
        onPress={() => router.push('./timeline')}
      />
    );
  };

  if (meals.length === 0) {
    return (
      <Animated.View
        entering={FadeInUp.delay(200).duration(400)}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text
            style={[styles.sectionTitle, { color: colors.textPrimary }]}
          >
            Today's Meals
          </Text>
        </View>
        <View
          style={[
            styles.emptyState,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.emptyIconContainer,
              { backgroundColor: `${colors.primary}10` },
            ]}
          >
            <Ionicons
              name="restaurant-outline"
              size={32}
              color={colors.primary}
            />
          </View>
          <Text
            style={[styles.emptyTitle, { color: colors.textPrimary }]}
          >
            No meals logged today
          </Text>
          <Text
            style={[styles.emptyText, { color: colors.textSecondary }]}
          >
            Start tracking by adding your first meal
          </Text>
          <AnimatedPressable
            onPress={() => router.push('./meal-logging')}
            style={styles.emptyButton}
          >
            <View
              style={[
                styles.emptyButtonInner,
                { backgroundColor: colors.primary },
              ]}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>Add Meal</Text>
            </View>
          </AnimatedPressable>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeInUp.delay(200).duration(400)}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Today's Meals
        </Text>
        {meals.length > 3 && (
          <AnimatedPressable
            onPress={handleViewAll}
            entering={FadeInUp.delay(300).duration(300)}
          >
            <Text style={[styles.viewAllText, { color: colors.primary }]}>
              View All
            </Text>
          </AnimatedPressable>
        )}
      </View>
      <FlatList
        data={meals.slice(0, 3)}
        renderItem={renderMeal}
        keyExtractor={(item) => item._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  viewAllText: {
    fontSize: 15,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  mealCard: {
    width: 140,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  imageWrapper: {
    width: '100%',
    height: 100,
    position: 'relative',
    overflow: 'hidden',
  },
  mealImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E2E8F0',
  },
  iconOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealInfo: {
    padding: 12,
    gap: 6,
  },
  mealTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  mealMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  mealTime: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  caloriesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  caloriesIcon: {
    marginRight: 2,
  },
  caloriesText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyState: {
    marginHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  emptyButton: {
    width: '100%',
  },
  emptyButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

