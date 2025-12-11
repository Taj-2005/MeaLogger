import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { api } from '../../services/api';
import {
    cancelReminderNotification,
    checkNotificationPermissions,
    requestNotificationPermissions,
    rescheduleAllReminders,
    scheduleReminderNotification,
} from '../../utils/notifications';
import AppLogo from '../components/AppLogo';
import PrimaryButton from '../components/PrimaryButton';

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
    const isWeb = Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.confirm === 'function';
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
      await api.updateReminder(reminder._id, {
        enabled: newEnabledState,
      });

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

      await loadReminders(false);
    } catch (error: any) {
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
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      {/* Header */}
      <View
        className="pb-6 px-6"
        style={{ 
          backgroundColor: colors.surface,
          paddingTop: insets.top + 20,
        }}
      >
        <View className="mb-4 flex-row items-center">
          <AppLogo size={32} style={{ marginRight: 12 }} />
          <Text
            className="text-2xl font-bold"
            style={{ color: colors.textPrimary }}
          >
            Reminders
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Add Reminder Form */}
        <View
          className="rounded-2xl p-6 mb-6"
          style={{
            backgroundColor: colors.surface,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <Text
            className="text-lg font-bold mb-4"
            style={{ color: colors.textPrimary }}
          >
            Add New Reminder
          </Text>

          {/* Title Input */}
          <View className="mb-4">
            <Text
              className="text-sm font-semibold mb-2"
              style={{ color: colors.textPrimary }}
            >
              Reminder Title *
            </Text>
            <View
              className="rounded-xl px-4 py-3.5 flex-row items-center"
              style={{
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color={colors.textSecondary}
                style={{ marginRight: 12 }}
              />
              <TextInput
                placeholder="e.g., Breakfast Time"
                placeholderTextColor={colors.textSecondary}
                value={title}
                onChangeText={setTitle}
                className="flex-1 text-base"
                style={{ color: colors.textPrimary }}
              />
            </View>
          </View>

          {/* Meal Type Picker */}
          <View className="mb-4">
            <Text
              className="text-sm font-semibold mb-2"
              style={{ color: colors.textPrimary }}
            >
              Meal Type
            </Text>
            <View
              className="rounded-xl overflow-hidden py-4 px-2"
              style={{
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
              }}
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
          <View className="mb-6">
            <Text
              className="text-sm font-semibold mb-2"
              style={{ color: colors.textPrimary }}
            >
              Time
            </Text>
            <TouchableOpacity
              onPress={() => setShowTimePicker(true)}
              activeOpacity={0.7}
              className="rounded-xl px-4 py-3.5 flex-row items-center"
              style={{
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Ionicons
                name="time-outline"
                size={20}
                color={colors.textSecondary}
                style={{ marginRight: 12 }}
              />
              <Text
                className="text-base flex-1"
                style={{ color: colors.textPrimary }}
              >
                {formatTime(time.getHours(), time.getMinutes())}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

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
          <PrimaryButton
            title="Add Reminder"
            onPress={handleAddReminder}
            loading={isAdding}
            disabled={isAdding || !title.trim()}
            variant="primary"
          />
        </View>

        {/* Reminders List */}
        <View className="mb-6">
          <Text
            className="text-lg font-bold mb-4"
            style={{ color: colors.textPrimary }}
          >
            Your Reminders ({reminders.length})
          </Text>

          {reminders.length === 0 ? (
            <View
              className="rounded-2xl p-8 items-center"
              style={{ backgroundColor: colors.surface }}
            >
              <Ionicons name="notifications-outline" size={64} color={colors.primary} style={{ marginBottom: 16 }} />
              <Text
                className="text-base font-semibold mb-2 text-center"
                style={{ color: colors.textPrimary }}
              >
                No reminders yet
              </Text>
              <Text
                className="text-sm text-center"
                style={{ color: colors.textSecondary }}
              >
                Add a reminder above to get notified about your meals
              </Text>
            </View>
          ) : (
            reminders.map((reminder) => (
              <View
                key={reminder._id}
                className="rounded-2xl p-4 mb-3 flex-row items-center justify-between"
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View className="flex-1 flex-row items-center">
                  <View
                    className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                    style={{ backgroundColor: `${colors.primary}15` }}
                  >
                    <Ionicons 
                      name={getMealTypeIcon(reminder.mealType)} 
                      size={24} 
                      color={colors.primary} 
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-base font-semibold mb-1"
                      style={{ color: colors.textPrimary }}
                    >
                      {reminder.title}
                    </Text>
                    <View className="flex-row items-center">
                      <Text
                        className="text-sm mr-2"
                        style={{ color: colors.textSecondary }}
                      >
                        {reminder.mealType
                          ? `${reminder.mealType} • `
                          : ''}
                        {formatTime(reminder.hour, reminder.minute)}
                      </Text>
                      <View
                        className="px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: reminder.enabled
                            ? `${colors.success}15`
                            : `${colors.textSecondary}15`,
                        }}
                      >
                        <Text
                          className="text-xs font-semibold"
                          style={{
                            color: reminder.enabled
                              ? colors.success
                              : colors.textSecondary,
                          }}
                        >
                          {reminder.enabled ? 'Active' : 'Disabled'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                <View className="flex-row items-center">
                  <TouchableOpacity
                    onPress={() => handleToggleReminder(reminder)}
                    className="p-2 mr-2"
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={
                        reminder.enabled
                          ? 'toggle'
                          : 'toggle-outline'
                      }
                      size={24}
                      color={reminder.enabled ? colors.success : colors.textSecondary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteReminder(reminder._id)}
                    className="p-2"
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={22}
                      color={colors.error}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
