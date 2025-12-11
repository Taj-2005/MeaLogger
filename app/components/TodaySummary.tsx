import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface TodaySummaryProps {
  todayMeals: number;
  todayCalories: number;
  remindersActive: boolean;
}

export default function TodaySummary({
  todayMeals,
  todayCalories,
  remindersActive,
}: TodaySummaryProps) {
  const router = useRouter();
  const { colors } = useTheme();

  const stats = [
    {
      id: 'meals',
      label: 'Meals Today',
      value: todayMeals,
      icon: 'restaurant-outline' as const,
      color: colors.primary,
      onPress: () => router.push('./timeline'),
    },
    {
      id: 'calories',
      label: 'Calories',
      value: todayCalories || '0',
      icon: 'flame-outline' as const,
      color: colors.warning,
      onPress: () => router.push('./timeline'),
    },
    {
      id: 'reminders',
      label: 'Reminders',
      value: remindersActive ? 'On' : 'Off',
      icon: 'notifications-outline' as const,
      color: remindersActive ? colors.success : colors.textSecondary,
      onPress: () => router.push('./remainder'),
    },
  ];

  const padding = 40;
  const totalGaps = 24;
  const cardWidth = (width - padding - totalGaps) / 3;

  return (
    <View className="px-5 mb-6">
      <Text
        className="text-lg font-semibold mb-4 tracking-tight"
        style={{ color: colors.textPrimary }}
      >
        Today at a Glance
      </Text>
      <View style={{ flexDirection: 'row' }}>
        {stats.map((stat, index) => (
          <TouchableOpacity
            key={stat.id}
            onPress={stat.onPress}
            activeOpacity={0.7}
            className="bg-white rounded-xl shadow-md"
            style={{
              width: cardWidth,
              padding: 16,
              shadowColor: colors.shadow,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 2,
              marginRight: index < stats.length - 1 ? 12 : 0,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: `${stat.color}15`,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <Ionicons name={stat.icon} size={18} color={stat.color} />
            </View>
            <Text
              className="text-2xl font-bold tracking-tight mb-1"
              style={{ color: colors.textPrimary }}
            >
              {stat.value}
            </Text>
            <Text
              className="text-xs font-medium leading-snug"
              style={{ color: colors.textSecondary }}
            >
              {stat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
