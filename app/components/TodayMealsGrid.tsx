import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');
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

interface TodayMealsGridProps {
  meals: Meal[];
}

const MealGridCard = ({
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

  const cardWidth = (width - 60) / 2; // 20px padding on each side + 20px gap

  return (
    <Animated.View
      entering={FadeInUp.delay(100 + index * 50).duration(400).springify()}
      style={{ width: cardWidth }}
    >
      <AnimatedPressable
        onPress={onPress}
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
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: meal.imageUrl }}
              style={styles.image}
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
                  styles.iconBadge,
                  { backgroundColor: `${colors.primary}15` },
                ]}
              >
                <Ionicons
                  name={getMealIcon(meal.type)}
                  size={18}
                  color={colors.primary}
                />
              </View>
            </View>
          </View>
          <View style={styles.content}>
            <Text
              style={[styles.mealTitle, { color: colors.textPrimary }]}
              numberOfLines={2}
            >
              {meal.title}
            </Text>
            <View style={styles.meta}>
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

export default function TodayMealsGrid({ meals }: TodayMealsGridProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const renderMeal = ({ item, index }: { item: Meal; index: number }) => {
    return (
      <MealGridCard
        meal={item}
        index={index}
        onPress={() => router.push('./timeline')}
      />
    );
  };

  if (meals.length === 0) {
    return (
      <Animated.View
        entering={FadeInUp.delay(400).duration(500)}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
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
              styles.emptyIcon,
              { backgroundColor: `${colors.primary}10` },
            ]}
          >
            <Ionicons
              name="restaurant-outline"
              size={40}
              color={colors.primary}
            />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            No meals yet
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Start tracking your meals today
          </Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeInUp.delay(400).duration(500)}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Today's Meals
        </Text>
        {meals.length > 4 && (
          <AnimatedPressable onPress={() => router.push('./timeline')}>
            <Text style={[styles.viewAll, { color: colors.primary }]}>
              View All
            </Text>
          </AnimatedPressable>
        )}
      </View>
      <FlatList
        data={meals.slice(0, 4)}
        renderItem={renderMeal}
        keyExtractor={(item) => item._id}
        numColumns={2}
        scrollEnabled={false}
        columnWrapperStyle={styles.row}
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
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  viewAll: {
    fontSize: 15,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  imageContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E2E8F0',
  },
  iconOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 12,
    gap: 8,
  },
  mealTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    minHeight: 40,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  mealTime: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  caloriesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  caloriesIcon: {
    marginRight: 4,
  },
  caloriesText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    marginHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});

