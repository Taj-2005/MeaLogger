import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    FadeIn,
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import AppLogo from '../components/AppLogo';
import PrimaryButton from '../components/PrimaryButton';

const { width, height } = Dimensions.get('window');

// Animated gradient background with subtle motion
const AnimatedGradient = () => {
  const { colors } = useTheme();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    // Subtle continuous motion
    translateX.value = withRepeat(
      withTiming(50, {
        duration: 20000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
    translateY.value = withRepeat(
      withTiming(30, {
        duration: 15000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFillObject,
        { overflow: 'hidden' },
        animatedStyle,
      ]}
    >
      <LinearGradient
        colors={[
          `${colors.primary}15`,
          `${colors.accent}12`,
          `${colors.primary}08`,
          colors.background,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Subtle decorative circles */}
      <View
        style={[
          {
            position: 'absolute',
            width: width * 1.5,
            height: width * 1.5,
            borderRadius: width * 0.75,
            backgroundColor: `${colors.primary}06`,
            top: -width * 0.5,
            right: -width * 0.3,
          },
        ]}
      />
      <View
        style={[
          {
            position: 'absolute',
            width: width * 1.2,
            height: width * 1.2,
            borderRadius: width * 0.6,
            backgroundColor: `${colors.accent}05`,
            bottom: -width * 0.4,
            left: -width * 0.2,
          },
        ]}
      />
    </Animated.View>
  );
};

// Animated logo with scale and fade
const AnimatedLogo = () => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      200,
      withSpring(1, {
        damping: 15,
        stiffness: 100,
        mass: 0.8,
      })
    );
    opacity.value = withDelay(
      200,
      withTiming(1, {
        duration: 800,
        easing: Easing.out(Easing.ease),
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <View
        style={{
          width: 140,
          height: 140,
          borderRadius: 70,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <AppLogo size={100} />
      </View>
    </Animated.View>
  );
};

// Animated headline
const AnimatedHeadline = ({ children, delay }: { children: React.ReactNode; delay: number }) => {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(700).easing(Easing.out(Easing.ease))}
    >
      {children}
    </Animated.View>
  );
};

// Animated description
const AnimatedDescription = ({ children, delay }: { children: React.ReactNode; delay: number }) => {
  return (
    <Animated.View
      entering={FadeIn.delay(delay).duration(600).easing(Easing.out(Easing.ease))}
    >
      {children}
    </Animated.View>
  );
};

// Animated CTA button
const AnimatedCTA = ({ children, delay }: { children: React.ReactNode; delay: number }) => {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(600).easing(Easing.out(Easing.ease))}
    >
      {children}
    </Animated.View>
  );
};

// Animated secondary button with press feedback
const AnimatedPressableButton = ({
  children,
  onPress,
  colors,
}: {
  children: React.ReactNode;
  onPress: () => void;
  colors: any;
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
    opacity.value = withTiming(0.7, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    opacity.value = withTiming(1, { duration: 100 });
  };

  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
};

export default function LandingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Animated gradient background */}
      <AnimatedGradient />

      {/* Main content - centered hero layout */}
      <View
        style={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 40),
            paddingBottom: Math.max(insets.bottom, 40),
          },
        ]}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <AnimatedLogo />
        </View>

        {/* Headline */}
        <AnimatedHeadline delay={400}>
          <Text style={[styles.headline, { color: colors.textPrimary }]}>
            Track Your Meals{'\n'}
            <Text style={{ color: colors.primary }}>Effortlessly</Text>
          </Text>
        </AnimatedHeadline>

        {/* Description */}
        <AnimatedDescription delay={600}>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Simple meal logging with photos,{'\n'}
            streaks, and daily reminders
          </Text>
        </AnimatedDescription>

        {/* CTA Buttons */}
        <View style={styles.ctaContainer}>
          <AnimatedCTA delay={800}>
            <PrimaryButton
              title="Get Started"
              onPress={() => router.push('/(auth)/signup')}
              variant="primary"
              size="lg"
            />
          </AnimatedCTA>

          <AnimatedCTA delay={900}>
            <AnimatedPressableButton
              onPress={() => router.push('/(auth)/login')}
              colors={colors}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
                Already have an account? Sign In
              </Text>
            </AnimatedPressableButton>
          </AnimatedCTA>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  logoContainer: {
    marginBottom: 48,
    alignItems: 'center',
  },
  headline: {
    fontSize: 42,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 52,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 48,
    fontWeight: '400',
  },
  ctaContainer: {
    width: '100%',
    gap: 16,
    paddingHorizontal: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 16,
  },
});
