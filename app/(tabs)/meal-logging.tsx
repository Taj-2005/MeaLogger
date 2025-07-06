import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { saveMealToFirestore } from '../../firebaseHelpers';

const { width } = Dimensions.get('window');

export default function MealLoggingScreen() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [mealType, setMealType] = useState('breakfast');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [calories, setCalories] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const pickImage = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setCapturedImage(result.assets[0].uri);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSaveMeal = async () => {
    if (!title.trim()) {
      setError('Please enter a meal title');
      return;
    }
    if (!capturedImage) {
      setError('Please capture a meal photo');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const mealId = Date.now().toString();

      // Save meal details in Firestore
      const mealData = {
        title,
        mealType,
        date,
        calories: calories ? parseInt(calories) : undefined,
        timestamp: new Date().toISOString(),
      };
      await saveMealToFirestore(mealId, mealData);

      // Save local image URI in AsyncStorage by mealId
      await AsyncStorage.setItem(`meal_image_${mealId}`, capturedImage);

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Meal logged successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setTitle('');
            setMealType('breakfast');
            setDate(new Date().toISOString().split('T')[0]);
            setCalories('');
            setCapturedImage(null);
            router.push('./timeline');
          }
        }
      ]);
    } catch (error) {
      console.error('Error saving meal:', error);
      setError('Failed to save meal. Please try again.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className='flex-1 bg-gray-100 mt-20 p-4'>
      <ScrollView>
        <Text className='text-2xl font-bold mb-4'>Log Your Meal</Text>

        <TouchableOpacity
          onPress={pickImage}
          className='border-2 border-dashed border-gray-300 rounded-lg h-48 mb-6 flex items-center justify-center'
        >
          {capturedImage ? (
            <Image
              source={{ uri: capturedImage }}
              style={{ width: width - 32, height: 192, borderRadius: 12 }}
              resizeMode="cover"
            />
          ) : (
            <Text className='text-gray-500'>Tap to take photo</Text>
          )}
        </TouchableOpacity>

        <TextInput
          placeholder="Meal Title"
          value={title}
          onChangeText={setTitle}
          className='border border-gray-300 rounded-lg p-3 mb-4 bg-white'
        />

        <Picker
          selectedValue={mealType}
          onValueChange={setMealType}
          style={{ backgroundColor: 'white', marginBottom: 16 }}
        >
          <Picker.Item label="Breakfast" value="breakfast" />
          <Picker.Item label="Lunch" value="lunch" />
          <Picker.Item label="Dinner" value="dinner" />
          <Picker.Item label="Snack" value="snack" />
        </Picker>

        <TextInput
          placeholder="Date (YYYY-MM-DD)"
          value={date}
          onChangeText={setDate}
          className='border border-gray-300 rounded-lg p-3 mb-4 bg-white'
        />

        <TextInput
          placeholder="Calories (optional)"
          value={calories}
          onChangeText={setCalories}
          keyboardType="numeric"
          className='border border-gray-300 rounded-lg p-3 mb-4 bg-white'
        />

        {error ? <Text className='text-red-600 mb-4'>{error}</Text> : null}

        <TouchableOpacity
          onPress={handleSaveMeal}
          disabled={isLoading}
          className={`py-4 rounded-lg ${isLoading ? 'bg-gray-400' : 'bg-blue-600'}`}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className='text-white font-semibold text-center'>Save Meal</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
