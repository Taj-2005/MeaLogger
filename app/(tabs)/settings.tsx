import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    Platform,
  Pressable,
    ScrollView,
  StyleSheet,
    Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { api } from '../../services/api';
import {
  checkNotificationPermissions,
  requestNotificationPermissions,
} from '../../utils/notifications';
import AnimatedToggle from '../components/AnimatedToggle';
import AppLogo from '../components/AppLogo';
import LoadingScreen from '../components/LoadingScreen';
import SettingRow from '../components/SettingRow';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ModalCloseButton: React.FC<{ onPress: () => void; colors: any }> = ({
  onPress,
  colors,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, {
      damping: 15,
      stiffness: 400,
    });
    opacity.value = withSpring(0.7);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 400,
    });
    opacity.value = withSpring(1);
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.modalCloseButton, animatedStyle]}
    >
      <View
        style={[
          styles.modalCloseButtonInner,
          { backgroundColor: '#F1F5F9' },
        ]}
      >
        <Ionicons name="close" size={20} color={colors.textPrimary} />
      </View>
    </AnimatedPressable>
  );
};

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
    const isWeb =
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      typeof window.confirm === 'function';
    const confirmed = isWeb
      ? window.confirm('Are you sure you want to logout?')
      : new Promise<boolean>((resolve) => {
          Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
            {
              text: 'Logout',
              onPress: () => resolve(true),
              style: 'destructive',
            },
          ]);
        });

    if (confirmed) {
      logout();
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading settings..." variant="minimal" />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View
        entering={FadeInDown.duration(400).springify()}
        style={[
          styles.header,
          {
          backgroundColor: colors.surface,
            paddingTop: insets.top + 16,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Settings
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Manage your preferences
        </Text>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.delay(100).duration(400).springify()}
          style={styles.section}
        >
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Account
          </Text>
          <View style={styles.sectionContent}>
            <SettingRow
            icon="person-outline"
            title="Profile"
            subtitle="Manage your profile information"
            onPress={() => router.push('/profile')}
              delay={0}
          />
            <SettingRow
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
                <AnimatedToggle
                  value={
                    Platform.OS !== 'web' &&
                    (settings?.notificationPermission || false)
                  }
                onValueChange={(value) =>
                  updateSettings({ notificationPermission: value })
                }
                disabled={Platform.OS === 'web'}
              />
            }
            showArrow={false}
              delay={50}
          />
        </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(200).duration(400).springify()}
          style={styles.section}
        >
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Support
          </Text>
          <View style={styles.sectionContent}>
            <SettingRow
            icon="help-circle-outline"
            title="Help & Support"
            subtitle="Get help or contact support"
            onPress={() =>
              Alert.alert('Help', 'Contact support at linkupcontact247@gmail.com')
            }
              delay={0}
          />
            <SettingRow
            icon="information-circle-outline"
              title="About Melo"
            subtitle="App version and information"
            onPress={() => setShowAbout(true)}
              delay={50}
          />
        </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(300).duration(400).springify()}
          style={styles.section}
        >
          <View style={styles.sectionContent}>
            <SettingRow
            icon="log-out-outline"
            title="Logout"
            subtitle="Sign out of your account"
            onPress={handleLogout}
            showArrow={false}
              isDestructive={true}
              delay={0}
          />
        </View>
        </Animated.View>
      </ScrollView>

      <Modal
        visible={showAbout}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAbout(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowAbout(false)}
          />
          <Animated.View
            entering={FadeInUp.duration(500)
              .easing(Easing.out(Easing.ease))
              .springify()}
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            {/* Gradient Header Background */}
            <LinearGradient
              colors={[
                `${colors.primary}08`,
                `${colors.accent}05`,
                'transparent',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalGradientHeader}
            />

            <Animated.View
              entering={FadeInDown.delay(100).duration(400).springify()}
              style={styles.modalHeader}
            >
              <View style={styles.modalHeaderContent}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  About
              </Text>
                <ModalCloseButton
                onPress={() => setShowAbout(false)}
                  colors={colors}
                />
            </View>
            </Animated.View>

            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Animated.View
                entering={FadeInDown.delay(150)
                  .duration(500)
                  .easing(Easing.out(Easing.ease))
                  .springify()}
                style={styles.modalLogoContainer}
              >
                <View
                  style={[
                    styles.modalLogoWrapper,
                    {
                      backgroundColor: `${colors.primary}10`,
                      shadowColor: colors.primary,
                    },
                  ]}
                >
                  <AppLogo size={80} />
                </View>
                <Text
                  style={[styles.modalAppName, { color: colors.textPrimary }]}
                >
                  Melo
                </Text>
                <View style={styles.modalVersionContainer}>
                <Text
                    style={[styles.modalVersion, { color: colors.textSecondary }]}
                >
                  Version 1.0.0
                </Text>
              </View>
              </Animated.View>

              <Animated.View
                entering={FadeInDown.delay(200)
                  .duration(500)
                  .easing(Easing.out(Easing.ease))
                  .springify()}
                style={styles.modalSection}
              >
                <Text
                  style={[styles.modalDescription, { color: colors.textPrimary }]}
                >
                  A comprehensive meal tracking application that helps you log,
                  organize, and monitor your daily meals. Capture photos, track
                  calories, and maintain a detailed timeline of your eating
                  habits.
                </Text>
              </Animated.View>

              <Animated.View
                entering={FadeInDown.delay(250)
                  .duration(500)
                  .easing(Easing.out(Easing.ease))
                  .springify()}
                style={styles.modalSection}
              >
                <Text
                  style={[styles.modalSectionTitle, { color: colors.textPrimary }]}
                >
                  Features
                </Text>
                <View style={styles.modalFeaturesList}>
                  {[
                    {
                      icon: 'camera-outline',
                      text: 'Photo-based meal logging',
                    },
                    { icon: 'flame-outline', text: 'Calorie tracking' },
                    {
                      icon: 'calendar-outline',
                      text: 'Meal timeline and history',
                    },
                    {
                      icon: 'notifications-outline',
                      text: 'Reminder notifications',
                    },
                    { icon: 'cloud-outline', text: 'Cloud sync across devices' },
                  ].map((feature, index) => (
                    <Animated.View
                      key={index}
                      entering={FadeInDown.delay(300 + index * 60)
                        .duration(400)
                        .springify()}
                      style={[
                        styles.modalFeatureItem,
                        { backgroundColor: `${colors.primary}05` },
                      ]}
                    >
                      <View
                        style={[
                          styles.modalFeatureIconContainer,
                          { backgroundColor: `${colors.primary}15` },
                        ]}
                      >
                      <Ionicons 
                        name={feature.icon as any} 
                        size={18} 
                        color={colors.primary} 
                      />
                      </View>
                      <Text
                        style={[styles.modalFeatureText, { color: colors.textPrimary }]}
                      >
                        {feature.text}
                      </Text>
                    </Animated.View>
                  ))}
                </View>
              </Animated.View>

              <Animated.View
                entering={FadeInDown.delay(600)
                  .duration(500)
                  .easing(Easing.out(Easing.ease))
                  .springify()}
                style={styles.modalSection}
              >
                <Text
                  style={[styles.modalSectionTitle, { color: colors.textPrimary }]}
                >
                  Built With
                </Text>
                <View
                  style={[
                    styles.modalTechStackContainer,
                    { backgroundColor: `${colors.primary}05` },
                  ]}
                >
                  <Text
                    style={[styles.modalTechStack, { color: colors.textSecondary }]}
                >
                    React Native • Expo • TypeScript
                  </Text>
                  <Text
                    style={[styles.modalTechStack, { color: colors.textSecondary }]}
                  >
                    Node.js • Express • MongoDB
                  </Text>
                  <Text
                    style={[styles.modalTechStack, { color: colors.textSecondary }]}
                  >
                  Cloudinary • JWT Authentication
                </Text>
              </View>
              </Animated.View>

              <Animated.View
                entering={FadeInDown.delay(650)
                  .duration(500)
                  .easing(Easing.out(Easing.ease))
                  .springify()}
                style={styles.modalSection}
              >
                <Text
                  style={[styles.modalSectionTitle, { color: colors.textPrimary }]}
                >
                  Contact & Support
                </Text>
                <View
                  style={[
                    styles.modalContactContainer,
                    { backgroundColor: `${colors.primary}05` },
                  ]}
                >
                  <View style={styles.modalContactRow}>
                    <Ionicons
                      name="mail-outline"
                      size={16}
                      color={colors.primary}
                      style={styles.modalContactIcon}
                    />
                    <Text
                      style={[styles.modalContact, { color: colors.textSecondary }]}
                    >
                      linkupcontact247@gmail.com
                    </Text>
                  </View>
                  <View style={styles.modalContactRow}>
                    <Ionicons
                      name="globe-outline"
                      size={16}
                      color={colors.primary}
                      style={styles.modalContactIcon}
                    />
                    <Text
                      style={[styles.modalContact, { color: colors.textSecondary }]}
                    >
                      https://meloapp.vercel.app
                    </Text>
                  </View>
                </View>
              </Animated.View>

              <Animated.View
                entering={FadeInDown.delay(700)
                  .duration(500)
                  .easing(Easing.out(Easing.ease))
                  .springify()}
                style={[styles.modalFooter, { borderTopColor: colors.border }]}
              >
                <Text
                  style={[styles.modalMadeWith, { color: colors.textSecondary }]}
                >
                  Made with <Text style={{ color: colors.error }}>❤️</Text>
                </Text>
                <Text
                  style={[styles.modalCopyrightText, { color: colors.textSecondary }]}
                >
                  © 2025 Melo. All rights reserved.
                </Text>
              </Animated.View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '400',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionContent: {
    gap: 0,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    minHeight: 600,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
  },
  modalGradientHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 0,
  },
  modalHeader: {
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 8,
    zIndex: 1,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    flexGrow: 1,
  },
  modalLogoContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 8,
  },
  modalLogoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalAppName: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  modalVersionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  modalVersion: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  modalSection: {
    marginBottom: 28,
  },
  modalDescription: {
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  modalFeaturesList: {
    gap: 10,
  },
  modalFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  modalFeatureIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  modalFeatureText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    letterSpacing: 0.1,
  },
  modalTechStackContainer: {
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 16,
    gap: 8,
  },
  modalTechStack: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  modalContactContainer: {
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 16,
    gap: 12,
  },
  modalContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalContactIcon: {
    marginRight: 12,
  },
  modalContact: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: 0.2,
    flex: 1,
  },
  modalFooter: {
    paddingTop: 28,
    marginTop: 12,
    borderTopWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  modalMadeWith: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  modalCopyrightText: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
});

export default SettingsScreen;
