import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading: authLoading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateInputs = () => {
    if (!name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!password.trim()) {
      setError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    setError('');
    if (!validateInputs()) return;

    setIsLoading(true);
    try {
      await register(name, email, password);
      Alert.alert('Success', 'Account created! Please login.');
      router.push('./login');
    } catch (error: any) {
      let errorMessage = 'Registration failed. Please try again.';
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email already exists';
          break;
      }
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="mt-4 text-gray-600">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex flex-col justify-center items-center min-h-screen bg-gray-100">
      <View className="flex flex-col justify-center items-center border-2 border-white gap-2 rounded-xl px-10 py-10 bg-white shadow-lg">
        <Text className="text-2xl font-bold pb-4 text-gray-800">Sign Up</Text>

        <View className="flex flex-col justify-center items-center gap-3">
          <View className="border-2 rounded-xl w-72 border-gray-200 px-3">
            <TextInput
              placeholder="Name"
              value={name}
              onChangeText={(text) => {
                setName(text);
                setError('');
              }}
              autoCapitalize="words"
              autoComplete="name"
              autoCorrect={false}
              className="p-2"
            />
          </View>

          <View className="border-2 rounded-xl w-72 border-gray-200 px-3">
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              className="p-2"
            />
          </View>

          <View className="border-2 rounded-xl w-72 border-gray-200 px-3">
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError('');
              }}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              autoCorrect={false}
              className="p-2"
            />
          </View>

          <View className="border-2 rounded-xl w-72 border-gray-200 px-3">
            <TextInput
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setError('');
              }}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              autoCorrect={false}
              className="p-2"
            />
          </View>

          <View className="w-64 mt-2">
            <TouchableOpacity
              onPress={handleRegister}
              disabled={isLoading}
              className={`rounded-xl py-3 px-6 ${
                isLoading ? 'bg-gray-400' : 'bg-blue-600'
              } flex-row justify-center items-center`}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-white font-semibold text-center">Sign Up</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {error ? (
          <View className="bg-red-100 border border-red-400 rounded-lg p-3 mt-2 w-64">
            <Text className="text-red-700 text-sm text-center">{error}</Text>
          </View>
        ) : null}

        <Text className="pt-2 text-gray-600">
          Already have an account?{' '}
          <Link href="./login" className="underline text-blue-700 ml-1">
            Login
          </Link>
        </Text>
      </View>
    </View>
  );
}
