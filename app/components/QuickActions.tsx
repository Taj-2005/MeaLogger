import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
    {
      id: 'reminders',
      label: 'Reminders',
      icon: 'notifications-outline' as const,
      color: colors.warning,
      onPress: () => router.push('./remainder'),
    },
  ];

  const padding = 40;
  const gap = 12;
  const cardWidth = (width - padding - gap) / 2;

  const ActionButton = ({
    action,
    index,
  }: {
    action: (typeof actions)[0];
    index: number;
  }) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
      scale.value = withSpring(0.96, {
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

    return (
      <Animated.View
        entering={FadeInDown.delay(100 + index * 50).duration(400).springify()}
        style={[
          {
            width: cardWidth,
            marginRight: index % 2 === 0 ? gap : 0,
            marginBottom: 12,
          },
        ]}
      >
        <AnimatedPressable
          onPress={action.onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={animatedStyle}
        >
          <View
            style={[
              styles.actionCard,
              {
                backgroundColor: action.primary
                  ? colors.primary
                  : colors.surface,
                borderWidth: action.primary ? 0 : 1,
                borderColor: colors.border,
                shadowColor: colors.shadow,
                shadowOpacity: action.primary ? 0.2 : 0.05,
                elevation: action.primary ? 4 : 2,
              },
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: action.primary
                    ? 'rgba(255, 255, 255, 0.2)'
                    : `${action.color}15`,
                },
              ]}
            >
              <Ionicons
                name={action.icon}
                size={28}
                color={action.primary ? '#FFFFFF' : action.color}
              />
            </View>
            <Text
              style={[
                styles.actionLabel,
                {
                  color: action.primary ? '#FFFFFF' : colors.textPrimary,
                },
              ]}
            >
              {action.label}
            </Text>
          </View>
        </AnimatedPressable>
      </Animated.View>
    );
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(100).duration(400)}
      style={styles.container}
    >
      <Text
        style={[styles.sectionTitle, { color: colors.textPrimary }]}
      >
        Quick Actions
      </Text>
      <View style={styles.actionsGrid}>
        {actions.map((action, index) => (
          <ActionButton key={action.id} action={action} index={index} />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionCard: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    minHeight: 120,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});

