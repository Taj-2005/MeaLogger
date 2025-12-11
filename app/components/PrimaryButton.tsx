import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'accent' | 'success';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: ViewStyle;
}

export default function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = '',
  style,
}: PrimaryButtonProps) {
  const { colors } = useTheme();

  const getVariantColor = () => {
    switch (variant) {
      case 'accent':
        return colors.accent;
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      default:
        return colors.primary;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-4 py-2.5';
      case 'lg':
        return 'px-8 py-4';
      default:
        return 'px-6 py-3.5';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'lg':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  const backgroundColor = getVariantColor();
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      className={`rounded-xl ${getSizeClasses()} items-center justify-center ${className}`}
      style={[
        {
          backgroundColor: isDisabled ? colors.border : backgroundColor,
          opacity: isDisabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Text
          className={`${getTextSize()} font-bold text-white`}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

