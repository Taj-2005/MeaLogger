import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  Alert, 
  RefreshControl,
  ActivityIndicator,
  Modal,
  Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { auth, db } from '../../firebaseConfig';
import { fetchMealsFromFirestore } from '../../firebaseHelpers';
import { doc, deleteDoc } from 'firebase/firestore';
import { useTheme } from '../../contexts/ThemeContext';
import SettingsButton from '../components/SettingsBtn';

const { width } = Dimensions.get('window');

type Meal = {
  id: string;
  imageUri: string;
  timestamp: string;
  date?: string;
  title: string;
  mealType?: string;
  calories?: number;
};

function getRandomPlaceholder() {
  const placeholders = [
    'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=2970&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1180&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1576867757603-05b134ebc379?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1605926637512-c8b131444a4b?q=80&w=1180&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  ];
  return placeholders[Math.floor(Math.random() * placeholders.length)];
}

export default function TimelineScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadMeals();
    }, [])
  );

  const loadMeals = async () => {
    try {
      setIsLoading(true);

      const userEmail = auth.currentUser?.email ?? 'guest@example.com';
      const firestoreMeals = await fetchMealsFromFirestore(userEmail);

      const enrichedMeals: Meal[] = await Promise.all(
        firestoreMeals.map(async (meal) => {
          let localUri = await AsyncStorage.getItem(`meal_image_${meal.id}`);
          if (localUri) {
            try {
              const fileInfo = await FileSystem.getInfoAsync(localUri);
              if (!fileInfo.exists) localUri = null;
            } catch {
              localUri = null;
            }
          }
          return {
            ...meal,
            imageUri: localUri ?? getRandomPlaceholder(),
          } as Meal;
        })
      );

      enrichedMeals.sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      setMeals(enrichedMeals);
    } catch (error) {
      console.error('Error loading meals:', error);
      Alert.alert('Error', 'Failed to load meals');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMeals();
  };

  const formatDate = (dateString: string | number | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getMealEmoji = (mealType: any) => {
    switch (mealType) {
      case 'breakfast':
        return '🍳';
      case 'lunch':
        return '🥗';
      case 'dinner':
        return '🍽️';
      case 'snack':
        return '🍎';
      default:
        return '🍽️';
    }
  };

  const deleteMeal = async (mealId: string) => {
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'meals', mealId));

      // Delete image uri from AsyncStorage if exists
      await AsyncStorage.removeItem(`meal_image_${mealId}`);

      // Remove from local state
      const updatedMeals = meals.filter((meal) => meal.id !== mealId);
      setMeals(updatedMeals);

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert('Success', 'Meal deleted successfully');
    } catch (error) {
      console.error('Error deleting meal:', error);
      Alert.alert('Error', 'Failed to delete meal');
    }
  };

  const handleDeleteMeal = (meal: { title: any; id: string }) => {
    Alert.alert(
      'Delete Meal',
      `Are you sure you want to delete "${meal.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMeal(meal.id),
        },
      ]
    );
  };

  const openImageModal = (imageUri: string | null) => {
    setSelectedImage(imageUri);
    setShowImageModal(true);
  };

  const renderMealItem = ({ item }: { item: Meal }) => (
    <View className="rounded-xl p-4 mb-4 shadow-sm" style={{ backgroundColor: colors.cardBackground }}>
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <Text className="text-lg mr-2" style={{ color: colors.accent }}>
              {getMealEmoji(item.mealType)}
            </Text>
            <Text className="text-lg font-bold flex-1" style={{ color: colors.textPrimary }}>
              {item.title}
            </Text>
          </View>
          <Text className="text-sm capitalize" style={{ color: colors.textMuted }}>
            {item.mealType}
          </Text>
          <Text className="text-sm" style={{ color: colors.textMuted }}>
            {formatDate(item.date || '')}
          </Text>
        </View>
        <TouchableOpacity onPress={() => openImageModal(item.imageUri)} className="ml-3">
          <Image
            source={{ uri: item.imageUri }}
            className="w-16 h-16 rounded-lg"
            resizeMode="cover"
          />
        </TouchableOpacity>
      </View>

      {item.calories !== undefined && (
        <View className="rounded-lg p-2 mb-3" style={{ backgroundColor: colors.accent + '20' }}>
          <Text className="font-medium text-center" style={{ color: colors.accent }}>
            {item.calories} calories
          </Text>
        </View>
      )}

      <View className="flex-row justify-end space-x-2">
        <TouchableOpacity
          onPress={() => handleDeleteMeal(item)}
          className="px-3 py-1 rounded-lg"
          style={{ backgroundColor: colors.switchTrackFalse }}
        >
          <Text className="font-medium" style={{ color: colors.accent }}>
            Delete
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center p-8">
      <Text className="text-6xl mb-4" style={{ color: colors.accent }}>
        🍽️
      </Text>
      <Text className="text-xl font-semibold mb-2" style={{ color: colors.textPrimary }}>
        No meals logged yet
      </Text>
      <Text className="text-center mb-6" style={{ color: colors.textMuted }}>
        Start tracking your meals by capturing photos and adding details
      </Text>
      <TouchableOpacity
        onPress={() => router.push('./meal-logging')}
        className="px-6 py-3 rounded-lg"
        style={{ backgroundColor: colors.accent }}
      >
        <Text className="font-semibold text-white">Log Your First Meal</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: colors.primaryBackground }}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text className="mt-4" style={{ color: colors.textMuted }}>
          Loading your meals...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.primaryBackground }}>
      <View className="pt-12 pb-4 px-4 shadow-sm" style={{ backgroundColor: colors.cardBackground }}>
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
            My Meals
          </Text>
          <View className="flex flex-row justify-center items-center gap-4">
            <TouchableOpacity
              onPress={() => router.push('./meal-logging')}
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: colors.accent }}
            >
              <Text className="font-semibold text-white">+ Add Meal</Text>
            </TouchableOpacity>
            <SettingsButton />
          </View>
        </View>
        <View className="flex-row justify-between mt-4">
          <View className="rounded-lg p-3 flex-1 mr-2" style={{ backgroundColor: colors.surface }}>
            <Text className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
              {meals.length}
            </Text>
            <Text style={{ color: colors.textMuted }}>Total Meals</Text>
          </View>
          <View className="rounded-lg p-3 flex-1 ml-2" style={{ backgroundColor: colors.surface }}>
            <Text className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
              {meals.filter((meal) => meal.date === new Date().toISOString().split('T')[0]).length}
            </Text>
            <Text style={{ color: colors.textMuted }}>Today</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={meals}
        renderItem={renderMealItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View className="flex-1 justify-center items-center" style={{ backgroundColor: colors.primaryBackground + 'ee' }}>
          <TouchableOpacity
            onPress={() => setShowImageModal(false)}
            className="absolute top-12 right-4 z-10"
          >
            <View className="rounded-full w-10 h-10 items-center justify-center" style={{ backgroundColor: colors.cardBackground + 'cc' }}>
              <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: 'bold' }}>×</Text>
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
