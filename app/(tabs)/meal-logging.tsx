import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { api } from '../../services/api';
import AnimatedInput from '../components/AnimatedInput';
import MealTypePicker from '../components/MealTypePicker';
import PrimaryButton from '../components/PrimaryButton';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Date Picker Button Component
const DatePickerButton: React.FC<{
  date: string;
  onPress: () => void;
  colors: any;
}> = ({ date, onPress, colors }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, {
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

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const dateObj = new Date(dateString);
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      };
      return dateObj.toLocaleDateString(undefined, options);
    } catch {
      return dateString;
    }
  };

  return (
    <View style={styles.datePickerContainer}>
      <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
        Date
      </Text>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.datePickerButton}
      >
        <Animated.View
          style={[
            styles.datePickerButtonInner,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
            },
            animatedStyle,
          ]}
        >
          <Ionicons
            name="calendar-outline"
            size={20}
            color={colors.primary}
            style={styles.datePickerIcon}
          />
          <Text style={[styles.datePickerText, { color: colors.textPrimary }]}>
            {formatDate(date)}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textSecondary}
          />
        </Animated.View>
      </AnimatedPressable>
    </View>
  );
};

const { width } = Dimensions.get('window');

export default function MealLoggingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [mealType, setMealType] = useState('breakfast');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calories, setCalories] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        quality: 0.7,
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

  // Image container animation
  const imageScale = useSharedValue(1);
  const imageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: imageScale.value }],
  }));

  const handleImagePress = () => {
    imageScale.value = withSpring(0.98, {
      damping: 15,
      stiffness: 400,
    });
    setTimeout(() => {
      imageScale.value = withSpring(1, {
        damping: 15,
        stiffness: 400,
      });
      pickImage();
    }, 100);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
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
              Add Meal
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Capture and log your meal
            </Text>
          </View>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photo Upload Section */}
        <Animated.View
          entering={FadeInUp.delay(100).duration(500).easing(Easing.out(Easing.ease)).springify()}
          style={styles.section}
        >
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Meal Photo
          </Text>
          <AnimatedPressable
            onPress={handleImagePress}
            style={imageAnimatedStyle}
          >
            <View
              style={[
                styles.imageContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: capturedImage ? colors.primary : colors.border,
                },
              ]}
            >
              {capturedImage ? (
                <Animated.View
                  entering={FadeInUp.duration(300)}
                  style={styles.imageWrapper}
                >
                  <Image
                    source={{ uri: capturedImage }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                  <View style={[styles.imageOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.2)' }]}>
                    <View
                      style={[
                        styles.imageEditBadge,
                        { backgroundColor: `${colors.primary}E6` },
                      ]}
                    >
                      <Ionicons name="camera" size={20} color="#FFFFFF" />
                      <Text style={styles.imageEditText}>Change Photo</Text>
                    </View>
                  </View>
                </Animated.View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <View
                    style={[
                      styles.imagePlaceholderIcon,
                      { backgroundColor: `${colors.primary}15` },
                    ]}
                  >
                    <Ionicons name="camera" size={48} color={colors.primary} />
                  </View>
                  <Text
                    style={[styles.imagePlaceholderTitle, { color: colors.textPrimary }]}
                  >
                    Tap to Capture
                  </Text>
                  <Text
                    style={[styles.imagePlaceholderText, { color: colors.textSecondary }]}
                  >
                    Take a photo of your meal
                  </Text>
                </View>
              )}
            </View>
          </AnimatedPressable>
        </Animated.View>

        {/* Meal Details Section */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400).springify()}
          style={styles.section}
        >
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Meal Details
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <AnimatedInput
              label="Meal Title"
              icon="restaurant-outline"
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                setError('');
              }}
              placeholder="e.g., Grilled Chicken Salad"
              error={!!error && !title}
              delay={0}
            />

            {/* Meal Type Picker */}
            <MealTypePicker
              value={mealType}
              onValueChange={setMealType}
            />

            {/* Date Picker */}
            <DatePickerButton
              date={date}
              onPress={() => setShowDatePicker(true)}
              colors={colors}
            />

            {showDatePicker && (
              <DateTimePicker
                value={new Date(date)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setDate(selectedDate.toISOString().split('T')[0]);
                  }
                }}
                maximumDate={new Date()}
              />
            )}

            {/* Calories Input */}
            <AnimatedInput
              label="Calories (Optional)"
              icon="flame-outline"
              value={calories}
              onChangeText={(text) => {
                setCalories(text.replace(/[^0-9]/g, ''));
                setError('');
              }}
              placeholder="Enter calories"
              keyboardType="number-pad"
              delay={100}
            />

            {/* Error Message */}
            {error ? (
              <Animated.View
                entering={FadeInDown.duration(300)}
                style={[styles.errorContainer, { backgroundColor: `${colors.error}15` }]}
              >
                <Ionicons
                  name="alert-circle"
                  size={18}
                  color={colors.error}
                  style={styles.errorIcon}
                />
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {error}
                </Text>
              </Animated.View>
            ) : null}
          </View>
        </Animated.View>

        {/* Save Button */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(400).springify()}
          style={styles.saveButtonContainer}
        >
          <PrimaryButton
            title="Save Meal"
            onPress={handleSaveMeal}
            loading={isLoading}
            disabled={isLoading || !title.trim() || !capturedImage}
            variant="primary"
            size="lg"
          />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  imageContainer: {
    width: '100%',
    height: 280,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageEditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  imageEditText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  imagePlaceholderIcon: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  imagePlaceholderTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  imagePlaceholderText: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
  card: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pickerContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  pickerWrapper: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  errorIcon: {
    marginRight: 10,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  saveButtonContainer: {
    marginBottom: 24,
  },
  datePickerContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  datePickerButton: {
    marginTop: 8,
  },
  datePickerButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  datePickerIcon: {
    marginRight: 12,
  },
  datePickerText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
});
