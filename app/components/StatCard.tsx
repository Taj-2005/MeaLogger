import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  onPress?: () => void;
  color?: string;
}

export default function StatCard({
  icon,
  value,
  label,
  onPress,
  color,
}: StatCardProps) {
  const { colors } = useTheme();
  const iconColor = color || colors.primary;

  const content = (
    <View
      className="rounded-2xl p-4 flex-1"
      style={{
        backgroundColor: colors.surface,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View className="flex-row items-center mb-3">
        <View
          className="w-10 h-10 rounded-xl items-center justify-center"
          style={{ backgroundColor: `${iconColor}15` }}
        >
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
      </View>
      <Text
        className="text-2xl font-bold mb-1"
        style={{ color: colors.textPrimary }}
      >
        {value}
      </Text>
      <Text
        className="text-sm font-medium"
        style={{ color: colors.textSecondary }}
      >
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className="flex-1"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View className="flex-1">{content}</View>;
}

