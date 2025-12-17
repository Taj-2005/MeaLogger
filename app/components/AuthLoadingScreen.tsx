import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import AppLogo from './AppLogo';

interface AuthLoadingScreenProps {
  message?: string;
}

const AuthLoadingScreen: React.FC<AuthLoadingScreenProps> = ({
  message = 'Please wait...',
}) => {
  const { colors } = useTheme();
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Fade in
    opacity.value = withTiming(1, {
      duration: 400,
      easing: Easing.out(Easing.ease),
    });

    // Scale animation
    scale.value = withRepeat(
      withTiming(1.1, {
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    // Rotation animation (subtle)
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 3000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <LinearGradient
        colors={[
          colors.background,
          `${colors.primary}05`,
          colors.background,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <View
            style={[
              styles.logoWrapper,
              {
                backgroundColor: `${colors.primary}10`,
                shadowColor: colors.primary,
              },
            ]}
          >
            <AppLogo size={80} />
          </View>
        </Animated.View>

        <View style={styles.loaderContainer}>
          <LoadingDots colors={colors} />
        </View>

        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
};

// Animated loading dots
const LoadingDots: React.FC<{ colors: any }> = ({ colors }) => {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const animateDot = (dot: any, delay: number) => {
      dot.value = withRepeat(
        withTiming(1, {
          duration: 600,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    };

    animateDot(dot1, 0);
    animateDot(dot2, 200);
    animateDot(dot3, 400);
  }, []);

  const dot1Style = useAnimatedStyle(() => ({
    opacity: 0.3 + dot1.value * 0.7,
    transform: [{ scale: 0.8 + dot1.value * 0.4 }],
  }));

  const dot2Style = useAnimatedStyle(() => ({
    opacity: 0.3 + dot2.value * 0.7,
    transform: [{ scale: 0.8 + dot2.value * 0.4 }],
  }));

  const dot3Style = useAnimatedStyle(() => ({
    opacity: 0.3 + dot3.value * 0.7,
    transform: [{ scale: 0.8 + dot3.value * 0.4 }],
  }));

  return (
    <View style={styles.dotsContainer}>
      <Animated.View
        style={[
          styles.dot,
          { backgroundColor: colors.primary },
          dot1Style,
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          { backgroundColor: colors.primary },
          dot2Style,
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          { backgroundColor: colors.primary },
          dot3Style,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  loaderContainer: {
    marginBottom: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default AuthLoadingScreen;

