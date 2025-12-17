import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface QuickAction {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: string;
}

export default function QuickActionsGrid() {
  const { colors } = useTheme();
  const router = useRouter();

  const actions: QuickAction[] = [
    {
      id: 'timeline',
      label: 'Timeline',
      icon: 'time-outline',
      color: colors.primary,
      route: './timeline',
    },
    {
      id: 'reminders',
      label: 'Reminders',
      icon: 'notifications-outline',
      color: colors.warning,
      route: './remainder',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: 'person-outline',
      color: colors.accent,
      route: './profile',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'settings-outline',
      color: colors.textSecondary,
      route: './settings',
    },
  ];

  const ActionButton = ({
    action,
    index,
  }: {
    action: QuickAction;
    index: number;
  }) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
      scale.value = withSpring(0.95, {
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

    const cardWidth = (width - 60) / 2; // 20px padding + 20px gap

    return (
      <Animated.View
        entering={FadeInUp.delay(350 + index * 50).duration(400).springify()}
        style={{ width: cardWidth }}
      >
        <AnimatedPressable
          onPress={() => router.push(action.route as any)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={animatedStyle}
        >
          <View
            style={[
              styles.actionCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${action.color}15` },
              ]}
            >
              <Ionicons name={action.icon} size={24} color={action.color} />
            </View>
            <Text
              style={[styles.actionLabel, { color: colors.textPrimary }]}
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
      entering={FadeInUp.delay(300).duration(500)}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Quick Actions
        </Text>
      </View>
      <View style={styles.grid}>
        {actions.map((action, index) => (
          <ActionButton key={action.id} action={action} index={index} />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  actionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 120,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
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

