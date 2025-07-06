import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { getAuth, updateProfile, updateEmail, sendPasswordResetEmail, signOut, User } from 'firebase/auth';

export default function Profile() {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [changed, setChanged] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
      setName(currentUser.displayName ?? '');
      setEmail(currentUser.email ?? '');
    }
  }, [currentUser]);

  const isEmailValid = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleUpdateProfile = async () => {
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }
    if (!email.trim() || !isEmailValid(email)) {
      setError('Please enter a valid email');
      return;
    }

    if (!user) {
      setError('No authenticated user');
      return;
    }

    setLoading(true);

    try {
      // Update name
      if (name !== user.displayName) {
        await updateProfile(user, { displayName: name });
      }

      // Update email
      if (email !== user.email) {
        await updateEmail(user, email);
      }

      // Refresh user state
      setUser(auth.currentUser);
      setSuccess('Profile updated successfully');
      setChanged(false);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = () => {
    if (!email) {
      setError('Email is required to reset password');
      return;
    }
    setError('');
    Alert.alert(
      'Change Password',
      'A password reset email will be sent to your email address. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Email',
          onPress: async () => {
            try {
              await sendPasswordResetEmail(auth, email);
              Alert.alert('Success', 'Password reset email sent!');
            } catch (e: any) {
              console.error(e);
              Alert.alert('Error', e.message || 'Failed to send password reset email');
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      Alert.alert('Logged out', 'You have been logged out.');
      setUser(null);
      setName('');
      setEmail('');
    } catch (e) {
      Alert.alert('Error', 'Failed to logout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const avatarText = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-gray-50 justify-center items-center p-6"
    >
      <View className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
        {/* Avatar */}
        <View className="flex items-center mb-6">
          <View className="w-24 h-24 rounded-full bg-blue-500 flex justify-center items-center">
            <Text className="text-white text-4xl font-bold">{avatarText}</Text>
          </View>
        </View>

        {/* Name Input */}
        <Text className="text-gray-700 font-semibold mb-1">Name</Text>
        <TextInput
          value={name}
          onChangeText={(text) => {
            setName(text);
            setChanged(true);
            setError('');
            setSuccess('');
          }}
          placeholder="Your name"
          className="border border-gray-300 rounded-md p-3 mb-4 text-gray-800"
          autoCapitalize="words"
        />

        {/* Email Input */}
        <Text className="text-gray-700 font-semibold mb-1">Email</Text>
        <TextInput
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setChanged(true);
            setError('');
            setSuccess('');
          }}
          placeholder="Your email"
          keyboardType="email-address"
          autoCapitalize="none"
          className="border border-gray-300 rounded-md p-3 mb-4 text-gray-800"
        />

        {/* Error & Success */}
        {error ? (
          <Text className="text-red-600 mb-4 text-center font-semibold">{error}</Text>
        ) : success ? (
          <Text className="text-green-600 mb-4 text-center font-semibold">{success}</Text>
        ) : null}

        {/* Update Profile Button */}
        <TouchableOpacity
          disabled={!changed || loading}
          onPress={handleUpdateProfile}
          className={`w-full rounded-md py-3 mb-4 ${
            !changed || loading ? 'bg-gray-400' : 'bg-blue-600'
          }`}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white font-semibold text-center">Update Profile</Text>
          )}
        </TouchableOpacity>

        {/* Change Password Button */}
        <TouchableOpacity
          onPress={handleChangePassword}
          className="w-full rounded-md py-3 mb-4 bg-yellow-500"
        >
          <Text className="text-white font-semibold text-center">Change Password</Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          disabled={loading}
          className={`w-full rounded-md py-3 ${loading ? 'bg-gray-400' : 'bg-red-600'}`}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white font-semibold text-center">Sign Out</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
