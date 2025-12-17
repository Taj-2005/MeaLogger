import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { api } from '../../services/api';
import LoadingScreen from '../components/LoadingScreen';
import MealCard from '../components/MealCard';
import PrimaryButton from '../components/PrimaryButton';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const { width } = Dimensions.get('window');

type Meal = {
  _id: string;
  imageUrl: string;
  createdAt: string;
  date: string;
  title: string;
  type: string;
  calories?: number;
};

type GroupedMeals = {
  date: string;
  dateLabel: string;
  meals: Meal[];
};

export default function TimelineScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      loadMeals(false);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMeals();
    }, [])
  );

  const loadMeals = async (showLoading: boolean = true) => {
    try {
      if (showLoading) setIsLoading(true);

      const result = await api.getMeals(1, 50);

      if (result.success && result.data) {
        const mealsData: Meal[] = result.data.meals.map((meal: any) => ({
          _id: meal._id || meal.id,
          title: meal.title,
          type: meal.type,
          date: meal.date,
          calories: meal.calories,
          imageUrl: meal.imageUrl,
          createdAt: meal.createdAt,
        }));

        mealsData.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });

        setMeals(mealsData);
      }
    } catch (error: any) {
      console.error('Error loading meals:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMeals();
  };

  const deleteMeal = async (mealId: string) => {
    try {
      // Optimistic update
      const updatedMeals = meals.filter((meal) => meal._id !== mealId);
      setMeals(updatedMeals);

      await api.deleteMeal(mealId);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await loadMeals(false);
    } catch (error: any) {
      console.error('Error deleting meal:', error);
      Alert.alert('Error', 'Failed to delete meal. Please try again.');
      // Revert optimistic update
      await loadMeals(false);
    }
  };

  const handleDeleteMeal = (meal: Meal) => {
    const isWeb =
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      typeof window.confirm === 'function';

    if (isWeb) {
      const confirmed = window.confirm(
        `Are you sure you want to delete "${meal.title}"?`
      );
      if (confirmed) {
        deleteMeal(meal._id);
      }
    } else {
      Alert.alert('Delete Meal', `Are you sure you want to delete "${meal.title}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMeal(meal._id),
        },
      ]);
    }
  };

  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  // Group meals by date
  const groupedMeals = useMemo(() => {
    const groups: { [key: string]: Meal[] } = {};

    meals.forEach((meal) => {
      const mealDate = new Date(meal.date);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let dateKey: string;
      let dateLabel: string;

      if (mealDate.toDateString() === today.toDateString()) {
        dateKey = 'today';
        dateLabel = 'Today';
      } else if (mealDate.toDateString() === yesterday.toDateString()) {
        dateKey = 'yesterday';
        dateLabel = 'Yesterday';
      } else {
        dateKey = mealDate.toISOString().split('T')[0];
        dateLabel = mealDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: new Date().getFullYear() !== mealDate.getFullYear() ? 'numeric' : undefined,
        });
      }

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(meal);
    });

    // Convert to array and sort by date (most recent first)
    const sortedGroups: GroupedMeals[] = Object.entries(groups)
      .map(([dateKey, meals]) => {
        const firstMeal = meals[0];
        const mealDate = new Date(firstMeal.date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let dateLabel: string;
        if (mealDate.toDateString() === today.toDateString()) {
          dateLabel = 'Today';
        } else if (mealDate.toDateString() === yesterday.toDateString()) {
          dateLabel = 'Yesterday';
        } else {
          dateLabel = mealDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: new Date().getFullYear() !== mealDate.getFullYear() ? 'numeric' : undefined,
          });
        }

        return {
          date: dateKey,
          dateLabel,
          meals: meals.sort((a, b) => {
            const timeA = new Date(a.createdAt).getTime();
            const timeB = new Date(b.createdAt).getTime();
            return timeB - timeA;
          }),
        };
      })
      .sort((a, b) => {
        // Sort groups: today first, then yesterday, then by date
        if (a.date === 'today') return -1;
        if (b.date === 'today') return 1;
        if (a.date === 'yesterday') return -1;
        if (b.date === 'yesterday') return 1;
        return b.date.localeCompare(a.date);
      });

    return sortedGroups;
  }, [meals]);

  const renderMealItem = ({ item, index }: { item: Meal; index: number }) => (
    <MealCard
      title={item.title}
      type={item.type}
      date={item.date}
      calories={item.calories}
      imageUrl={item.imageUrl}
      onPress={() => openImageModal(item.imageUrl)}
      onDelete={() => handleDeleteMeal(item)}
      delay={index * 30}
    />
  );

  const renderDateSection = ({ item }: { item: GroupedMeals }) => {
    const mealCount = item.meals.length;
    const totalCalories = item.meals.reduce(
      (sum, meal) => sum + (meal.calories || 0),
      0
    );

    return (
      <Animated.View
        entering={FadeInDown.duration(400).springify()}
        style={styles.dateSection}
      >
        <View style={styles.dateHeader}>
          <View style={styles.dateHeaderContent}>
            <Text style={[styles.dateLabel, { color: colors.textPrimary }]}>
              {item.dateLabel}
            </Text>
            <View style={styles.dateStats}>
              <View
                style={[
                  styles.statBadge,
                  { backgroundColor: `${colors.primary}15` },
                ]}
              >
                <Text style={[styles.statText, { color: colors.primary }]}>
                  {mealCount} {mealCount === 1 ? 'meal' : 'meals'}
                </Text>
              </View>
              {totalCalories > 0 && (
                <View
                  style={[
                    styles.statBadge,
                    { backgroundColor: `${colors.accent}15` },
                  ]}
                >
                  <Ionicons
                    name="flame"
                    size={12}
                    color={colors.accent}
                    style={styles.statIcon}
                  />
                  <Text style={[styles.statText, { color: colors.accent }]}>
                    {totalCalories} cal
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <View style={styles.mealsContainer}>
          {item.meals.map((meal, index) => (
            <MealCard
              key={meal._id}
              title={meal.title}
              type={meal.type}
              date={meal.date}
              calories={meal.calories}
              imageUrl={meal.imageUrl}
              onPress={() => openImageModal(meal.imageUrl)}
              onDelete={() => handleDeleteMeal(meal)}
              delay={index * 30}
            />
          ))}
        </View>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <Animated.View
      entering={FadeInUp.delay(200).duration(500).easing(Easing.out(Easing.ease)).springify()}
      style={styles.emptyState}
    >
      <View
        style={[
          styles.emptyStateIcon,
          { backgroundColor: `${colors.primary}15` },
        ]}
      >
        <Ionicons name="restaurant-outline" size={64} color={colors.primary} />
      </View>
      <Text style={[styles.emptyStateTitle, { color: colors.textPrimary }]}>
        No meals logged yet
      </Text>
      <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
        Start tracking your meals by capturing photos and adding details
      </Text>
      <View style={styles.emptyStateButton}>
        <PrimaryButton
          title="Log Your First Meal"
          onPress={() => router.push('./meal-logging')}
          variant="primary"
        />
      </View>
    </Animated.View>
  );

  // FAB animation
  const fabScale = useSharedValue(1);
  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const handleFabPressIn = () => {
    fabScale.value = withSpring(0.9, {
      damping: 15,
      stiffness: 400,
    });
  };

  const handleFabPressOut = () => {
    fabScale.value = withSpring(1, {
      damping: 15,
      stiffness: 400,
    });
  };

  if (isLoading) {
    return <LoadingScreen message="Loading meals..." variant="minimal" />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Gradient */}
      <Animated.View
        entering={FadeInDown.duration(400).springify()}
        style={[
          styles.header,
          {
            paddingTop: insets.top + 16,
            backgroundColor: colors.surface,
          },
        ]}
      >
        <LinearGradient
          colors={[
            `${colors.primary}08`,
            `${colors.accent}05`,
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              Timeline
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Your meal history
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400).springify()}
          style={styles.statsRow}
        >
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {meals.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Meals
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {
                meals.filter(
                  (meal) =>
                    new Date(meal.date).toISOString().split('T')[0] ===
                    new Date().toISOString().split('T')[0]
                ).length
              }
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Today
            </Text>
          </View>
        </Animated.View>
      </Animated.View>

      {/* Meals List */}
      {meals.length === 0 ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 80 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {renderEmptyState()}
        </ScrollView>
      ) : (
        <FlatList
          data={groupedMeals}
          renderItem={renderDateSection}
          keyExtractor={(item) => item.date}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 80 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating Action Button */}
      <AnimatedPressable
        onPress={() => router.push('./meal-logging')}
        onPressIn={handleFabPressIn}
        onPressOut={handleFabPressOut}
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            bottom: Math.max(insets.bottom, 24) + 16,
          },
          fabAnimatedStyle,
        ]}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </AnimatedPressable>

      {/* Image Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.modalContainer}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowImageModal(false)}
          >
            <View />
          </Pressable>
          <Animated.View
            entering={FadeInUp.duration(300).springify()}
            style={styles.modalContent}
          >
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            )}
            <AnimatedPressable
              onPress={() => setShowImageModal(false)}
              style={styles.modalCloseButton}
            >
              <View
                style={[
                  styles.modalCloseButtonInner,
                  { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                ]}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </View>
            </AnimatedPressable>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    overflow: 'hidden',
  },
  headerContent: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '400',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    flexGrow: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  dateSection: {
    marginBottom: 32,
  },
  dateHeader: {
    marginBottom: 16,
  },
  dateHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  dateStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statIcon: {
    marginRight: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mealsContainer: {
    gap: 0,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    width: 120,
    height: 120,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 40,
  },
  emptyStateButton: {
    width: '100%',
    maxWidth: 280,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  modalImage: {
    width: width * 0.95,
    height: width * 0.95,
    maxHeight: '90%',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  modalCloseButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
