import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', icon: 'sunny-outline' as const },
  { value: 'lunch', label: 'Lunch', icon: 'restaurant-outline' as const },
  { value: 'dinner', label: 'Dinner', icon: 'moon-outline' as const },
  { value: 'snack', label: 'Snack', icon: 'cafe-outline' as const },
];

interface MealTypePickerProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
}

const MealTypePicker: React.FC<MealTypePickerProps> = ({
  value,
  onValueChange,
  label = 'Meal Type',
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);

  const selectedMealType = MEAL_TYPES.find((type) => type.value === value) || MEAL_TYPES[0];

  // Animation values
  const scale = useSharedValue(1);
  const modalOpacity = useSharedValue(0);
  const modalTranslateY = useSharedValue(300);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const modalBackdropStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
  }));

  const modalContentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: modalTranslateY.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.98, {
      damping: 15,
      stiffness: 400,
    });
    setTimeout(() => {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 400,
      });
      openModal();
    }, 100);
  };

  const openModal = () => {
    setIsOpen(true);
    modalOpacity.value = withTiming(1, {
      duration: 200,
      easing: Easing.out(Easing.ease),
    });
    modalTranslateY.value = withSpring(0, {
      damping: 20,
      stiffness: 300,
    });
  };

  const closeModal = () => {
    modalOpacity.value = withTiming(0, {
      duration: 200,
      easing: Easing.in(Easing.ease),
    });
    modalTranslateY.value = withTiming(300, {
      duration: 200,
      easing: Easing.in(Easing.ease),
    });
    setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const handleSelect = (mealType: string) => {
    onValueChange(mealType);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    closeModal();
  };

  return (
    <>
      <View style={styles.container}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
        <AnimatedPressable
          onPress={handlePress}
          style={[buttonAnimatedStyle]}
        >
          <View
            style={[
              styles.button,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.buttonContent}>
              <Ionicons
                name={selectedMealType.icon}
                size={20}
                color={colors.primary}
                style={styles.buttonIcon}
              />
              <Text style={[styles.buttonText, { color: colors.textPrimary }]}>
                {selectedMealType.label}
              </Text>
            </View>
            <Ionicons
              name="chevron-down"
              size={20}
              color={colors.textSecondary}
            />
          </View>
        </AnimatedPressable>
      </View>

      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={closeModal}
      >
        <AnimatedPressable
          style={[styles.modalBackdrop, modalBackdropStyle]}
          onPress={closeModal}
          activeOpacity={1}
        >
          <AnimatedPressable
            style={[styles.modalContent, modalContentStyle]}
            onPress={(e) => e.stopPropagation()}
            activeOpacity={1}
          >
            <View
              style={[
                styles.modalSheet,
                {
                  backgroundColor: colors.surface,
                  paddingBottom: Math.max(insets.bottom, 20),
                },
              ]}
            >
              {/* Handle */}
              <View style={[styles.handle, { backgroundColor: colors.border }]} />

              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  Select Meal Type
                </Text>
                <TouchableOpacity
                  onPress={closeModal}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Options */}
              <View style={styles.optionsContainer}>
                {MEAL_TYPES.map((mealType, index) => {
                  const isSelected = mealType.value === value;
                  return (
                    <AnimatedTouchableOpacity
                      key={mealType.value}
                      entering={FadeInDown.delay(index * 50).duration(300).springify()}
                      onPress={() => handleSelect(mealType.value)}
                      style={[
                        styles.option,
                        {
                          backgroundColor: isSelected
                            ? `${colors.primary}15`
                            : 'transparent',
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <View style={styles.optionContent}>
                        <View
                          style={[
                            styles.optionIconContainer,
                            {
                              backgroundColor: isSelected
                                ? `${colors.primary}20`
                                : `${colors.textSecondary}10`,
                            },
                          ]}
                        >
                          <Ionicons
                            name={mealType.icon}
                            size={24}
                            color={isSelected ? colors.primary : colors.textSecondary}
                          />
                        </View>
                        <Text
                          style={[
                            styles.optionLabel,
                            {
                              color: isSelected
                                ? colors.textPrimary
                                : colors.textSecondary,
                              fontWeight: isSelected ? '600' : '500',
                            },
                          ]}
                        >
                          {mealType.label}
                        </Text>
                      </View>
                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color={colors.primary}
                        />
                      )}
                    </AnimatedTouchableOpacity>
                  );
                })}
              </View>
            </View>
          </AnimatedPressable>
        </AnimatedPressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  buttonIcon: {
    marginRight: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 16,
    flex: 1,
  },
});

export default MealTypePicker;

