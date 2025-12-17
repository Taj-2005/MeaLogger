import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';

interface AnimatedInputProps extends TextInputProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: boolean;
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
  onPasswordToggle?: () => void;
  showPassword?: boolean;
  delay?: number;
}

const AnimatedInput: React.FC<AnimatedInputProps> = ({
  label,
  icon,
  error = false,
  secureTextEntry = false,
  showPasswordToggle = false,
  onPasswordToggle,
  showPassword = false,
  delay = 0,
  ...textInputProps
}) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = React.useState(false);
  const hasValue = Boolean(textInputProps.value && textInputProps.value.length > 0);
  const scale = useSharedValue(1);
  const borderColor = useSharedValue(colors.border);
  const labelColor = useSharedValue(colors.textSecondary);
  const labelScale = useSharedValue(1);
  const labelTranslateY = useSharedValue(0);

  useEffect(() => {
    if (isFocused || hasValue) {
      labelScale.value = withSpring(0.85, { damping: 15, stiffness: 200 });
      labelTranslateY.value = withSpring(-20, { damping: 15, stiffness: 200 });
      labelColor.value = withTiming(colors.primary, { duration: 200 });
    } else {
      labelScale.value = withSpring(1, { damping: 15, stiffness: 200 });
      labelTranslateY.value = withSpring(0, { damping: 15, stiffness: 200 });
      labelColor.value = withTiming(colors.textSecondary, { duration: 200 });
    }
  }, [isFocused, hasValue, colors]);

  useEffect(() => {
    if (error) {
      borderColor.value = withTiming(colors.error, { duration: 200 });
    } else if (isFocused) {
      borderColor.value = withTiming(colors.primary, { duration: 200 });
    } else {
      borderColor.value = withTiming(colors.border, { duration: 200 });
    }
  }, [error, isFocused, colors]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: borderColor.value,
  }));

  const animatedLabelStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: labelScale.value },
      { translateY: labelTranslateY.value },
    ],
    color: labelColor.value,
  }));

  const handleFocus = () => {
    setIsFocused(true);
    scale.value = withSpring(1.01, { damping: 15, stiffness: 300 });
  };

  const handleBlur = () => {
    setIsFocused(false);
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handleChangeText = (text: string) => {
    textInputProps.onChangeText?.(text);
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(500).easing(Easing.out(Easing.ease))}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surface,
            shadowColor: isFocused ? colors.primary : colors.shadow,
            shadowOpacity: isFocused ? 0.1 : 0.05,
          },
          animatedContainerStyle,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={isFocused ? colors.primary : colors.textSecondary}
            style={styles.icon}
          />
        )}

        <View style={styles.inputWrapper}>
          <Animated.Text
            style={[
              styles.label,
              animatedLabelStyle,
            ]}
          >
            {label}
          </Animated.Text>
          <TextInput
            {...textInputProps}
            style={[styles.input, { color: colors.textPrimary }]}
            placeholder=""
            placeholderTextColor="transparent"
            secureTextEntry={secureTextEntry && !showPassword}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChangeText={handleChangeText}
          />
        </View>

        {showPasswordToggle && (
          <TouchableOpacity
            onPress={onPasswordToggle}
            activeOpacity={0.7}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </Animated.View>

    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  icon: {
    marginRight: 12,
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    minHeight: 24,
  },
  label: {
    position: 'absolute',
    left: 0,
    fontSize: 16,
    fontWeight: '500',
    pointerEvents: 'none',
  },
  input: {
    fontSize: 16,
    paddingTop: 8,
    paddingBottom: 0,
  },
  eyeIcon: {
    marginLeft: 8,
    padding: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default AnimatedInput;

