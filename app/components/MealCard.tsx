import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface MealCardProps {
  title: string;
  type: string;
  date: string;
  calories?: number;
  imageUrl: string;
  onPress?: () => void;
  onDelete?: () => void;
}

export default function MealCard({
  title,
  type,
  date,
  calories,
  imageUrl,
  onPress,
  onDelete,
}: MealCardProps) {
  const { colors } = useTheme();

  const getMealIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast':
        return 'sunny-outline';
      case 'lunch':
        return 'restaurant-outline';
      case 'dinner':
        return 'moon-outline';
      case 'snack':
        return 'cafe-outline';
      default:
        return 'restaurant-outline';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="rounded-2xl overflow-hidden mb-4"
      style={{
        backgroundColor: colors.surface,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View className="flex-row">
        <Image
          source={{ uri: imageUrl }}
          className="w-24 h-24"
          style={{ backgroundColor: colors.border }}
          resizeMode="cover"
        />

        <View className="flex-1 p-4 justify-between">
          <View>
            <View className="flex-row items-center mb-2">
              <Ionicons 
                name={getMealIcon(type) as any} 
                size={20} 
                color={colors.primary} 
                style={{ marginRight: 8 }}
              />
              <Text
                className="text-lg font-bold flex-1"
                style={{ color: colors.textPrimary }}
                numberOfLines={1}
              >
                {title}
              </Text>
            </View>
            <View className="flex-row items-center mb-2">
              <Text
                className="text-sm font-medium capitalize mr-3"
                style={{ color: colors.textSecondary }}
              >
                {type}
              </Text>
              <Text
                className="text-sm"
                style={{ color: colors.textSecondary }}
              >
                {formatDate(date)}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            {calories !== undefined && (
              <View
                className="px-3 py-1 rounded-lg"
                style={{ backgroundColor: `${colors.primary}15` }}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{ color: colors.primary }}
                >
                  {calories} cal
                </Text>
              </View>
            )}
            {onDelete && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-2"
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

