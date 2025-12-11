import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import AppLogo from '../components/AppLogo';
import PrimaryButton from '../components/PrimaryButton';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const maxWidth = isTablet ? 800 : width;

export default function LandingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const features = [
    {
      icon: 'camera-outline',
      title: 'Capture Meals',
      description: 'Take photos of your meals instantly with your camera',
    },
    {
      icon: 'restaurant-outline',
      title: 'Log Quickly',
      description: 'Add meal details, calories, and type in seconds',
    },
    {
      icon: 'time-outline',
      title: 'View Timeline',
      description: 'Track your progress and see your meal history',
    },
    {
      icon: 'notifications-outline',
      title: 'Stay Consistent',
      description: 'Set reminders to build healthy eating habits',
    },
  ];

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: 40,
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            width: '100%',
            maxWidth: maxWidth,
            paddingTop: insets.top + 20,
            paddingHorizontal: 20,
          }}
        >
          <View className="items-center mb-12">
            <AppLogo size={120} style={{ marginBottom: 24 }} />
            <Text
              className="text-4xl font-bold text-center mb-4"
              style={{ color: colors.textPrimary }}
            >
              Track Your Meals{'\n'}Effortlessly
            </Text>
            <Text
              className="text-lg text-center leading-relaxed px-4"
              style={{ color: colors.textSecondary }}
            >
              Stay consistent, build streaks, and improve your eating habits with simple meal logging.
            </Text>
          </View>

          <View className="mb-12">
            <Text
              className="text-2xl font-bold text-center mb-8"
              style={{ color: colors.textPrimary }}
            >
              How It Works
            </Text>
            <View
              style={{
                flexDirection: isTablet ? 'row' : 'column',
                flexWrap: isTablet ? 'wrap' : 'nowrap',
                gap: 16,
              }}
            >
              {features.map((feature, index) => (
                <View
                  key={index}
                  className="bg-white rounded-2xl shadow-md p-6"
                  style={{
                    width: isTablet ? '48%' : '100%',
                    shadowColor: colors.shadow,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                >
                  <View
                    className="w-16 h-16 rounded-xl items-center justify-center mb-4"
                    style={{ backgroundColor: `${colors.primary}15` }}
                  >
                    <Ionicons
                      name={feature.icon as any}
                      size={32}
                      color={colors.primary}
                    />
                  </View>
                  <Text
                    className="text-lg font-bold mb-2"
                    style={{ color: colors.textPrimary }}
                  >
                    {feature.title}
                  </Text>
                  <Text
                    className="text-sm leading-snug"
                    style={{ color: colors.textSecondary }}
                  >
                    {feature.description}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View
            className="bg-white rounded-2xl shadow-md p-6 mb-8"
            style={{
              shadowColor: colors.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <View className="flex-row items-start mb-4">
              <View
                className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                style={{ backgroundColor: `${colors.error}15` }}
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={24}
                  color={colors.error}
                />
              </View>
              <View className="flex-1">
                <Text
                  className="text-lg font-bold mb-2"
                  style={{ color: colors.textPrimary }}
                >
                  The Problem
                </Text>
                <Text
                  className="text-sm leading-snug mb-4"
                  style={{ color: colors.textSecondary }}
                >
                  Forgetting to log meals, inconsistent tracking, and lack of motivation make it hard to build healthy eating habits.
                </Text>
              </View>
            </View>

            <View className="flex-row items-start">
              <View
                className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                style={{ backgroundColor: `${colors.success}15` }}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={24}
                  color={colors.success}
                />
              </View>
              <View className="flex-1">
                <Text
                  className="text-lg font-bold mb-2"
                  style={{ color: colors.textPrimary }}
                >
                  The Solution
                </Text>
                <Text
                  className="text-sm leading-snug"
                  style={{ color: colors.textSecondary }}
                >
                  MealLogger makes it simple. Capture, log, and track your meals with photo-based logging, daily reminders, and streak tracking to keep you motivated.
                </Text>
              </View>
            </View>
          </View>

          <View className="gap-4">
            <PrimaryButton
              title="Get Started"
              onPress={() => router.push('/(auth)/signup')}
              variant="primary"
            />
            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.7}
              className="py-4 rounded-xl items-center"
              style={{
                borderWidth: 2,
                borderColor: colors.primary,
              }}
            >
              <Text
                className="text-base font-semibold"
                style={{ color: colors.primary }}
              >
                I already have an account
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

