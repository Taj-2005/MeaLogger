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
import { useAuth } from '../../contexts/AuthContext';
import { updateProfile, updateEmail, sendPasswordResetEmail, getAuth } from 'firebase/auth';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import SettingsButton from '../components/SettingsBtn';
import { useTheme } from '../../contexts/ThemeContext';

export default function Profile() {
  const { user, logout } = useAuth();
  const auth = getAuth();
  const { colors } = useTheme();

  const [name, setName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);

  const [changed, setChanged] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setName(user?.displayName || '');
    setEmail(user?.email || '');
  }, [user]);

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

    setLoading(true);

    try {
      if (user && name !== user.displayName) {
        await updateProfile(auth.currentUser!, { displayName: name });
      }
      if (user && email !== user.email) {
        await updateEmail(auth.currentUser!, email);
      }

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
      await logout();
      Alert.alert('Logged out', 'You have been logged out.');
    } catch (e) {
      Alert.alert('Error', 'Failed to logout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const avatarText = user?.displayName
    ? user.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <>
      <View
        style={{ backgroundColor: colors.primaryBackground }}
        className="flex flex-col items-end w-full pt-10 pr-2 z-50"
      >
        <SettingsButton />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ backgroundColor: colors.primaryBackground }}
        className="flex-1 justify-center items-center p-4"
      >
        <View
          className="w-full max-w-md rounded-xl border"
          style={{
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
          }}
        >
          {/* Header */}
          <View className="items-center py-6">
            {user?.photoURL ? (
              <View
                className="w-24 h-24 rounded-full overflow-hidden border-2"
                style={{ borderColor: colors.accent }}
              >
                <img
                  src={user.photoURL}
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                />
              </View>
            ) : (
              <View
                className="w-24 h-24 rounded-full flex justify-center items-center"
                style={{ backgroundColor: colors.accent }}
              >
                <Text
                  className="text-4xl font-bold"
                  style={{ color: colors.textPrimary }}
                >
                  {avatarText}
                </Text>
              </View>
            )}
            <Text
              className="text-lg font-semibold mt-4"
              style={{ color: colors.textPrimary }}
            >
              {user?.displayName || 'Your Profile'}
            </Text>
          </View>

          <View className="px-4 pb-6">
            {/* Name */}
            <Text
              className="text-xs font-semibold mb-2 uppercase tracking-wide"
              style={{ color: colors.textMuted }}
            >
              Name
            </Text>
            <TextInput
              value={name}
              onChangeText={(text) => {
                setName(text);
                setChanged(true);
                setError('');
                setSuccess('');
              }}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              className="rounded-md px-3 py-2 mb-4 text-base"
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.textPrimary,
                backgroundColor: colors.surface,
              }}
            />

            {/* Email */}
            <Text
              className="text-xs font-semibold mb-2 uppercase tracking-wide"
              style={{ color: colors.textMuted }}
            >
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setChanged(true);
                setError('');
                setSuccess('');
              }}
              placeholder="Your email"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              className="rounded-md px-3 py-2 mb-4 text-base"
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.textPrimary,
                backgroundColor: colors.surface,
              }}
            />

            {/* Status Message */}
            {error ? (
              <Text className="text-sm text-center font-semibold mb-4" style={{ color: 'red' }}>
                {error}
              </Text>
            ) : success ? (
              <Text className="text-sm text-center font-semibold mb-4" style={{ color: 'green' }}>
                {success}
              </Text>
            ) : null}

            {/* Buttons */}
          <TouchableOpacity
            disabled={!changed || loading}
            onPress={handleUpdateProfile}
            className={`w-full rounded-lg py-3 mb-4 flex-row justify-center items-center shadow-md ${
              !changed || loading ? 'opacity-60' : ''
            }`}
            style={{
              backgroundColor: !changed || loading ? colors.border : colors.accent,
              elevation: 4, // for Android shadow
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.textPrimary} />
            ) : (
              <View className="flex-row items-center">
                <MaterialIcons name="update" size={20} color="white" style={{ marginRight: 8 }} />
                <Text className="text-white text-center font-semibold text-lg">Update Profile</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleChangePassword}
            className="w-full rounded-lg py-3 mb-4 flex-row justify-center items-center shadow-md"
            style={{ backgroundColor: '#f59e0b', elevation: 4 }}
          >
            <View className="flex-row items-center">
              <MaterialIcons name="password" size={20} color="white" style={{ marginRight: 8 }} />
              <Text className="text-white text-center font-semibold text-lg">Change Password</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogout}
            disabled={loading}
            className={`w-full rounded-lg py-3 flex-row justify-center items-center shadow-md ${
              loading ? 'opacity-60' : ''
            }`}
            style={{
              backgroundColor: loading ? colors.border : '#2563eb',
              elevation: 4,
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.textPrimary} />
            ) : (
              <View className="flex-row items-center">
                <MaterialIcons name="logout" size={20} color="white" style={{ marginRight: 8 }} />
                <Text className="text-white text-center font-semibold text-lg">Log Out</Text>
              </View>
            )}
          </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
