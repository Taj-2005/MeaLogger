import React, { useState, useEffect, useCallback } from 'react';
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

const { width } = Dimensions.get('window');

export default function TimelineScreen() {
  const router = useRouter();
  const [meals, setMeals] = useState<Array<{ id: string; title: string; mealType: string; date: string; timestamp: string; imageUri?: string; calories?: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  // Load meals when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadMeals();
    }, [])
  );

  const loadMeals = async () => {
    try {
      const storedMeals = await AsyncStorage.getItem('meals');
      if (storedMeals) {
        const parsedMeals = JSON.parse(storedMeals);
        
        // Verify image files exist and update paths if needed
        const verifiedMeals = await Promise.all(
          parsedMeals.map(async (meal: { imageUri: string; }) => {
            if (meal.imageUri) {
              try {
                const fileInfo = await FileSystem.getInfoAsync(meal.imageUri);
                if (!fileInfo.exists) {
                  // Image file doesn't exist, remove imageUri
                  return { ...meal, imageUri: null };
                }
              } catch (error) {
                console.error('Error checking image file:', error);
                return { ...meal, imageUri: null };
              }
            }
            return meal;
          })
        );
        
        setMeals(verifiedMeals);
      }
    } catch (error) {
      console.error('Error loading meals:', error);
      Alert.alert('Error', 'Failed to load meals');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMeals();
    setRefreshing(false);
  };

  const formatDate = (dateString: string | number | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timestamp: string | number | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMealEmoji = (mealType: any) => {
    switch (mealType) {
      case 'breakfast': return '🍳';
      case 'lunch': return '🥗';
      case 'dinner': return '🍽️';
      case 'snack': return '🍎';
      default: return '🍽️';
    }
  };

  const deleteMeal = async (mealId: string) => {
    try {
      const updatedMeals = meals.filter(meal => meal.id !== mealId);
      await AsyncStorage.setItem('meals', JSON.stringify(updatedMeals));
      setMeals(updatedMeals);
      
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      Alert.alert('Success', 'Meal deleted successfully');
    } catch (error) {
      console.error('Error deleting meal:', error);
      Alert.alert('Error', 'Failed to delete meal');
    }
  };

  const handleDeleteMeal = (meal: { title: any; id: string; }) => {
    Alert.alert(
      'Delete Meal',
      `Are you sure you want to delete "${meal.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteMeal(meal.id)
        }
      ]
    );
  };

  const openImageModal = (imageUri: string | null) => {
      setSelectedImage(imageUri);
      setShowImageModal(true);
  };

  const renderMealItem = ({ item }: { item: { id: string; title: string; mealType: string; date: string; timestamp: string; imageUri?: string; calories?: number } }) => (
    <View className='bg-white rounded-xl p-4 mb-4 shadow-sm'>
      <View className='flex-row justify-between items-start mb-3'>
        <View className='flex-1'>
          <View className='flex-row items-center mb-1'>
            <Text className='text-lg mr-2'>{getMealEmoji(item.mealType)}</Text>
            <Text className='text-lg font-bold text-gray-800 flex-1'>{item.title}</Text>
          </View>
          <Text className='text-sm text-gray-600 capitalize'>{item.mealType}</Text>
          <Text className='text-sm text-gray-500'>{formatDate(item.date)}</Text>
          <Text className='text-xs text-gray-400'>{formatTime(item.timestamp)}</Text>
        </View>
        
        {/* Thumbnail Image */}
        {item.imageUri && (
          <TouchableOpacity
            onPress={() => openImageModal(item.imageUri ?? null)}
            className='ml-3'
          >
            <Image
              source={{ uri: item.imageUri }}
              className='w-16 h-16 rounded-lg'
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Calories */}
      {item.calories && (
        <View className='bg-blue-100 rounded-lg p-2 mb-3'>
          <Text className='text-blue-800 font-medium text-center'>
            {item.calories} calories
          </Text>
        </View>
      )}
      
      {/* Actions */}
      <View className='flex-row justify-end space-x-2'>
        <TouchableOpacity
          onPress={() => handleDeleteMeal(item)}
          className='bg-red-100 px-3 py-1 rounded-lg'
        >
          <Text className='text-red-600 font-medium'>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View className='flex-1 justify-center items-center p-8'>
      <Text className='text-6xl mb-4'>🍽️</Text>
      <Text className='text-xl font-semibold text-gray-700 mb-2'>No meals logged yet</Text>
      <Text className='text-gray-500 text-center mb-6'>
        Start tracking your meals by capturing photos and adding details
      </Text>
      <TouchableOpacity
        onPress={() => router.push('./meal-logging')}
        className='bg-blue-600 px-6 py-3 rounded-lg'
      >
        <Text className='text-white font-semibold'>Log Your First Meal</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View className='flex-1 justify-center items-center bg-gray-100'>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className='mt-4 text-gray-600'>Loading your meals...</Text>
      </View>
    );
  }

  return (
    <View className='flex-1 bg-gray-100'>
      {/* Header */}
      <View className='bg-white pt-12 pb-4 px-4 shadow-sm'>
        <View className='flex-row justify-between items-center'>
          <Text className='text-2xl font-bold text-gray-800'>My Meals</Text>
          <TouchableOpacity
            onPress={() => router.push('./meal-logging')}
            className='bg-blue-600 px-4 py-2 rounded-lg'
          >
            <Text className='text-white font-semibold'>+ Add Meal</Text>
          </TouchableOpacity>
        </View>
        
        {/* Stats */}
        <View className='flex-row justify-between mt-4'>
          <View className='bg-gray-100 rounded-lg p-3 flex-1 mr-2'>
            <Text className='text-2xl font-bold text-gray-800'>{meals.length}</Text>
            <Text className='text-gray-600'>Total Meals</Text>
          </View>
          <View className='bg-gray-100 rounded-lg p-3 flex-1 ml-2'>
            <Text className='text-2xl font-bold text-gray-800'>
              {meals.filter(meal => meal.date === new Date().toISOString().split('T')[0]).length}
            </Text>
            <Text className='text-gray-600'>Today</Text>
          </View>
        </View>
      </View>

      {/* Meals List */}
      <FlatList
        data={meals}
        renderItem={renderMealItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Image Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View className='flex-1 bg-black bg-opacity-90 justify-center items-center'>
          <TouchableOpacity
            onPress={() => setShowImageModal(false)}
            className='absolute top-12 right-4 z-10'
          >
            <View className='bg-white bg-opacity-20 rounded-full w-10 h-10 items-center justify-center'>
              <Text className='text-white text-xl font-bold'>×</Text>
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