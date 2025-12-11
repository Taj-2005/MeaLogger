import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { api } from '../../services/api';
import PrimaryButton from '../components/PrimaryButton';

const { width } = Dimensions.get('window');

export default function MealLoggingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [mealType, setMealType] = useState('breakfast');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [calories, setCalories] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        quality: 0.7, // Reduced from 0.8 for faster upload
        aspect: [4, 3],
      });

      if (!result.canceled) {
        setCapturedImage(result.assets[0].uri);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setError('');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setError('Failed to capture image. Please try again.');
    }
  };

  const handleSaveMeal = async () => {
    setError('');

    if (!title.trim()) {
      setError('Please enter a meal title');
      return;
    }
    if (!capturedImage) {
      setError('Please capture a meal photo');
      return;
    }

    setIsLoading(true);

    try {
      const result = await api.createMeal({
        title,
        type: mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
        date,
        calories: calories ? parseInt(calories) : undefined,
        imageUri: capturedImage,
      });

      if (result.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTitle('');
        setMealType('breakfast');
        setDate(new Date().toISOString().split('T')[0]);
        setCalories('');
        setCapturedImage(null);
        
        // Navigate to timeline
        router.push('./timeline');
      } else {
        throw new Error(result.message || 'Failed to save meal');
      }
    } catch (error: any) {
      console.error('Error saving meal:', error);
      const errorMessage = error?.message || 'Failed to save meal. Please try again.';
      setError(errorMessage);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
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
                Log Your Meal
              </Text>
            </View>
          </View>
        </View>

        <View className="px-6 pt-6">
          {/* Image Capture Section */}
          <View className="mb-6">
            <Text
              className="text-base font-semibold mb-3"
              style={{ color: colors.textPrimary }}
            >
              Meal Photo *
            </Text>
            <TouchableOpacity
              onPress={pickImage}
              activeOpacity={0.8}
              className="rounded-2xl overflow-hidden"
              style={{
                height: 200,
                backgroundColor: colors.surface,
                borderWidth: 2,
                borderColor: capturedImage ? colors.primary : colors.border,
                borderStyle: capturedImage ? 'solid' : 'dashed',
              }}
            >
              {capturedImage ? (
                <Image
                  source={{ uri: capturedImage }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <View
                    className="w-16 h-16 rounded-full items-center justify-center mb-3"
                    style={{ backgroundColor: `${colors.primary}15` }}
                  >
                    <Ionicons name="camera" size={32} color={colors.primary} />
                  </View>
                  <Text
                    className="text-base font-semibold mb-1"
                    style={{ color: colors.textPrimary }}
                  >
                    Tap to Capture
                  </Text>
                  <Text
                    className="text-sm"
                    style={{ color: colors.textSecondary }}
                  >
                    Take a photo of your meal
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Title Input */}
          <View className="mb-4">
            <Text
              className="text-base font-semibold mb-3"
              style={{ color: colors.textPrimary }}
            >
              Meal Title *
            </Text>
            <View
              className="rounded-xl px-4 py-3.5"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: error && !title ? colors.error : colors.border,
              }}
            >
              <TextInput
                placeholder="e.g., Grilled Chicken Salad"
                placeholderTextColor={colors.textSecondary}
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  setError('');
                }}
                className="text-base"
                style={{ color: colors.textPrimary }}
              />
            </View>
          </View>

          {/* Meal Type Picker */}
          <View className="mb-4">
            <Text
              className="text-base font-semibold mb-3"
              style={{ color: colors.textPrimary }}
            >
              Meal Type
            </Text>
            <View
              className="rounded-xl overflow-hidden"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Picker
                selectedValue={mealType}
                onValueChange={(value) => setMealType(value)}
                style={{
                  color: colors.textPrimary,
                  backgroundColor: 'transparent',
                }}
              >
                <Picker.Item
                  label="Breakfast"
                  value="breakfast"
                  color={colors.textPrimary}
                />
                <Picker.Item
                  label="Lunch"
                  value="lunch"
                  color={colors.textPrimary}
                />
                <Picker.Item
                  label="Dinner"
                  value="dinner"
                  color={colors.textPrimary}
                />
                <Picker.Item
                  label="Snack"
                  value="snack"
                  color={colors.textPrimary}
                />
              </Picker>
            </View>
          </View>

          {/* Date Input */}
          <View className="mb-4">
            <Text
              className="text-base font-semibold mb-3"
              style={{ color: colors.textPrimary }}
            >
              Date
            </Text>
            <View
              className="rounded-xl px-4 py-3.5 flex-row items-center"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={colors.textSecondary}
                style={{ marginRight: 12 }}
              />
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
                className="flex-1 text-base"
                style={{ color: colors.textPrimary }}
              />
            </View>
          </View>

          {/* Calories Input */}
          <View className="mb-6">
            <Text
              className="text-base font-semibold mb-3"
              style={{ color: colors.textPrimary }}
            >
              Calories (Optional)
            </Text>
            <View
              className="rounded-xl px-4 py-3.5 flex-row items-center"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Ionicons
                name="flame-outline"
                size={20}
                color={colors.textSecondary}
                style={{ marginRight: 12 }}
              />
              <TextInput
                placeholder="Enter calories"
                placeholderTextColor={colors.textSecondary}
                value={calories}
                onChangeText={(text) => {
                  setCalories(text.replace(/[^0-9]/g, ''));
                  setError('');
                }}
                keyboardType="number-pad"
                className="flex-1 text-base"
                style={{ color: colors.textPrimary }}
              />
            </View>
          </View>

          {/* Error Message */}
          {error ? (
            <View
              className="rounded-xl px-4 py-3 mb-4 flex-row items-center"
              style={{ backgroundColor: `${colors.error}15` }}
            >
              <Ionicons
                name="alert-circle"
                size={18}
                color={colors.error}
                style={{ marginRight: 8 }}
              />
              <Text
                className="text-sm flex-1"
                style={{ color: colors.error }}
              >
                {error}
              </Text>
            </View>
          ) : null}


          {/* Save Button */}
          <PrimaryButton
            title="Save Meal"
            onPress={handleSaveMeal}
            loading={isLoading}
            disabled={isLoading}
            size="lg"
            variant="primary"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
