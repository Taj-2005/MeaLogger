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

const SettingsScreen = () => {
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
        style={{
          backgroundColor: colors.cardBackground,
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
          paddingVertical: 16,
          paddingHorizontal: 8,
          borderRadius: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {renderIcon()}
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '500', color: colors.textPrimary }}>{title}</Text>
            {subtitle && (
              <Text style={{ fontSize: 14, marginTop: 4, color: colors.textMuted }}>{subtitle}</Text>
            )}
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {rightComponent}
          {showArrow && !rightComponent && (
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.iconMuted}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.primaryBackground }}>
      {/* Header */}
      <View
        style={{
          paddingTop: 48,
          paddingBottom: 24,
          paddingHorizontal: 24,
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
          backgroundColor: colors.primaryBackground,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.textPrimary }}>Settings</Text>
          <View style={{
            padding: 8,
            borderRadius: 24,
            backgroundColor: colors.surface,
          }}>
            <Ionicons
              name="settings"
              size={24}
              color={colors.textPrimary}
            />
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 24 }} showsVerticalScrollIndicator={false}>
        {/* Appearance Section */}
        <View style={{
          marginBottom: 24,
          padding: 16,
          borderRadius: 12,
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
          borderWidth: 1,
        }}>
          <Text style={{
            fontSize: 12,
            fontWeight: '600',
            marginBottom: 12,
            textTransform: 'uppercase',
            letterSpacing: 1,
            color: colors.textMuted,
          }}>
            Appearance
          </Text>

          <SettingItem
            icon="moon"
            title="Dark Mode"
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
        <View style={{
          marginBottom: 24,
          padding: 16,
          borderRadius: 12,
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
          borderWidth: 1,
        }}>
          <Text style={{
            fontSize: 12,
            fontWeight: '600',
            marginBottom: 12,
            textTransform: 'uppercase',
            letterSpacing: 1,
            color: colors.textMuted,
          }}>
            Account
          </Text>
          <SettingItem
            icon="person"
            title="Profile"
            subtitle="Manage your profile information"
            onPress={() => Alert.alert('Profile', 'Profile screen would open here')}
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
        <View style={{
          marginBottom: 24,
          padding: 16,
          borderRadius: 12,
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
          borderWidth: 1,
        }}>
          <Text style={{
            fontSize: 12,
            fontWeight: '600',
            marginBottom: 12,
            textTransform: 'uppercase',
            letterSpacing: 1,
            color: colors.textMuted,
          }}>
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
        <View style={{
          marginBottom: 24,
          padding: 16,
          borderRadius: 12,
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
          borderWidth: 1,
        }}>
          <Text style={{
            fontSize: 12,
            fontWeight: '600',
            marginBottom: 12,
            textTransform: 'uppercase',
            letterSpacing: 1,
            color: colors.textMuted,
          }}>
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
        <View style={{
          marginBottom: 32,
          padding: 16,
          borderRadius: 12,
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
          borderWidth: 1,
        }}>
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
