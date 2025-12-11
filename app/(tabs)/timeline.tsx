import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    Modal,
    Platform,
    RefreshControl,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { api } from '../../services/api';
import { CachedMeal, OfflineStorage } from '../../services/offlineStorage';
import { useNetworkStatus } from '../../utils/network';
import MealCard from '../components/MealCard';
import PrimaryButton from '../components/PrimaryButton';

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

export default function TimelineScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const networkState = useNetworkStatus();

  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      loadMeals(false);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Sync when network comes back
  useEffect(() => {
    if (networkState.isConnected && networkState.isInternetReachable) {
      // Network restored, try to sync
      loadMeals(false);
    }
  }, [networkState.isConnected, networkState.isInternetReachable]);

  useFocusEffect(
    useCallback(() => {
      loadMeals();
    }, [])
  );

  const loadMeals = async (showLoading: boolean = true) => {
    try {
      if (showLoading) setIsLoading(true);

      // Load from cache first for instant display
      const cachedMeals = await OfflineStorage.getMeals();
      if (cachedMeals.length > 0) {
        const cachedMealsData: Meal[] = cachedMeals.map((meal: CachedMeal) => ({
          _id: meal._id || meal.localId || '',
          title: meal.title,
          type: meal.type,
          date: meal.date,
          calories: meal.calories,
          imageUrl: meal.imageUrl,
          createdAt: meal.createdAt,
        }));

        cachedMealsData.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });

        setMeals(cachedMealsData);
        setIsOffline(!networkState.isConnected);
      }

      // Try to fetch from server
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
        setIsOffline(false);
      }
    } catch (error: any) {
      console.error('Error loading meals:', error);
      // If offline, keep showing cached meals
      if (error.message?.includes('No internet') || error.message?.includes('queued')) {
        setIsOffline(true);
      }
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
      // If offline, the meal is already removed from cache
      if (error.message?.includes('queued') || error.message?.includes('sync')) {
        // Meal was queued for deletion, reload to show updated state
        await loadMeals(false);
      } else {
        // Restore meals on error
        loadMeals();
      }
    }
  };

  const handleDeleteMeal = (meal: Meal) => {
    const isWeb = Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.confirm === 'function';

    if (isWeb) {
      const confirmed = window.confirm(`Are you sure you want to delete "${meal.title}"?`);
      if (confirmed) {
        deleteMeal(meal._id);
      }
    } else {
      Alert.alert(
        'Delete Meal',
        `Are you sure you want to delete "${meal.title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteMeal(meal._id),
          },
        ]
      );
    }
  };

  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const renderMealItem = ({ item }: { item: Meal }) => (
    <MealCard
      title={item.title}
      type={item.type}
      date={item.date}
      calories={item.calories}
      imageUrl={item.imageUrl}
      onPress={() => openImageModal(item.imageUrl)}
      onDelete={() => handleDeleteMeal(item)}
    />
  );

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center p-8">
      <Ionicons name="restaurant-outline" size={64} color={colors.primary} style={{ marginBottom: 16 }} />
      <Text
        className="text-xl font-semibold mb-2"
        style={{ color: colors.textPrimary }}
      >
        No meals logged yet
      </Text>
      <Text
        className="text-center mb-6 text-sm"
        style={{ color: colors.textSecondary }}
      >
        Start tracking your meals by capturing photos and adding details
      </Text>
      <PrimaryButton
        title="Log Your First Meal"
        onPress={() => router.push('./meal-logging')}
      />
    </View>
  );

  if (isLoading) {
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      {/* Header */}
      <View
        className="pb-6 px-6"
        style={{ 
          backgroundColor: colors.surface,
          paddingTop: insets.top + 20,
        }}
      >
        <View className="mb-4 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Image
              source={require('../../assets/logo.png')}
              style={{ width: 32, height: 32, marginRight: 12 }}
              resizeMode="contain"
            />
            <Text
              className="text-2xl font-bold"
              style={{ color: colors.textPrimary }}
            >
              My Meals
            </Text>
          </View>
          {isOffline && (
            <View className="flex-row items-center px-3 py-1.5 rounded-full" style={{ backgroundColor: `${colors.warning}20` }}>
              <Ionicons name="cloud-offline-outline" size={16} color={colors.warning} />
              <Text className="text-xs font-medium ml-1.5" style={{ color: colors.warning }}>
                Offline
              </Text>
            </View>
          )}
        </View>

        {/* Stats Row */}
        <View className="flex-row -mx-2">
          <View
            className="flex-1 mx-2 rounded-xl p-4"
            style={{ backgroundColor: colors.surface }}
          >
            <Text
              className="text-2xl font-bold mb-1"
              style={{ color: colors.textPrimary }}
            >
              {meals.length}
            </Text>
            <Text
              className="text-sm font-medium"
              style={{ color: colors.textSecondary }}
            >
              Total Meals
            </Text>
          </View>
          <View
            className="flex-1 mx-2 rounded-xl p-4"
            style={{ backgroundColor: colors.surface }}
          >
            <Text
              className="text-2xl font-bold mb-1"
              style={{ color: colors.textPrimary }}
            >
              {meals.filter(
                (meal) =>
                  new Date(meal.date).toISOString().split('T')[0] ===
                  new Date().toISOString().split('T')[0]
              ).length}
            </Text>
            <Text
              className="text-sm font-medium"
              style={{ color: colors.textSecondary }}
            >
              Today
            </Text>
          </View>
        </View>
      </View>

      {/* Meals List */}
      <FlatList
        data={meals}
        renderItem={renderMealItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => router.push('./meal-logging')}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full items-center justify-center"
        style={{
          backgroundColor: colors.primary,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Image Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View
          className="flex-1 justify-center items-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
        >
          <TouchableOpacity
            onPress={() => setShowImageModal(false)}
            className="absolute top-12 right-4 z-10"
          >
            <View
              className="rounded-full w-10 h-10 items-center justify-center"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={{ width: width * 0.9, height: width * 0.9 }}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}
