import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { createUserWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../firebaseConfig';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Input validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

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
    if (!confirmPassword.trim()) {
      setError('Please confirm your password');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const clearAnyStoredData = async () => {
    try {
      // Clear any existing session data to ensure clean state
      await AsyncStorage.multiRemove(['userSession', 'userToken', 'rememberMe']);
      console.log('Cleared any existing session data');
    } catch (error) {
      console.error('Error clearing stored data:', error);
    }
  };

  const handleRegister = async () => {
    setError('');
    setSuccess('');
    
    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);
    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Update profile with displayName
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: name,
        });
      }
      
      // Important: Sign out the user immediately after registration
      // This prevents automatic login and redirect to the app
      await signOut(auth);
      
      // Clear any stored session data
      await clearAnyStoredData();
      
      console.log('User registered successfully but signed out');
      
      Alert.alert(
        'Success', 
        'Account created successfully! Please login to continue.',
        [
          {
            text: 'OK',
            onPress: () => {
              setSuccess('Registration successful! Please login.');
              // Navigate to login page after user acknowledges
              router.push('./login');
            }
          }
        ]
      );
      
    } catch (error: any) {
      let errorMessage = 'Registration failed. Please try again.';
      
      // Handle specific Firebase error codes
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection';
          break;
        default:
          errorMessage = error.message || 'Registration failed';
      }
      
      Alert.alert('Error', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const clearForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  return (
    <View className='flex flex-col justify-center items-center min-h-screen bg-gray-100'>
      <View className='flex flex-col justify-center items-center border-2 border-white gap-2 rounded-xl px-16 py-10 bg-white shadow-lg'>
        <Text className='text-2xl font-bold pb-4 text-gray-800'>Sign Up</Text>
        
        <View className='flex flex-col justify-center items-center gap-3'>

          {/* Name Input */}
          <View className='border-2 rounded-xl w-72 border-gray-200 px-3'>
            <TextInput 
              placeholder="Name" 
              value={name} 
              onChangeText={(text) => {
                setName(text);
                setError('');
              }}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          {/* Email Input */}
          <View className='border-2 rounded-xl w-72 border-gray-200 px-3'>
            <TextInput 
              placeholder="Email" 
              value={email} 
              onChangeText={(text) => {
                setEmail(text);
                setError(''); // Clear error when user types
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
            />
          </View>
          
          {/* Password Input */}
          <View className='border-2 rounded-xl w-72 border-gray-200 px-3 flex-row items-center'>
            <TextInput 
              placeholder="Password" 
              value={password} 
              onChangeText={(text) => {
                setPassword(text);
                setError(''); // Clear error when user types
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password"
              autoCorrect={false}
              className="flex-1"
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

          {/* Confirm Password Input */}
          <View className='border-2 rounded-xl w-72 border-gray-200 px-3 flex-row items-center'>
            <TextInput 
              placeholder="Confirm Password" 
              value={confirmPassword} 
              onChangeText={(text) => {
                setConfirmPassword(text);
                setError(''); // Clear error when user types
              }}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoComplete="password"
              autoCorrect={false}
              className="flex-1"
            />
            <TouchableOpacity 
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              className="ml-2"
            >
              <Text className="text-blue-600 text-sm">
                {showConfirmPassword ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Register Button */}
          <View className='w-64 mt-2'>
            <TouchableOpacity 
              onPress={handleRegister}
              disabled={isLoading}
              className={`rounded-xl py-3 px-6 ${isLoading ? 'bg-gray-400' : 'bg-blue-600'} flex-row justify-center items-center`}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className='text-white font-semibold text-center'>Sign Up</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Clear Form Button */}
          <TouchableOpacity onPress={clearForm}>
            <Text className='text-gray-600 text-sm'>
              Clear Form
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error and Success Messages */}
        {error && (
          <View className='bg-red-100 border border-red-400 rounded-lg p-3 mt-2 w-64'>
            <Text className='text-red-700 text-sm text-center'>{error}</Text>
          </View>
        )}
        {success && (
          <View className='bg-green-100 border border-green-400 rounded-lg p-3 mt-2 w-64'>
            <Text className='text-green-700 text-sm text-center'>{success}</Text>
          </View>
        )}

        {/* Login Link */}
        <Text className='pt-2 text-gray-600'>
          Already have an account? 
          <Link href="./login" className='underline text-blue-700 ml-1'>
            Login
          </Link>
        </Text>
      </View>
    </View>
  );
}
