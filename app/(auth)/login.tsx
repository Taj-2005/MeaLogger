import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../firebaseConfig';

export default function LoginScreen() {
  const router = useRouter();
  const { login, user, isLoading: authLoading, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('./(tabs)');
    }
  }, [isAuthenticated]);

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateInputs = () => {
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
    return true;
  };

  const handleLogin = async () => {
    setError('');
    if (!validateInputs()) return;

    setIsLoading(true);
    try {
      await login(email, password);

      // Wait for Firebase auth.currentUser to be updated
      const user = auth.currentUser;
      if (!user) throw new Error('User not found after login');

      if (rememberMe) {
        const token = await user.getIdToken();
        const sessionData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          loginTime: new Date().toISOString(),
        };

        await AsyncStorage.setItem('rememberMe', 'true');
        await AsyncStorage.setItem('storedEmail', email);
        await AsyncStorage.setItem('storedPassword', password);

        console.log('User session saved in AsyncStorage');
      } else {
        await AsyncStorage.multiRemove(['userToken', 'userSession', 'rememberMe']);
        console.log('Remember me not selected: session cleared');
      }

      Alert.alert('Success', 'Logged in successfully!');
      router.push('./(tabs)');
    } catch (error: any) {
      let errorMessage = 'Login failed. Please try again.';
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
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
        <Text className="text-2xl font-bold pb-4 text-gray-800">Login</Text>

        <View className="flex flex-col justify-center items-center gap-3">
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

          <View className="border-2 rounded-xl w-72 border-gray-200 px-3 flex-row items-center">
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError('');
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password"
              autoCorrect={false}
              className="flex-1 p-2"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              className="ml-2"
            >
              <Text className="text-blue-600 text-sm">
                {showPassword ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center w-64 justify-start">
            <TouchableOpacity
              onPress={() => setRememberMe(!rememberMe)}
              className="flex-row items-center"
            >
              <View
                className={`w-4 h-4 border-2 border-gray-400 rounded mr-2 ${
                  rememberMe ? 'bg-blue-600' : 'bg-white'
                }`}
              >
                {rememberMe && (
                  <Text className="text-white text-xs text-center">✓</Text>
                )}
              </View>
              <Text className="text-gray-600 text-sm">Remember me</Text>
            </TouchableOpacity>
          </View>

          <View className="w-64 mt-2">
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              className={`rounded-xl py-3 px-6 ${
                isLoading ? 'bg-gray-400' : 'bg-blue-600'
              } flex-row justify-center items-center`}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-white font-semibold text-center">Login</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push('./forgot-password')}>
            <Text className="text-blue-600 underline text-sm">Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setEmail('');
              setPassword('');
              setError('');
            }}
          >
            <Text className="text-gray-600 text-sm">Clear Form</Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <View className="bg-red-100 border border-red-400 rounded-lg p-3 mt-2 w-64">
            <Text className="text-red-700 text-sm text-center">{error}</Text>
          </View>
        ) : null}

        <Text className="pt-2 text-gray-600">
          Don't have an account?{' '}
          <Link href="./signup" className="underline text-blue-700 ml-1">
            Sign Up
          </Link>
        </Text>
      </View>
    </View>
  );
}
