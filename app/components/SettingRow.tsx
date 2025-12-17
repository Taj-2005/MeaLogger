import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SettingRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightComponent?: React.ReactNode;
  showArrow?: boolean;
  delay?: number;
  isDestructive?: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  rightComponent,
  showArrow = true,
  delay = 0,
  isDestructive = false,
}) => {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, {
      damping: 15,
      stiffness: 400,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 400,
    });
  };

  const iconColor = isDestructive ? colors.error : colors.primary;
  const textColor = isDestructive ? colors.error : colors.textPrimary;
  const subtitleColor = isDestructive ? colors.error : colors.textSecondary;

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400).springify()}
      style={styles.container}
    >
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.row, animatedStyle]}
        disabled={!onPress}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
          <Ionicons name={icon} size={22} color={iconColor} />
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: textColor }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: subtitleColor }]}>{subtitle}</Text>
          )}
        </View>

        <View style={styles.rightContainer}>
          {rightComponent}
          {showArrow && !rightComponent && onPress && (
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
              style={styles.arrow}
            />
          )}
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    minHeight: 72,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 2,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  arrow: {
    marginLeft: 4,
  },
});

export default SettingRow;

