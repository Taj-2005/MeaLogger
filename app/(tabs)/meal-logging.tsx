import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Settings,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { auth } from '../../firebaseConfig';
import { saveMealToFirestore } from '../../firebaseHelpers';
import { useTheme } from '../../contexts/ThemeContext';
import SettingsButton from '../components/SettingsBtn';

const { width } = Dimensions.get('window');

export default function MealLoggingScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

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
      const userEmail = auth.currentUser?.email ?? 'guest@example.com';

      const mealData = {
        id: mealId,
        title,
        mealType,
        date,
        calories: calories ? parseInt(calories) : undefined,
        timestamp: new Date().toISOString(),
        userEmail,
      };

      await saveMealToFirestore(mealId, mealData);
      await AsyncStorage.setItem(`meal_image_${mealId}`, capturedImage);

      const existingMeals = await AsyncStorage.getItem('meals');
      const meals = existingMeals ? JSON.parse(existingMeals) : [];
      meals.unshift({ ...mealData, imageUri: capturedImage });
      await AsyncStorage.setItem('meals', JSON.stringify(meals));

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
          },
        },
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
    <View
      className="flex-1 pt-20 p-4"
      style={{ backgroundColor: colors.primaryBackground }}
    >
      <ScrollView>
        <View className="flex-row items-center justify-between  mb-4">
          <Text
            className="text-2xl font-bold"
            style={{ color: colors.textPrimary }}
          >
            Log Your Meal
          </Text>
          <SettingsButton />
        </View>

        <TouchableOpacity
          onPress={pickImage}
          className="border-2 border-dashed rounded-lg h-48 mb-6 flex items-center justify-center"
          style={{ borderColor: colors.border }}
        >
          {capturedImage ? (
            <Image
              source={{ uri: capturedImage }}
              style={{ width: width - 32, height: 192, borderRadius: 12 }}
              resizeMode="cover"
            />
          ) : (
            <View className="flex flex-col justify-center items-center">
              <Ionicons
                name="camera-outline"
                size={30}
                color={isDark ? colors.textMuted : '#000'}
              />
              <Text
                className="text-gray-500"
                style={{ color: colors.textMuted }}
              >
                Tap to take photo
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TextInput
          placeholder="Meal Title"
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={setTitle}
          className="border rounded-lg p-3 mb-4"
          style={{
            borderColor: colors.border,
            color: colors.textPrimary,
            backgroundColor: colors.surface,
          }}
        />

        <View
          className="mb-4 rounded-lg"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
          }}
        >
          <Picker
            selectedValue={mealType}
            onValueChange={setMealType}
            style={{ color: colors.textPrimary }}
            dropdownIconColor={colors.textPrimary}
          >
            <Picker.Item label="Breakfast" value="breakfast" />
            <Picker.Item label="Lunch" value="lunch" />
            <Picker.Item label="Dinner" value="dinner" />
            <Picker.Item label="Snack" value="snack" />
          </Picker>
        </View>

        <TextInput
          placeholder="Date (YYYY-MM-DD)"
          placeholderTextColor={colors.textMuted}
          value={date}
          onChangeText={setDate}
          className="border rounded-lg p-3 mb-4"
          style={{
            borderColor: colors.border,
            color: colors.textPrimary,
            backgroundColor: colors.surface,
          }}
        />

        <TextInput
          placeholder="Calories (optional)"
          placeholderTextColor={colors.textMuted}
          value={calories}
          onChangeText={setCalories}
          keyboardType="numeric"
          className="border rounded-lg p-3 mb-4"
          style={{
            borderColor: colors.border,
            color: colors.textPrimary,
            backgroundColor: colors.surface,
          }}
        />

        {error ? (
          <Text className="mb-4 text-red-600">
            {error}
          </Text>
        ) : null}

        <TouchableOpacity
          onPress={handleSaveMeal}
          disabled={isLoading}
          className={`py-4 rounded-lg ${
            isLoading ? 'bg-gray-400' : 'bg-blue-600'
          }`}
          style={{
            backgroundColor: isLoading ? colors.border : colors.accent,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.switchThumb} />
          ) : (
            <Text
              className="font-semibold text-center"
              style={{ color: colors.switchThumb }}
            >
              Save Meal
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
