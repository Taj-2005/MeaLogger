import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import AppLogo from './AppLogo';

const { width } = Dimensions.get('window');

interface LoadingScreenProps {
  message?: string;
  variant?: 'default' | 'minimal' | 'splash';
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message,
  variant = 'default',
}) => {
  const { colors } = useTheme();
  const opacity = useSharedValue(0);
  const logoScale = useSharedValue(0.9);
  const logoOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Fade in container
    opacity.value = withTiming(1, {
      duration: 400,
      easing: Easing.out(Easing.ease),
    });

    // Logo entrance
    logoOpacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.ease),
    });
    logoScale.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.ease),
    });

    // Continuous pulse animation
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.15, {
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1, {
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    );

    // Subtle rotation (very slow)
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 8000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value * pulseScale.value },
      { rotate: `${rotation.value * 0.1}deg` }, // Very subtle rotation
    ],
    opacity: logoOpacity.value,
  }));

  const pulseRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: 0.3 - (pulseScale.value - 1) * 0.5,
  }));

  if (variant === 'minimal') {
    return (
      <Animated.View style={[styles.container, { backgroundColor: colors.background }, containerStyle]}>
        <View style={styles.minimalContent}>
          <AnimatedLoader colors={colors} />
          {message && (
            <Text style={[styles.minimalMessage, { color: colors.textSecondary }]}>
              {message}
            </Text>
          )}
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, { backgroundColor: colors.background }, containerStyle]}>
      <LinearGradient
        colors={[
          colors.background,
          `${colors.primary}08`,
          `${colors.accent}05`,
          colors.background,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Decorative background shapes */}
      <Animated.View
        style={[
          styles.decorativeCircle,
          {
            backgroundColor: `${colors.primary}06`,
            top: -width * 0.3,
            right: -width * 0.2,
          },
          pulseRingStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.decorativeCircle,
          {
            backgroundColor: `${colors.accent}05`,
            bottom: -width * 0.25,
            left: -width * 0.15,
          },
          pulseRingStyle,
        ]}
      />

      <View style={styles.content}>
        {/* Logo with pulse ring */}
        <View style={styles.logoWrapper}>
          <Animated.View style={[styles.pulseRing, pulseRingStyle]} />
          <Animated.View style={[styles.logoContainer, logoStyle]}>
            <View
              style={[
                styles.logoInner,
                {
                  backgroundColor: `${colors.primary}12`,
                  shadowColor: colors.primary,
                },
              ]}
            >
              <AppLogo size={variant === 'splash' ? 100 : 80} />
            </View>
          </Animated.View>
        </View>

        {/* Loader */}
        <View style={styles.loaderContainer}>
          <AnimatedLoader colors={colors} />
        </View>

        {/* Message */}
        {message && (
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {message}
          </Text>
        )}
      </View>
    </Animated.View>
  );
};

// Animated loader component
const AnimatedLoader: React.FC<{ colors: any }> = ({ colors }) => {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const animateDot = (dot: any, delay: number) => {
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

    // Stagger the animations
    setTimeout(() => animateDot(dot1, 0), 0);
    setTimeout(() => animateDot(dot2, 0), 200);
    setTimeout(() => animateDot(dot3, 0), 400);
  }, []);

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
  minimalContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    position: 'relative',
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(74, 108, 247, 0.3)',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  decorativeCircle: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
  },
  loaderContainer: {
    marginBottom: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  message: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
  minimalMessage: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default LoadingScreen;

