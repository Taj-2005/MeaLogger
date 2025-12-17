import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
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
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import AnimatedInput from '../components/AnimatedInput';
import AuthLoadingScreen from '../components/AuthLoadingScreen';
import PrimaryButton from '../components/PrimaryButton';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading: authLoading } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleRegister = async () => {
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password.trim()) {
      setError('Password is required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await register(name, email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Full-screen loading state
  if (authLoading || isLoading) {
    return <AuthLoadingScreen message="Creating your account..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Animated gradient background */}
      <LinearGradient
        colors={[
          `${colors.primary}08`,
          `${colors.accent}05`,
          colors.background,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
    >
      <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: Math.max(insets.top, 40) },
          ]}
        keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
      >
          <View style={styles.content}>
          {/* Header */}
            <Animated.View
              entering={FadeInDown.delay(100).duration(600).easing(Easing.out(Easing.ease))}
              style={styles.header}
            >
            <Text
                style={[styles.title, { color: colors.textPrimary }]}
            >
              Create Account
            </Text>
            <Text
                style={[styles.subtitle, { color: colors.textSecondary }]}
            >
              Start your meal tracking journey today
            </Text>
            </Animated.View>

          {/* Form */}
            <View style={styles.form}>
              <AnimatedInput
                label="Full Name"
                icon="person-outline"
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    setError('');
                  }}
                  autoCapitalize="words"
                  autoComplete="name"
                error={!!error && !name.trim()}
                delay={200}
              />

              <AnimatedInput
                label="Email"
                icon="mail-outline"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                autoCorrect={false}
                error={!!error && !email.trim()}
                delay={250}
                />

              <AnimatedInput
                label="Password"
                icon="lock-closed-outline"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError('');
                  }}
                secureTextEntry
                showPasswordToggle
                showPassword={showPassword}
                onPasswordToggle={() => setShowPassword(!showPassword)}
                  autoCapitalize="none"
                  autoComplete="password-new"
                error={!!error && (!password.trim() || password.length < 6)}
                delay={300}
              />

              <AnimatedInput
                label="Confirm Password"
                icon="lock-closed-outline"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setError('');
                  }}
                secureTextEntry
                showPasswordToggle
                showPassword={showConfirmPassword}
                onPasswordToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                  autoCapitalize="none"
                  autoComplete="password-new"
                error={!!error && password !== confirmPassword && confirmPassword.length > 0}
                delay={350}
              />

            {/* Error Message */}
              {error && (
                <Animated.View
                  entering={FadeIn.duration(300)}
                  exiting={FadeIn.duration(200)}
                  style={[styles.errorContainer, { backgroundColor: `${colors.error}15` }]}
              >
                  <Text style={[styles.errorText, { color: colors.error }]}>
                  {error}
                </Text>
                </Animated.View>
              )}

            {/* Sign Up Button */}
              <Animated.View
                entering={FadeInUp.delay(400).duration(500).easing(Easing.out(Easing.ease))}
                style={styles.buttonContainer}
              >
            <PrimaryButton
              title="Create Account"
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading}
              size="lg"
            />
              </Animated.View>
          </View>

          {/* Footer */}
            <Animated.View
              entering={FadeInUp.delay(500).duration(500).easing(Easing.out(Easing.ease))}
              style={styles.footer}
            >
            <Text
                style={[styles.footerText, { color: colors.textSecondary }]}
            >
              Already have an account?{' '}
              </Text>
              <Link href="./login" asChild>
                <Pressable>
                <Text
                    style={[styles.footerLink, { color: colors.primary }]}
                >
                  Sign In
                </Text>
                </Pressable>
              </Link>
            </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    marginBottom: 32,
  },
  errorContainer: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  buttonContainer: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});
