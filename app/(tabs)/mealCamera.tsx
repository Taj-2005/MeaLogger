import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  Image, 
  ActivityIndicator,
  ScrollView,
  Modal,
  Dimensions
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function MealLoggingScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  
  // Camera permissions and state
  const [permission, requestPermission] = useCameraPermissions();
  const [hasMediaLibraryPermission, setHasMediaLibraryPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [mealType, setMealType] = useState('breakfast');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [calories, setCalories] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Request permissions on component mount
  useEffect(() => {
    (async () => {
      const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();
      setHasMediaLibraryPermission(mediaLibraryPermission.status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        setCapturedImage(result.assets[0].uri);
        setShowCamera(false);
        
        // Light haptic feedback
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  const saveImageToAppDirectory = async (imageUri: string): Promise<string> => {
    try {
      // Create app-specific directory for meal images
      const appDirectory = `${FileSystem.documentDirectory}meal_images/`;
      const dirInfo = await FileSystem.getInfoAsync(appDirectory);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(appDirectory, { intermediates: true });
      }
      
      // Generate unique filename
      const filename = `meal_${Date.now()}.jpg`;
      const newPath = `${appDirectory}${filename}`;
      
      // Copy image to app directory
      await FileSystem.copyAsync({
        from: imageUri,
        to: newPath,
      });
      
      return newPath;
    } catch (error) {
      console.error('Error saving image:', error);
      throw error;
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
      // Save image to app directory
      const savedImagePath = await saveImageToAppDirectory(capturedImage);
      
      // Save meal data with the saved image path
      const newMeal = {
        id: Date.now().toString(),
        title,
        mealType,
        date,
        calories: calories ? parseInt(calories) : null,
        imageUri: savedImagePath,
        timestamp: new Date().toISOString(),
      };
      
      // Get existing meals and add new one
      const existingMeals = await AsyncStorage.getItem('meals');
      const meals = existingMeals ? JSON.parse(existingMeals) : [];
      meals.unshift(newMeal);
      await AsyncStorage.setItem('meals', JSON.stringify(meals));
      
      // Success haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Alert.alert('Success', 'Meal logged successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Clear form
            setTitle('');
            setMealType('breakfast');
            setDate(new Date().toISOString().split('T')[0]);
            setCalories('');
            setCapturedImage(null);
            
            // Navigate to timeline
            router.push('./timeline');
          }
        }
      ]);
      
    } catch (error) {
      console.error('Error saving meal:', error);
      setError('Failed to save meal. Please try again.');
      
      // Error haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearForm = () => {
    setTitle('');
    setMealType('breakfast');
    setDate(new Date().toISOString().split('T')[0]);
    setCalories('');
    setCapturedImage(null);
    setError('');
  };

  if (permission === null || hasMediaLibraryPermission === null) {
    return (
      <View className='flex-1 justify-center items-center bg-gray-100'>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className='mt-4 text-gray-600'>Requesting permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className='flex-1 justify-center items-center bg-gray-100 p-4'>
        <Text className='text-center text-gray-700 mb-4'>
          We need your permission to use the camera
        </Text>
        <TouchableOpacity 
          onPress={requestPermission}
          className='bg-blue-600 px-6 py-3 rounded-lg'
        >
          <Text className='text-white font-semibold'>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className='flex-1 bg-gray-100'>
      {/* Camera Modal */}
      <Modal visible={showCamera} animationType="slide">
        <View className='flex-1'>
          <CameraView
            ref={cameraRef}
            style={{ flex: 1 }}
            facing={cameraType}
            ratio="16:9"
          >
            <View className='flex-1 justify-end items-center pb-10'>
              <View className='flex-row justify-between items-center w-full px-8'>
                {/* Cancel Button */}
                <TouchableOpacity
                  onPress={() => setShowCamera(false)}
                  className='bg-gray-800 bg-opacity-70 px-4 py-2 rounded-lg'
                >
                  <Text className='text-white font-semibold'>Cancel</Text>
                </TouchableOpacity>
                
                {/* Capture Button */}
                <TouchableOpacity
                  onPress={takePicture}
                  className='bg-white w-16 h-16 rounded-full border-4 border-gray-300 items-center justify-center'
                >
                  <View className='bg-white w-12 h-12 rounded-full' />
                </TouchableOpacity>
                
                {/* Flip Camera Button */}
                <TouchableOpacity
                  onPress={() => {
                    setCameraType(
                      cameraType === 'back' 
                        ? 'front' 
                        : 'back'
                    );
                  }}
                  className='bg-gray-800 bg-opacity-70 px-4 py-2 rounded-lg'
                >
                  <Text className='text-white font-semibold'>Flip</Text>
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        </View>
      </Modal>

      {/* Main Content */}
      <ScrollView className='flex-1 p-4'>
        <View className='bg-white rounded-xl p-6 shadow-sm'>
          <Text className='text-2xl font-bold text-gray-800 mb-6'>Log Your Meal</Text>
          
          {/* Image Capture Section */}
          <View className='mb-6'>
            <Text className='text-lg font-semibold text-gray-700 mb-3'>Meal Photo</Text>
            {capturedImage ? (
              <View className='relative'>
                <Image
                  source={{ uri: capturedImage }}
                  className='w-full h-48 rounded-lg'
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => setCapturedImage(null)}
                  className='absolute top-2 right-2 bg-red-600 w-8 h-8 rounded-full items-center justify-center'
                >
                  <Text className='text-white font-bold'>×</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setShowCamera(true)}
                className='border-2 border-dashed border-gray-300 rounded-lg h-48 items-center justify-center'
              >
                <Text className='text-gray-500 text-lg'>📸 Tap to take photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Form Fields */}
          <View className='gap-4'>
            {/* Title */}
            <View>
              <Text className='text-gray-700 font-medium mb-2'>Meal Title *</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Grilled Chicken Salad"
                className='border border-gray-300 rounded-lg px-4 py-3 text-gray-700'
              />
            </View>

            {/* Meal Type */}
            <View>
              <Text className='text-gray-700 font-medium mb-2'>Meal Type</Text>
              <View className='border border-gray-300 rounded-lg'>
                <Picker
                  selectedValue={mealType}
                  onValueChange={setMealType}
                  style={{ height: 50 }}
                >
                  <Picker.Item label="Breakfast" value="breakfast" />
                  <Picker.Item label="Lunch" value="lunch" />
                  <Picker.Item label="Dinner" value="dinner" />
                  <Picker.Item label="Snack" value="snack" />
                </Picker>
              </View>
            </View>

            {/* Date */}
            <View>
              <Text className='text-gray-700 font-medium mb-2'>Date</Text>
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                className='border border-gray-300 rounded-lg px-4 py-3 text-gray-700'
              />
            </View>

            {/* Calories (Optional) */}
            <View>
              <Text className='text-gray-700 font-medium mb-2'>Calories (Optional)</Text>
              <TextInput
                value={calories}
                onChangeText={setCalories}
                placeholder="e.g., 350"
                keyboardType="numeric"
                className='border border-gray-300 rounded-lg px-4 py-3 text-gray-700'
              />
            </View>
          </View>

          {/* Error Message */}
          {error && (
            <View className='bg-red-100 border border-red-400 rounded-lg p-3 mt-4'>
              <Text className='text-red-700 text-center'>{error}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View className='flex-row justify-between mt-6 gap-4'>
            <TouchableOpacity
              onPress={clearForm}
              className='flex-1 bg-gray-500 py-3 rounded-lg'
            >
              <Text className='text-white font-semibold text-center'>Clear</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleSaveMeal}
              disabled={isLoading}
              className={`flex-1 py-3 rounded-lg ${
                isLoading ? 'bg-gray-400' : 'bg-blue-600'
              }`}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className='text-white font-semibold text-center'>Save Meal</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}