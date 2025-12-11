import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { api } from '../../services/api';
import AppLogo from '../components/AppLogo';
import PrimaryButton from '../components/PrimaryButton';
import SettingsButton from '../components/SettingsBtn';

export default function Profile() {
  const { user, logout, refreshUser } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || null);
  const [loading, setLoading] = useState(false);
  const [changed, setChanged] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setAvatarUrl(user.avatarUrl || null);
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }

    setLoading(true);

    try {
      await api.updateProfile(name);
      await refreshUser();
      setSuccess('Profile updated successfully');
      setChanged(false);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpdate = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setLoading(true);
        try {
          await api.updateProfile(undefined, result.assets[0].uri);
          await refreshUser();
          setSuccess('Avatar updated successfully');
        } catch (e: any) {
          setError(e.message || 'Failed to update avatar');
        } finally {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const handleLogout = async () => {
    const isWeb = Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.confirm === 'function';
    const confirmed = isWeb
      ? window.confirm('Are you sure you want to logout?')
      : await new Promise<boolean>((resolve) => {
          Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
            { text: 'Logout', onPress: () => resolve(true), style: 'destructive' },
          ]);
        });

    if (confirmed) {
      setLoading(true);
      try {
        await logout();
      } catch (e) {
        Alert.alert('Error', 'Failed to logout. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const avatarText = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : 'U';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      {/* Header */}
      <View
        className="pb-6 px-6 flex-row items-center justify-between"
        style={{ 
          backgroundColor: colors.surface,
          paddingTop: insets.top + 20,
        }}
      >
        <View className="flex-row items-center">
          <AppLogo size={32} style={{ marginRight: 12 }} />
          <Text
            className="text-2xl font-bold"
            style={{ color: colors.textPrimary }}
          >
            Profile
          </Text>
        </View>
        <SettingsButton />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View className="items-center mb-8">
          <TouchableOpacity
            onPress={handleAvatarUpdate}
            activeOpacity={0.8}
            className="relative"
          >
            {avatarUrl ? (
              <View
                className="w-28 h-28 rounded-full overflow-hidden border-4"
                style={{ borderColor: colors.primary }}
              >
                <Image
                  source={{ uri: avatarUrl }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
            ) : (
              <View
                className="w-28 h-28 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.primary }}
              >
                <Text
                  className="text-4xl font-bold"
                  style={{ color: '#FFFFFF' }}
                >
                  {avatarText}
                </Text>
              </View>
            )}
            <View
              className="absolute bottom-0 right-0 w-10 h-10 rounded-full items-center justify-center border-4"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.surface,
              }}
            >
              <Ionicons name="camera" size={20} color={colors.primary} />
            </View>
          </TouchableOpacity>
          <Text
            className="text-xl font-bold mt-4"
            style={{ color: colors.textPrimary }}
          >
            {user?.name || 'Your Profile'}
          </Text>
          <Text
            className="text-sm mt-1"
            style={{ color: colors.textSecondary }}
          >
            {user?.email || ''}
          </Text>
        </View>

        {/* Form Section */}
        <View
          className="rounded-2xl p-6 mb-6"
          style={{
            backgroundColor: colors.surface,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          {/* Name Input */}
          <View className="mb-4">
            <Text
              className="text-sm font-semibold mb-2"
              style={{ color: colors.textPrimary }}
            >
              Full Name
            </Text>
            <View
              className="rounded-xl px-4 py-3.5 flex-row items-center"
              style={{
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: error && !name ? colors.error : colors.border,
              }}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={colors.textSecondary}
                style={{ marginRight: 12 }}
              />
              <TextInput
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setChanged(true);
                  setError('');
                  setSuccess('');
                }}
                placeholder="Enter your name"
                placeholderTextColor={colors.textSecondary}
                className="flex-1 text-base"
                style={{ color: colors.textPrimary }}
              />
            </View>
          </View>

          {/* Email (read-only) */}
          <View className="mb-6">
            <Text
              className="text-sm font-semibold mb-2"
              style={{ color: colors.textPrimary }}
            >
              Email
            </Text>
            <View
              className="rounded-xl px-4 py-3.5 flex-row items-center opacity-60"
              style={{
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={colors.textSecondary}
                style={{ marginRight: 12 }}
              />
              <Text
                className="flex-1 text-base"
                style={{ color: colors.textPrimary }}
              >
                {email}
              </Text>
            </View>
            <Text
              className="text-xs mt-1"
              style={{ color: colors.textSecondary }}
            >
              Email cannot be changed
            </Text>
          </View>

          {/* Status Messages */}
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
              <Text className="text-sm flex-1" style={{ color: colors.error }}>
                {error}
              </Text>
            </View>
          ) : null}

          {success ? (
            <View
              className="rounded-xl px-4 py-3 mb-4 flex-row items-center"
              style={{ backgroundColor: `${colors.success}15` }}
            >
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={colors.success}
                style={{ marginRight: 8 }}
              />
              <Text
                className="text-sm flex-1"
                style={{ color: colors.success }}
              >
                {success}
              </Text>
            </View>
          ) : null}

          {/* Update Button */}
          <PrimaryButton
            title="Update Profile"
            onPress={handleUpdateProfile}
            loading={loading}
            disabled={!changed || loading}
            variant="primary"
          />
        </View>

        {/* Logout Button */}
        <PrimaryButton
          title="Log Out"
          onPress={handleLogout}
          loading={loading}
          disabled={loading}
          variant="error"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
