import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function PrimaryActionButton() {
  const { colors } = useTheme();
  const router = useRouter();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, {
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

  return (
    <Animated.View
      entering={FadeInUp.delay(200).duration(500).springify()}
      style={styles.container}
    >
      <AnimatedPressable
        onPress={() => router.push('./meal-logging')}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[animatedStyle]}
      >
        <View
          style={[
            styles.button,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.buttonText}>Add Meal</Text>
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
});

