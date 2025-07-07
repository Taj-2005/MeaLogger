import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';

export default function SettingsButton() {
  const { colors } = useTheme();
  const router = useRouter();

  const goToSettings = () => {
    router.push('/settings');
  };

  return (
    <TouchableOpacity
      onPress={goToSettings}
      activeOpacity={0.7}
    >
          <View
            className="p-2 rounded-full"
            style={{ backgroundColor: colors.surface }}
          >
            <Ionicons name="settings" size={24} color={colors.textPrimary} />
          </View>
    </TouchableOpacity>
  );
}
