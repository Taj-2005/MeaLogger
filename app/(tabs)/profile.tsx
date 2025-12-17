import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Image,
    KeyboardAvoidingView,
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
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { api } from '../../services/api';
import AnimatedInput from '../components/AnimatedInput';
import PrimaryButton from '../components/PrimaryButton';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Profile() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
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


  const avatarText = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : 'U';

  const avatarScale = useSharedValue(1);
  const avatarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));

  useEffect(() => {
    avatarScale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
    });
  }, [avatarUrl]);

  const handleAvatarPress = () => {
    avatarScale.value = withSpring(0.95, {
      damping: 15,
      stiffness: 400,
    });
    setTimeout(() => {
      avatarScale.value = withSpring(1, {
        damping: 15,
        stiffness: 400,
      });
      handleAvatarUpdate();
    }, 100);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Animated.View
        entering={FadeInDown.duration(400).springify()}
        style={[
          styles.header,
          {
            paddingTop: insets.top + 16,
          backgroundColor: colors.surface,
          },
        ]}
      >
        <LinearGradient
          colors={[
            `${colors.primary}08`,
            `${colors.accent}05`,
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Profile
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/settings')}
            style={styles.settingsButton}
          >
            <View
              style={[
                styles.settingsButtonInner,
                { backgroundColor: `${colors.primary}15` },
              ]}
            >
              <Ionicons name="settings-outline" size={22} color={colors.primary} />
            </View>
          </Pressable>
        </View>
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
          entering={FadeInUp.delay(100).duration(500).easing(Easing.out(Easing.ease)).springify()}
          style={[styles.profileHeaderCard, { backgroundColor: colors.surface }]}
        >
          <LinearGradient
            colors={[
              `${colors.primary}10`,
              `${colors.accent}08`,
              'transparent',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileGradient}
          />

          <Animated.View style={avatarAnimatedStyle}>
            <AnimatedPressable
              onPress={handleAvatarPress}
              style={styles.avatarContainer}
          >
            {avatarUrl ? (
              <View
                  style={[
                    styles.avatarImageWrapper,
                    { borderColor: colors.primary },
                  ]}
              >
                <Image
                  source={{ uri: avatarUrl }}
                    style={styles.avatarImage}
                  resizeMode="cover"
                />
              </View>
            ) : (
              <View
                  style={[
                    styles.avatarPlaceholder,
                    { backgroundColor: colors.primary },
                  ]}
              >
                  <Text style={styles.avatarText}>{avatarText}</Text>
              </View>
            )}
            <View
                style={[
                  styles.avatarEditBadge,
                  {
                backgroundColor: colors.surface,
                borderColor: colors.surface,
                  },
                ]}
            >
                <Ionicons name="camera" size={18} color={colors.primary} />
            </View>
            </AnimatedPressable>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(150).duration(400).springify()}
            style={styles.userInfo}
          >
            <Text style={[styles.userName, { color: colors.textPrimary }]}>
            {user?.name || 'Your Profile'}
          </Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
            {user?.email || ''}
          </Text>
          </Animated.View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(200).duration(400).springify()}
          style={styles.section}
        >
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Profile Information
            </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <AnimatedInput
              label="Full Name"
              icon="person-outline"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setChanged(true);
                  setError('');
                  setSuccess('');
                }}
                placeholder="Enter your name"
              error={!!error && !name}
              delay={0}
              />

            <View style={styles.emailContainer}>
              <AnimatedInput
                label="Email"
                icon="mail-outline"
                value={email}
                editable={false}
                delay={50}
              />
              <Text style={[styles.emailHint, { color: colors.textSecondary }]}>
              Email cannot be changed
            </Text>
          </View>

          {error ? (
              <Animated.View
                entering={FadeInDown.duration(300)}
                style={[styles.messageContainer, { backgroundColor: `${colors.error}15` }]}
            >
              <Ionicons
                name="alert-circle"
                size={18}
                color={colors.error}
                  style={styles.messageIcon}
              />
                <Text style={[styles.messageText, { color: colors.error }]}>
                {error}
              </Text>
              </Animated.View>
          ) : null}

          {success ? (
              <Animated.View
                entering={FadeInDown.duration(300)}
                style={[styles.messageContainer, { backgroundColor: `${colors.success}15` }]}
            >
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={colors.success}
                  style={styles.messageIcon}
              />
                <Text style={[styles.messageText, { color: colors.success }]}>
                {success}
              </Text>
              </Animated.View>
          ) : null}

            <View style={styles.updateButtonContainer}>
          <PrimaryButton
            title="Update Profile"
            onPress={handleUpdateProfile}
            loading={loading}
            disabled={!changed || loading}
            variant="primary"
          />
        </View>
          </View>
        </Animated.View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  profileHeaderCard: {
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    marginBottom: 32,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  profileGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  avatarContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  avatarImageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  userEmail: {
    fontSize: 15,
    fontWeight: '400',
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
  card: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emailContainer: {
    marginTop: 8,
  },
  emailHint: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 4,
    marginLeft: 4,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  messageIcon: {
    marginRight: 10,
  },
  messageText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  updateButtonContainer: {
    marginTop: 20,
  },
  sectionContent: {
    gap: 0,
  },
});
