import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import AppLogo from '../components/AppLogo';
import PrimaryButton from '../components/PrimaryButton';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading: authLoading } = useAuth();
  const { colors } = useTheme();

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

  if (authLoading) {
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingVertical: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6">
          {/* Header */}
          <View className="items-center mb-8">
            <View
              className="w-20 h-20 rounded-2xl items-center justify-center mb-6 overflow-hidden"
              style={{ backgroundColor: `${colors.primary}15` }}
            >
              <AppLogo size={80} className="w-full h-full" />
            </View>
            <Text
              className="text-3xl font-bold mb-2"
              style={{ color: colors.textPrimary }}
            >
              Create Account
            </Text>
            <Text
              className="text-base text-center"
              style={{ color: colors.textSecondary }}
            >
              Start your meal tracking journey today
            </Text>
          </View>

          {/* Form */}
          <View className="mb-6">
            {/* Name Input */}
            <View className="mb-4">
              <Text
                className="text-sm font-semibold mb-2"
                style={{ color: colors.textPrimary }}
              >
                Full Name
              </Text>
              <View
                className="flex-row items-center rounded-xl px-4 py-3.5"
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: error && name ? colors.error : colors.border,
                }}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={{ marginRight: 12 }}
                />
                <TextInput
                  placeholder="Enter your name"
                  placeholderTextColor={colors.textSecondary}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    setError('');
                  }}
                  autoCapitalize="words"
                  autoComplete="name"
                  className="flex-1"
                  style={{
                    color: colors.textPrimary,
                    fontSize: 16,
                  }}
                />
              </View>
            </View>

            {/* Email Input */}
            <View className="mb-4">
              <Text
                className="text-sm font-semibold mb-2"
                style={{ color: colors.textPrimary }}
              >
                Email
              </Text>
              <View
                className="flex-row items-center rounded-xl px-4 py-3.5"
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: error && email ? colors.error : colors.border,
                }}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={{ marginRight: 12 }}
                />
                <TextInput
                  placeholder="Enter your email"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  className="flex-1"
                  style={{
                    color: colors.textPrimary,
                    fontSize: 16,
                  }}
                />
              </View>
            </View>

            {/* Password Input */}
            <View className="mb-4">
              <Text
                className="text-sm font-semibold mb-2"
                style={{ color: colors.textPrimary }}
              >
                Password
              </Text>
              <View
                className="flex-row items-center rounded-xl px-4 py-3.5"
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: error && password ? colors.error : colors.border,
                }}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={{ marginRight: 12 }}
                />
                <TextInput
                  placeholder="Create a password"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError('');
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
                  className="flex-1"
                  style={{
                    color: colors.textPrimary,
                    fontSize: 16,
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="ml-2"
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View className="mb-6">
              <Text
                className="text-sm font-semibold mb-2"
                style={{ color: colors.textPrimary }}
              >
                Confirm Password
              </Text>
              <View
                className="flex-row items-center rounded-xl px-4 py-3.5"
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor:
                    error && confirmPassword ? colors.error : colors.border,
                }}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={{ marginRight: 12 }}
                />
                <TextInput
                  placeholder="Confirm your password"
                  placeholderTextColor={colors.textSecondary}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setError('');
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
                  className="flex-1"
                  style={{
                    color: colors.textPrimary,
                    fontSize: 16,
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="ml-2"
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? 'eye-off-outline' : 'eye-outline'
                    }
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Error Message */}
            {error ? (
              <View
                className="rounded-xl px-4 py-3 mb-4 flex-row items-center"
                style={{ backgroundColor: `${colors.error}15` }}
              >
                <Ionicons
                  name="alert-circle"
                  size={18}
                  color={colors.error}
                  style={{ marginRight: 8 }}
                />
                <Text
                  className="text-sm flex-1"
                  style={{ color: colors.error }}
                >
                  {error}
                </Text>
              </View>
            ) : null}

            {/* Sign Up Button */}
            <PrimaryButton
              title="Create Account"
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading}
              size="lg"
            />
          </View>

          {/* Footer */}
          <View className="items-center">
            <Text
              className="text-sm"
              style={{ color: colors.textSecondary }}
            >
              Already have an account?{' '}
              <Link href="./login">
                <Text
                  className="font-semibold"
                  style={{ color: colors.primary }}
                >
                  Sign In
                </Text>
              </Link>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
