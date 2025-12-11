import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

export default function QuickActions() {
  const router = useRouter();
  const { colors } = useTheme();

  const actions = [
    {
      id: 'add-meal',
      label: 'Add Meal',
      icon: 'add-circle' as const,
      color: colors.primary,
      onPress: () => router.push('./meal-logging'),
      primary: true,
    },
    {
      id: 'timeline',
      label: 'Timeline',
      icon: 'time-outline' as const,
      color: colors.accent,
      onPress: () => router.push('./timeline'),
    },
  ];

  const padding = 40;
  const gap = 12;
  const cardWidth = (width - padding - gap) / 2;

  return (
    <View className="px-5 mb-6">
      <Text
        className="text-lg font-semibold mb-4 tracking-tight"
        style={{ color: colors.textPrimary }}
      >
        Quick Actions
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={action.id}
            onPress={action.onPress}
            activeOpacity={0.7}
            style={{
              width: cardWidth,
              backgroundColor: action.primary ? colors.primary : colors.surface,
              borderRadius: 16,
              padding: 20,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: action.primary ? 0 : 1,
              borderColor: colors.border,
              shadowColor: colors.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: action.primary ? 0.2 : 0.05,
              shadowRadius: 8,
              elevation: action.primary ? 4 : 2,
              marginRight: index % 2 === 0 ? gap : 0,
              marginBottom: 12,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: action.primary
                  ? 'rgba(255, 255, 255, 0.2)'
                  : `${action.color}15`,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <Ionicons
                name={action.icon}
                size={24}
                color={action.primary ? '#FFFFFF' : action.color}
              />
            </View>
            <Text
              className="text-base font-semibold tracking-tight"
              style={{
                color: action.primary ? '#FFFFFF' : colors.textPrimary,
              }}
            >
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

