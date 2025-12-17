import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface MealCardProps {
  title: string;
  type: string;
  date: string;
  time?: string;
  calories?: number;
  imageUrl: string;
  onPress?: () => void;
  onDelete?: () => void;
  delay?: number;
}

export default function MealCard({
  title,
  type,
  date,
  time,
  calories,
  imageUrl,
  onPress,
  onDelete,
  delay = 0,
}: MealCardProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const deleteScale = useSharedValue(1);

  const getMealIcon = (mealType: string): keyof typeof Ionicons.glyphMap => {
    switch (mealType?.toLowerCase()) {
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

  const formatTime = (dateString: string, timeString?: string) => {
    // If time is provided separately, use it; otherwise use date's time
    if (timeString) {
      try {
        const timeDate = new Date(timeString);
        return timeDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      } catch {
        // Fallback to date's time if time parsing fails
      }
    }
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const deleteAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: deleteScale.value }],
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

  const handleDeletePressIn = () => {
    deleteScale.value = withSpring(0.9, {
      damping: 15,
      stiffness: 400,
    });
  };

  const handleDeletePressOut = () => {
    deleteScale.value = withSpring(1, {
      damping: 15,
      stiffness: 400,
    });
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400).springify()}
      style={styles.container}
    >
      <AnimatedPressable
      onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[cardAnimatedStyle]}
      >
        <View
          style={[
            styles.card,
            {
        backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Image Thumbnail */}
          <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
              style={styles.image}
            />
            <View
              style={[
                styles.imageOverlay,
                {
                  backgroundColor: `${colors.primary}20`,
                },
              ]}
            >
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: `${colors.primary}15`,
                  },
                ]}
              >
              <Ionicons 
                  name={getMealIcon(type)}
                  size={24}
                color={colors.primary} 
              />
            </View>
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <Text
                  style={[styles.title, { color: colors.textPrimary }]}
                  numberOfLines={2}
                >
                  {title}
                </Text>
              </View>
            {onDelete && (
                <AnimatedPressable
                onPress={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                  onPressIn={handleDeletePressIn}
                  onPressOut={handleDeletePressOut}
                  style={[styles.deleteButton, deleteAnimatedStyle]}
                >
                  <View
                    style={[
                      styles.deleteButtonInner,
                      { backgroundColor: `${colors.error}15` },
                    ]}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </View>
                </AnimatedPressable>
              )}
            </View>

            <View style={styles.meta}>
              <View style={styles.metaRow}>
                <View
                  style={[
                    styles.typeBadge,
                    {
                      backgroundColor: `${colors.primary}15`,
                    },
                  ]}
              >
                  <Ionicons
                    name={getMealIcon(type)}
                    size={14}
                    color={colors.primary}
                    style={styles.typeIcon}
                  />
                  <Text
                    style={[styles.typeText, { color: colors.primary }]}
                    numberOfLines={1}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </View>
                <View style={styles.dateTimeContainer}>
                  <Ionicons
                    name="time-outline"
                    size={12}
                    color={colors.textSecondary}
                    style={styles.timeIcon}
                  />
                  <Text
                    style={[styles.dateTime, { color: colors.textSecondary }]}
                  >
                    {formatTime(date, time)}
                  </Text>
                </View>
              </View>

              <View style={styles.footer}>
                <Text
                  style={[styles.dateText, { color: colors.textSecondary }]}
                >
                  {formatDate(date)}
                </Text>
                {calories !== undefined && calories > 0 && (
                  <View
                    style={[
                      styles.caloriesBadge,
                      {
                        backgroundColor: `${colors.accent}15`,
                      },
                    ]}
                  >
                    <Ionicons
                      name="flame"
                      size={12}
                      color={colors.accent}
                      style={styles.caloriesIcon}
                    />
                    <Text
                      style={[styles.caloriesText, { color: colors.accent }]}
                    >
                      {calories} cal
                    </Text>
                  </View>
            )}
          </View>
        </View>
      </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    height: 120,
  },
  imageContainer: {
    width: 120,
    height: 120,
    position: 'relative',
    overflow: 'hidden',
    margin: 0,
    padding: 0,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E2E8F0',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeIcon: {
    marginRight: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    marginRight: 4,
  },
  dateTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '500',
  },
  caloriesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  caloriesIcon: {
    marginRight: 4,
  },
  caloriesText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
