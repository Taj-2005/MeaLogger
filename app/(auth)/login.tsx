import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, User } from 'firebase/auth';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../firebaseConfig';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check for existing session on component mount
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('userToken');
      const savedSession = await AsyncStorage.getItem('userSession');
      const rememberMeStatus = await AsyncStorage.getItem('rememberMe');
      
      if (savedToken && savedSession && rememberMeStatus === 'true') {
        const sessionData = JSON.parse(savedSession);
        
        // Check if the session is still valid
        const currentTime = new Date().getTime();
        const sessionTime = new Date(sessionData.loginTime).getTime();
        const timeDifference = currentTime - sessionTime;
        const hoursDifference = timeDifference / (1000 * 60 * 60);
        
        // If session is less than 30 days old, auto-login
        if (hoursDifference < 24 * 30) {
          // Check if user is still authenticated with Firebase
          const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
              console.log('Auto-login successful with saved token');
              router.push('./(tabs)');
            } else {
              // Clear invalid session
              clearStoredSession();
            }
            setIsCheckingAuth(false);
            unsubscribe();
          });
        } else {
          // Clear expired session
          await clearStoredSession();
          setIsCheckingAuth(false);
        }
      } else {
        setIsCheckingAuth(false);
      }
    } catch (error) {
      console.error('Error checking existing session:', error);
      setIsCheckingAuth(false);
    }
  };

  // Clear stored session data
  const clearStoredSession = async () => {
    try {
      await AsyncStorage.multiRemove(['userSession', 'userToken', 'rememberMe']);
    } catch (error) {
      console.error('Error clearing stored session:', error);
    }
  };

  // Input validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

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

  const saveUserSession = async (user: User): Promise<void> => {
    try {
      // Get the Firebase ID token
      const token = await user.getIdToken();
      
      const sessionData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        loginTime: new Date().toISOString(),
      };

      if (rememberMe) {
        // Save both the token and session data
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userSession', JSON.stringify(sessionData));
        await AsyncStorage.setItem('rememberMe', 'true');
        
        console.log('User session and token saved successfully');
      } else {
        // Clear any existing session if remember me is not checked
        await clearStoredSession();
        console.log('Session cleared (remember me not checked)');
      }
    } catch (error) {
      console.error('Error saving user session:', error);
    }
  };

  const handleLogin = async () => {
    setError('');
    setSuccess('');
    
    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save session and token if remember me is checked
      await saveUserSession(user);

      Alert.alert('Success', 'You logged in successfully!');
      setSuccess('Login successful!');
      router.push('./(tabs)');
    } catch (error: any) {
      let errorMessage = 'Login failed. Please try again.';
      
      // Handle specific Firebase error codes
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection';
          break;
        default:
          errorMessage = 'Invalid email or password';
      }
      
      Alert.alert('Error', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address first');
      return;
    }
    
    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        'Password Reset',
        'A password reset link has been sent to your email address'
      );
    } catch (error: any) {
      let errorMessage = 'Failed to send password reset email';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address';
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const clearForm = () => {
    setEmail('');
    setPassword('');
    setError('');
    setSuccess('');
  };

  // Show loading screen while checking authentication
  if (isCheckingAuth) {
    return (
      <View className='flex flex-col justify-center items-center min-h-screen bg-gray-100'>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className='mt-4 text-gray-600'>Checking authentication...</Text>
      </View>
    );
  }

  return (
    <View className='flex flex-col justify-center items-center min-h-screen bg-gray-100'>
      <View className='flex flex-col justify-center items-center border-2 border-white gap-2 rounded-xl px-16 py-10 bg-white shadow-lg'>
        <Text className='text-2xl font-bold pb-4 text-gray-800'>Login</Text>
        
        <View className='flex flex-col justify-center items-center gap-3'>
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

          {/* Remember Me Checkbox */}
          <View className='flex-row items-center w-64 justify-start'>
            <TouchableOpacity 
              onPress={() => setRememberMe(!rememberMe)}
              className='flex-row items-center'
            >
              <View className={`w-4 h-4 border-2 border-gray-400 rounded mr-2 ${rememberMe ? 'bg-blue-600' : 'bg-white'}`}>
                {rememberMe && <Text className='text-white text-xs text-center'>✓</Text>}
              </View>
              <Text className='text-gray-600 text-sm'>Remember me</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <View className='w-64 mt-2'>
            <TouchableOpacity 
              onPress={handleLogin}
              disabled={isLoading}
              className={`rounded-xl py-3 px-6 ${isLoading ? 'bg-gray-400' : 'bg-blue-600'} flex-row justify-center items-center`}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className='text-white font-semibold text-center'>Login</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity onPress={handleForgotPassword}>
            <Text className='text-blue-600 underline text-sm'>
              Forgot Password?
            </Text>
          </TouchableOpacity>

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

        {/* Sign Up Link */}
        <Text className='pt-2 text-gray-600'>
          Don't have an account? 
          <Link href="./signup" className='underline text-blue-700 ml-1'>
            Sign Up
          </Link>
        </Text>
      </View>
    </View>
  );
}