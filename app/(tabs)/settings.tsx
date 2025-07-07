import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';

const SettingsScreen = () => {
  const router = useRouter();
  const { theme, toggleTheme, isDark, colors } = useTheme();
  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ],
      { cancelable: true }
    );
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    rightComponent,
    showArrow = true,
    iconType = 'Ionicons',
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
    showArrow?: boolean;
    iconType?: 'Ionicons' | 'MaterialIcons' | 'FontAwesome';
  }) => {
    const renderIcon = () => {
      switch (iconType) {
        case 'MaterialIcons':
          return <MaterialIcons name={icon as any} size={24} color={colors.icon} />;
        case 'FontAwesome':
          return <FontAwesome name={icon as any} size={24} color={colors.icon} />;
        default:
          return <Ionicons name={icon as any} size={24} color={colors.icon} />;
      }
    };

    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className="flex-row items-center justify-between py-4 px-2 rounded-lg mb-1"
        style={{
          backgroundColor: colors.cardBackground,
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
        }}
      >
        <View className="flex-row items-center flex-1">
          {renderIcon()}
          <View className="ml-4 flex-1">
            <Text className="text-base font-medium" style={{ color: colors.textPrimary }}>
              {title}
            </Text>
            {subtitle && (
              <Text className="text-sm mt-1" style={{ color: colors.textMuted }}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>
        <View className="flex-row items-center">
          {rightComponent}
          {showArrow && !rightComponent && (
            <Ionicons name="chevron-forward" size={20} color={colors.iconMuted} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.primaryBackground }}>
      {/* Header */}
      <View
        className="pt-12 pb-6 px-6 border-b"
        style={{
          borderBottomColor: colors.border,
          backgroundColor: colors.primaryBackground,
        }}
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} /> 
          </TouchableOpacity>
          <Text className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
            Settings
          </Text>
          <View
            className="p-2 rounded-full"
            style={{ backgroundColor: colors.surface }}
          >
            <Ionicons name="settings" size={24} color={colors.textPrimary} />
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Appearance Section */}
        <View
          className="mb-6 mt-4 p-4 rounded-xl"
          style={{
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
          }}
        >
          <Text
            className="text-xs font-semibold mb-3 uppercase tracking-wide"
            style={{ color: colors.textMuted }}
          >
            Appearance
          </Text>

          <SettingItem
            icon={isDark ? 'moon' : 'sunny'}
            title={isDark ? 'Dark Mode' : 'Light Mode'}
            subtitle={`Currently using ${theme} mode`}
            rightComponent={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{
                  false: colors.switchTrackFalse,
                  true: colors.switchTrackTrue,
                }}
                thumbColor={colors.switchThumb}
              />
            }
            showArrow={false}
          />
        </View>

        {/* Account Section */}
        <View
          className="mb-6 p-4 rounded-xl"
          style={{
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
          }}
        >
          <Text
            className="text-xs font-semibold mb-3 uppercase tracking-wide"
            style={{ color: colors.textMuted }}
          >
            Account
          </Text>
          <SettingItem
            icon="person"
            title="Profile"
            subtitle="Manage your profile information"
            onPress={() => router.push('/profile')}
          />
          <SettingItem
            icon="notifications"
            title="Notifications"
            subtitle="Configure notification preferences"
            onPress={() => Alert.alert('Notifications', 'Notification settings would open here')}
          />
          <SettingItem
            icon="shield-checkmark"
            title="Privacy & Security"
            subtitle="Manage your privacy settings"
            onPress={() => Alert.alert('Privacy', 'Privacy settings would open here')}
          />
        </View>

        {/* Meal Logging Section */}
        <View
          className="mb-6 p-4 rounded-xl"
          style={{
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
          }}
        >
          <Text
            className="text-xs font-semibold mb-3 uppercase tracking-wide"
            style={{ color: colors.textMuted }}
          >
            Meal Logging
          </Text>
          <SettingItem
            icon="restaurant-menu"
            iconType="MaterialIcons"
            title="Default Meal Settings"
            subtitle="Set default options for meal logging"
            onPress={() => Alert.alert('Meal Settings', 'Meal settings would open here')}
          />
          <SettingItem
            icon="camera"
            title="Camera Settings"
            subtitle="Configure camera preferences"
            onPress={() => Alert.alert('Camera', 'Camera settings would open here')}
          />
          <SettingItem
            icon="time"
            title="Reminder Settings"
            subtitle="Set up meal reminders"
            onPress={() => Alert.alert('Reminders', 'Reminder settings would open here')}
          />
        </View>

        {/* Support Section */}
        <View
          className="mb-6 p-4 rounded-xl"
          style={{
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
          }}
        >
          <Text
            className="text-xs font-semibold mb-3 uppercase tracking-wide"
            style={{ color: colors.textMuted }}
          >
            Support
          </Text>
          <SettingItem
            icon="help-circle"
            title="Help & Support"
            subtitle="Get help or contact support"
            onPress={() => Alert.alert('Help', 'Help & Support would open here')}
          />
          <SettingItem
            icon="information-circle"
            title="About MealLogger"
            subtitle="App version and information"
            onPress={() => Alert.alert('About', 'About MealLogger v1.0.0')}
          />
          <SettingItem
            icon="star"
            title="Rate Us"
            subtitle="Rate MealLogger on the App Store"
            onPress={() => Alert.alert('Rate Us', 'This would open the App Store rating page')}
          />
        </View>

        {/* Logout Section */}
        <View
          className="mb-10 p-4 rounded-xl"
          style={{
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
          }}
        >
          <SettingItem
            icon="log-out"
            title="Logout"
            subtitle="Sign out of your account"
            onPress={handleLogout}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;
