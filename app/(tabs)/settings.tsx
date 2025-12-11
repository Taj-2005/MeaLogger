import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { api } from '../../services/api';
import { checkNotificationPermissions, requestNotificationPermissions } from '../../utils/notifications';

const SettingsScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await api.getSettings();
      if (result.success && result.data) {
        setSettings(result.data.settings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: any) => {
    try {
      if (updates.notificationPermission !== undefined) {
        if (updates.notificationPermission) {
          if (Platform.OS === 'web') {
            Alert.alert(
              'Notifications Not Available',
              'Push notifications are only available on mobile devices (iOS and Android). Please use the mobile app to enable notifications.'
            );
            return;
          }
          const hasPermission = await checkNotificationPermissions();
          if (!hasPermission) {
            const granted = await requestNotificationPermissions();
            if (!granted) {
              Alert.alert(
                'Permission Required',
                'Please enable notifications in your device settings to receive meal reminders.'
              );
              return;
            }
          }
        }
      }

      const newSettings = { ...settings, ...updates };
      const result = await api.updateSettings(updates);
      if (result.success) {
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  const handleLogout = () => {
    const isWeb = Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.confirm === 'function';
    const confirmed = isWeb
      ? window.confirm('Are you sure you want to logout?')
      : new Promise<boolean>((resolve) => {
          Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
            { text: 'Logout', onPress: () => resolve(true), style: 'destructive' },
          ]);
        });

    if (confirmed) {
      logout();
    }
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    rightComponent,
    showArrow = true,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
    showArrow?: boolean;
  }) => {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className="flex-row items-center justify-between py-4 px-4 rounded-xl mb-2"
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <View className="flex-row items-center flex-1">
          <View
            className="w-10 h-10 rounded-xl items-center justify-center mr-3"
            style={{ backgroundColor: `${colors.primary}15` }}
          >
            <Ionicons name={icon} size={22} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text
              className="text-base font-semibold"
              style={{ color: colors.textPrimary }}
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                className="text-sm mt-0.5"
                style={{ color: colors.textSecondary }}
              >
                {subtitle}
              </Text>
            )}
          </View>
        </View>
        <View className="flex-row items-center">
          {rightComponent}
          {showArrow && !rightComponent && (
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
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
    <View
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      {/* Header */}
      <View
        className="pb-6 px-6 flex-row items-center"
        style={{ 
          backgroundColor: colors.surface,
          paddingTop: insets.top + 20,
        }}
      >
        <Image
          source={require('../../assets/logo.png')}
          style={{ width: 32, height: 32, marginRight: 12 }}
          resizeMode="contain"
        />
        <Text
          className="text-2xl font-bold"
          style={{ color: colors.textPrimary }}
        >
          Settings
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section */}
        <View className="mb-6 mt-6">
          <Text
            className="text-sm font-bold mb-4 uppercase tracking-wide"
            style={{ color: colors.textSecondary }}
          >
            Account
          </Text>
          <SettingItem
            icon="person-outline"
            title="Profile"
            subtitle="Manage your profile information"
            onPress={() => router.push('/profile')}
          />
          <SettingItem
            icon="notifications-outline"
            title="Notifications"
            subtitle={
              Platform.OS === 'web'
                ? 'Mobile only'
                : settings?.notificationPermission
                ? 'Enabled'
                : 'Disabled'
            }
            rightComponent={
              <Switch
                value={Platform.OS !== 'web' && (settings?.notificationPermission || false)}
                onValueChange={(value) =>
                  updateSettings({ notificationPermission: value })
                }
                disabled={Platform.OS === 'web'}
                trackColor={{
                  false: colors.border,
                  true: colors.primary,
                }}
                thumbColor="#FFFFFF"
              />
            }
            showArrow={false}
          />
        </View>

        {/* Support Section */}
        <View className="mb-6">
          <Text
            className="text-sm font-bold mb-4 uppercase tracking-wide"
            style={{ color: colors.textSecondary }}
          >
            Support
          </Text>
          <SettingItem
            icon="help-circle-outline"
            title="Help & Support"
            subtitle="Get help or contact support"
            onPress={() =>
              Alert.alert('Help', 'Contact support at support@meallogger.com')
            }
          />
          <SettingItem
            icon="information-circle-outline"
            title="About MealLogger"
            subtitle="App version and information"
            onPress={() => setShowAbout(true)}
          />
        </View>

        {/* Logout Section */}
        <View className="mb-10">
          <SettingItem
            icon="log-out-outline"
            title="Logout"
            subtitle="Sign out of your account"
            onPress={handleLogout}
            showArrow={false}
          />
        </View>
      </ScrollView>

      {/* About Modal */}
      <Modal
        visible={showAbout}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAbout(false)}
      >
        <View
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <View
            className="rounded-t-3xl p-6"
            style={{
              backgroundColor: colors.surface,
              maxHeight: '80%',
            }}
          >
            <View className="flex-row items-center justify-between mb-6">
              <Text
                className="text-2xl font-bold"
                style={{ color: colors.textPrimary }}
              >
                About MealLogger
              </Text>
              <TouchableOpacity
                onPress={() => setShowAbout(false)}
                className="p-2"
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* App Logo/Icon */}
              <View className="items-center mb-6">
                <View
                  className="w-20 h-20 rounded-2xl items-center justify-center mb-4"
                  style={{ backgroundColor: `${colors.primary}15` }}
                >
                  <Ionicons name="restaurant-outline" size={48} color={colors.primary} />
                </View>
                <Text
                  className="text-3xl font-bold mb-2"
                  style={{ color: colors.textPrimary }}
                >
                  MealLogger
                </Text>
                <Text
                  className="text-base"
                  style={{ color: colors.textSecondary }}
                >
                  Version 1.0.0
                </Text>
              </View>

              {/* Description */}
              <View className="mb-6">
                <Text
                  className="text-base leading-6"
                  style={{ color: colors.textPrimary }}
                >
                  MealLogger is a comprehensive meal tracking application that
                  helps you log, organize, and monitor your daily meals. Capture
                  photos of your meals, track calories, and maintain a detailed
                  timeline of your eating habits.
                </Text>
              </View>

              {/* Features */}
              <View className="mb-6">
                <Text
                  className="text-lg font-semibold mb-3"
                  style={{ color: colors.textPrimary }}
                >
                  Features
                </Text>
                <View>
                  {[
                    { icon: 'camera-outline', text: 'Photo-based meal logging' },
                    { icon: 'flame-outline', text: 'Calorie tracking' },
                    { icon: 'calendar-outline', text: 'Meal timeline and history' },
                    { icon: 'notifications-outline', text: 'Reminder notifications' },
                    { icon: 'cloud-outline', text: 'Cloud sync across devices' },
                  ].map((feature, index) => (
                    <View key={index} className="flex-row items-center mb-2">
                      <Ionicons 
                        name={feature.icon as any} 
                        size={18} 
                        color={colors.primary} 
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        className="text-base"
                        style={{ color: colors.textPrimary }}
                      >
                        {feature.text}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Tech Stack */}
              <View className="mb-6">
                <Text
                  className="text-lg font-semibold mb-3"
                  style={{ color: colors.textPrimary }}
                >
                  Built With
                </Text>
                <Text
                  className="text-base leading-6"
                  style={{ color: colors.textSecondary }}
                >
                  React Native • Expo • TypeScript{'\n'}
                  Node.js • Express • MongoDB{'\n'}
                  Cloudinary • JWT Authentication
                </Text>
              </View>

              {/* Contact */}
              <View className="mb-6">
                <Text
                  className="text-lg font-semibold mb-3"
                  style={{ color: colors.textPrimary }}
                >
                  Contact & Support
                </Text>
                <Text
                  className="text-base"
                  style={{ color: colors.textSecondary }}
                >
                  Email: support@meallogger.com{'\n'}
                  Website: www.meallogger.com
                </Text>
              </View>

              {/* Copyright */}
              <View
                className="items-center pt-4 border-t mb-4"
                style={{ borderTopColor: colors.border }}
              >
                <Text
                  className="text-sm"
                  style={{ color: colors.textSecondary }}
                >
                  © 2025 MealLogger. All rights reserved.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SettingsScreen;
