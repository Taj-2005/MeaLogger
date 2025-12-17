import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { api } from '../../services/api';
import AnimatedInput from '../components/AnimatedInput';
import AnimatedToggle from '../components/AnimatedToggle';
import LoadingScreen from '../components/LoadingScreen';
import PrimaryButton from '../components/PrimaryButton';
import {
  cancelReminderNotification,
  checkNotificationPermissions,
  requestNotificationPermissions,
  rescheduleAllReminders,
  scheduleReminderNotification,
} from '../../utils/notifications';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Time Picker Button Component
const TimePickerButton: React.FC<{
  time: Date;
  formatTime: (hour: number, minute: number) => string;
  onPress: () => void;
  colors: any;
}> = ({ time, formatTime, onPress, colors }) => {
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

  return (
    <View style={styles.timePickerContainer}>
      <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
        Time
      </Text>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.timePickerButton}
      >
        <Animated.View
          style={[
            styles.timePickerButtonInner,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
            },
            animatedStyle,
          ]}
        >
          <Ionicons
            name="time-outline"
            size={20}
            color={colors.primary}
            style={styles.timePickerIcon}
          />
          <Text style={[styles.timePickerText, { color: colors.textPrimary }]}>
            {formatTime(time.getHours(), time.getMinutes())}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textSecondary}
          />
        </Animated.View>
      </AnimatedPressable>
    </View>
  );
};

type Reminder = {
  _id: string;
  title: string;
  mealType?: string;
  hour: number;
  minute: number;
  enabled: boolean;
};

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function RemindersScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [mealType, setMealType] = useState(MEAL_TYPES[0]);
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      loadReminders(false);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReminders();
    }, [])
  );

  const loadReminders = async (showLoading: boolean = true) => {
    try {
      if (showLoading) setLoading(true);
      const result = await api.getReminders();
      if (result.success && result.data) {
        const remindersData = result.data.reminders;
        setReminders(remindersData);
        await rescheduleAllReminders(remindersData);
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReminder = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title for the reminder.');
      return;
    }

    const hasPermission = await checkNotificationPermissions();
    if (!hasPermission) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive meal reminders.'
        );
        return;
      }
    }

    setIsAdding(true);
    try {
      const result = await api.createReminder({
        title,
        mealType: mealType.toLowerCase(),
        hour: time.getHours(),
        minute: time.getMinutes(),
        enabled: true,
      });

      if (result.success && result.data) {
        const reminder = (result.data as any).reminder;
        if (reminder && reminder.id) {
          await scheduleReminderNotification(
            reminder.id,
            time.getHours(),
            time.getMinutes(),
            title
          );
        }
        setTitle('');
        setMealType(MEAL_TYPES[0]);
        setTime(new Date());
        await loadReminders(false);
      }
    } catch (error: any) {
      console.error('Error adding reminder:', error);
      Alert.alert('Error', error.message || 'Failed to add reminder.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    const isWeb =
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      typeof window.confirm === 'function';
    const confirmed = isWeb
      ? window.confirm('Are you sure you want to delete this reminder?')
      : await new Promise<boolean>((resolve) => {
          Alert.alert('Delete Reminder', 'Are you sure?', [
            { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
            {
              text: 'Delete',
              onPress: () => resolve(true),
              style: 'destructive',
            },
          ]);
        });

    if (confirmed) {
      try {
        await cancelReminderNotification(id);
        await api.deleteReminder(id);
        await loadReminders(false);
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to delete reminder.');
      }
    }
  };

  const handleToggleReminder = async (reminder: Reminder) => {
    try {
      const newEnabledState = !reminder.enabled;

      // Optimistic update: update UI immediately
      setReminders((prevReminders) =>
        prevReminders.map((r) =>
          r._id === reminder._id ? { ...r, enabled: newEnabledState } : r
        )
      );

      // Update on server
      await api.updateReminder(reminder._id, {
        enabled: newEnabledState,
      });

      // Update notifications
      if (newEnabledState) {
        await cancelReminderNotification(reminder._id);
        await scheduleReminderNotification(
          reminder._id,
          reminder.hour,
          reminder.minute,
          reminder.title
        );
      } else {
        await cancelReminderNotification(reminder._id);
      }

      // Refresh to ensure sync with server
      await loadReminders(false);
    } catch (error: any) {
      // Revert optimistic update on error
      setReminders((prevReminders) =>
        prevReminders.map((r) =>
          r._id === reminder._id ? { ...r, enabled: reminder.enabled } : r
        )
      );
      Alert.alert('Error', error.message || 'Failed to update reminder.');
    }
  };

  const onChangeTime = (event: any, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setTime(selectedDate);
    }
  };

  const formatTime = (hour: number, minute: number) => {
    const h = hour.toString().padStart(2, '0');
    const m = minute.toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const getMealTypeIcon = (type?: string): keyof typeof Ionicons.glyphMap => {
    switch (type?.toLowerCase()) {
      case 'breakfast':
        return 'sunny-outline';
      case 'lunch':
        return 'restaurant-outline';
      case 'dinner':
        return 'moon-outline';
      case 'snack':
        return 'cafe-outline';
      default:
        return 'time-outline';
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading reminders..." variant="minimal" />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Gradient */}
      <Animated.View
        entering={FadeInDown.duration(400).springify()}
        style={[
          styles.header,
          {
            paddingTop: insets.top + 16,
            backgroundColor: colors.surface,
          },
        ]}
      >
        <LinearGradient
          colors={[
            `${colors.primary}08`,
            `${colors.accent}05`,
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              Reminders
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Never miss a meal
            </Text>
          </View>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Add Reminder Form */}
        <Animated.View
          entering={FadeInUp.delay(100).duration(500).easing(Easing.out(Easing.ease)).springify()}
          style={styles.section}
        >
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Create Reminder
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <AnimatedInput
              label="Reminder Title"
              icon="notifications-outline"
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Breakfast Time"
              delay={0}
            />

            {/* Meal Type Picker */}
            <View style={styles.pickerContainer}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                Meal Type
              </Text>
              <View
                style={[
                  styles.pickerWrapper,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Picker
                  selectedValue={mealType}
                  onValueChange={setMealType}
                  style={{
                    color: colors.textPrimary,
                    backgroundColor: 'transparent',
                  }}
                >
                  {MEAL_TYPES.map((type) => (
                    <Picker.Item
                      key={type}
                      label={type}
                      value={type}
                      color={colors.textPrimary}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Time Picker */}
            <TimePickerButton
              time={time}
              formatTime={formatTime}
              onPress={() => setShowTimePicker(true)}
              colors={colors}
            />

            {showTimePicker && (
              <DateTimePicker
                value={time}
                mode="time"
                is24Hour={false}
                display="default"
                onChange={onChangeTime}
              />
            )}
          </View>

            {/* Add Button */}
            <View style={styles.addButtonContainer}>
              <PrimaryButton
                title="Add Reminder"
                onPress={handleAddReminder}
                loading={isAdding}
                disabled={isAdding || !title.trim()}
                variant="primary"
              />
            </View>
        </Animated.View>

        {/* Reminders List */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400).springify()}
          style={styles.section}
        >
          <View style={styles.listHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              Your Reminders
            </Text>
            <View
              style={[
                styles.countBadge,
                { backgroundColor: `${colors.primary}15` },
              ]}
            >
              <Text style={[styles.countText, { color: colors.primary }]}>
                {reminders.length}
              </Text>
            </View>
          </View>

          {reminders.length === 0 ? (
            <Animated.View
              entering={FadeInDown.delay(250).duration(400).springify()}
              style={[styles.emptyState, { backgroundColor: colors.surface }]}
            >
              <View
                style={[
                  styles.emptyStateIcon,
                  { backgroundColor: `${colors.primary}15` },
                ]}
              >
                <Ionicons
                  name="notifications-outline"
                  size={48}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.emptyStateTitle, { color: colors.textPrimary }]}>
                No reminders yet
              </Text>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                Add a reminder above to get notified about your meals
              </Text>
            </Animated.View>
          ) : (
            reminders.map((reminder, index) => (
              <ReminderCard
                key={reminder._id}
                reminder={reminder}
                onToggle={() => handleToggleReminder(reminder)}
                onDelete={() => handleDeleteReminder(reminder._id)}
                getMealTypeIcon={getMealTypeIcon}
                formatTime={formatTime}
                colors={colors}
                delay={250 + index * 50}
              />
            ))
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// Reminder Card Component
interface ReminderCardProps {
  reminder: Reminder;
  onToggle: () => void;
  onDelete: () => void;
  getMealTypeIcon: (type?: string) => keyof typeof Ionicons.glyphMap;
  formatTime: (hour: number, minute: number) => string;
  colors: any;
  delay: number;
}

const ReminderCard: React.FC<ReminderCardProps> = ({
  reminder,
  onToggle,
  onDelete,
  getMealTypeIcon,
  formatTime,
  colors,
  delay,
}) => {
  const scale = useSharedValue(1);
  const deleteScale = useSharedValue(1);

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
      style={styles.reminderCardContainer}
    >
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[cardAnimatedStyle]}
      >
        <View
          style={[
            styles.reminderCard,
            {
              backgroundColor: colors.surface,
              borderColor: reminder.enabled ? colors.primary : colors.border,
            },
          ]}
        >
          <View style={styles.reminderCardContent}>
            <View
              style={[
                styles.reminderIconContainer,
                {
                  backgroundColor: reminder.enabled
                    ? `${colors.primary}15`
                    : `${colors.textSecondary}10`,
                },
              ]}
            >
              <Ionicons
                name={getMealTypeIcon(reminder.mealType)}
                size={24}
                color={reminder.enabled ? colors.primary : colors.textSecondary}
              />
            </View>

            <View style={styles.reminderInfo}>
              <Text
                style={[
                  styles.reminderTitle,
                  {
                    color: reminder.enabled
                      ? colors.textPrimary
                      : colors.textSecondary,
                  },
                ]}
              >
                {reminder.title}
              </Text>
              <View style={styles.reminderMeta}>
                <Text
                  style={[
                    styles.reminderTime,
                    { color: colors.textSecondary },
                  ]}
                >
                  {reminder.mealType
                    ? `${reminder.mealType} • `
                    : ''}
                  {formatTime(reminder.hour, reminder.minute)}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: reminder.enabled
                        ? `${colors.success}15`
                        : `${colors.textSecondary}15`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: reminder.enabled
                          ? colors.success
                          : colors.textSecondary,
                      },
                    ]}
                  >
                    {reminder.enabled ? 'Active' : 'Disabled'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.reminderActions}>
              <AnimatedToggle
                value={reminder.enabled}
                onValueChange={onToggle}
              />
              <AnimatedPressable
                onPress={onDelete}
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
            </View>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '400',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pickerContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  pickerWrapper: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  timePickerContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  timePickerButton: {
    marginTop: 8,
  },
  timePickerButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  timePickerIcon: {
    marginRight: 12,
  },
  timePickerText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  addButtonContainer: {
    marginTop: 8,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyState: {
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyStateIcon: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
  },
  reminderCardContainer: {
    marginBottom: 12,
  },
  reminderCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reminderCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  reminderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  reminderTime: {
    fontSize: 13,
    fontWeight: '400',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reminderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 8,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
