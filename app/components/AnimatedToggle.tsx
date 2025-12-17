import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

const AnimatedToggle: React.FC<AnimatedToggleProps> = ({
  value,
  onValueChange,
  disabled = false,
}) => {
  const { colors } = useTheme();
  const translateX = useSharedValue(value ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    translateX.value = withSpring(value ? 1 : 0, {
      damping: 20,
      stiffness: 300,
      mass: 0.8,
    });
  }, [value]);

  const trackStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: value ? colors.primary : colors.border,
    };
  });

  const thumbStyle = useAnimatedStyle(() => {
    const TRACK_WIDTH = 50;
    const THUMB_SIZE = 22;
    const PADDING = 3;
    const maxTranslate = TRACK_WIDTH - THUMB_SIZE - PADDING * 2;

    return {
      transform: [
        { translateX: translateX.value * maxTranslate },
        { scale: scale.value },
      ],
    };
  });

  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: disabled ? 0.5 : 1,
    };
  });

  const handlePress = () => {
    if (disabled) return;

    // Haptic feedback
    scale.value = withSpring(0.9, {
      damping: 15,
      stiffness: 400,
    });
    setTimeout(() => {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 400,
      });
    }, 100);

    onValueChange(!value);
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      disabled={disabled}
      style={[containerStyle]}
    >
      <Animated.View
        style={[
          styles.track,
          trackStyle,
          {
            width: 50,
            height: 30,
            borderRadius: 15,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            thumbStyle,
            {
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: '#FFFFFF',
            },
          ]}
        />
      </Animated.View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  track: {
    justifyContent: 'center',
    padding: 3,
  },
  thumb: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
});

export default AnimatedToggle;

