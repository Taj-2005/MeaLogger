import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';

interface InlineLoaderProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

const InlineLoader: React.FC<InlineLoaderProps> = ({
  size = 'medium',
  color,
}) => {
  const { colors } = useTheme();
  const dotColor = color || colors.primary;

  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const animateDot = (dot: any) => {
      dot.value = withRepeat(
        withSequence(
          withTiming(1, {
            duration: 600,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0, {
            duration: 600,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      );
    };

    animateDot(dot1);
    setTimeout(() => animateDot(dot2), 200);
    setTimeout(() => animateDot(dot3), 400);
  }, []);

  const getSize = () => {
    switch (size) {
      case 'small':
        return { dot: 6, gap: 6 };
      case 'large':
        return { dot: 14, gap: 10 };
      default:
        return { dot: 10, gap: 8 };
    }
  };

  const { dot: dotSize, gap } = getSize();

  const dot1Style = useAnimatedStyle(() => ({
    opacity: 0.4 + dot1.value * 0.6,
    transform: [{ scale: 0.9 + dot1.value * 0.3 }],
  }));

  const dot2Style = useAnimatedStyle(() => ({
    opacity: 0.4 + dot2.value * 0.6,
    transform: [{ scale: 0.9 + dot2.value * 0.3 }],
  }));

  const dot3Style = useAnimatedStyle(() => ({
    opacity: 0.4 + dot3.value * 0.6,
    transform: [{ scale: 0.9 + dot3.value * 0.3 }],
  }));

  return (
    <View style={[styles.container, { gap }]}>
      <Animated.View
        style={[
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: dotColor,
          },
          dot1Style,
        ]}
      />
      <Animated.View
        style={[
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: dotColor,
          },
          dot2Style,
        ]}
      />
      <Animated.View
        style={[
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: dotColor,
          },
          dot3Style,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default InlineLoader;

