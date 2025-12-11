import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const NOTIFICATION_IDS_KEY = '@meal_logger_notification_ids';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

export async function checkNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking notification permissions:', error);
    return false;
  }
}

export async function scheduleReminderNotification(
  reminderId: string,
  hour: number,
  minute: number,
  title: string
): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  try {
    const hasPermission = await checkNotificationPermissions();
    if (!hasPermission) {
      console.warn('Notification permissions not granted');
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Meal Reminder',
        body: `Time for your ${title}`,
        sound: true,
        data: { reminderId },
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });

    await saveNotificationId(reminderId, notificationId);
    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

export async function cancelReminderNotification(reminderId: string): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    const notificationId = await getNotificationId(reminderId);
    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      await removeNotificationId(reminderId);
    }
  } catch (error) {
    console.error('Error cancelling notification:', error);
  }
}

export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem(NOTIFICATION_IDS_KEY);
  } catch (error) {
    console.error('Error cancelling all notifications:', error);
  }
}

async function saveNotificationId(reminderId: string, notificationId: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_IDS_KEY);
    const ids = stored ? JSON.parse(stored) : {};
    ids[reminderId] = notificationId;
    await AsyncStorage.setItem(NOTIFICATION_IDS_KEY, JSON.stringify(ids));
  } catch (error) {
    console.error('Error saving notification ID:', error);
  }
}

async function getNotificationId(reminderId: string): Promise<string | null> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_IDS_KEY);
    if (!stored) return null;
    const ids = JSON.parse(stored);
    return ids[reminderId] || null;
  } catch (error) {
    console.error('Error getting notification ID:', error);
    return null;
  }
}

async function removeNotificationId(reminderId: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_IDS_KEY);
    if (!stored) return;
    const ids = JSON.parse(stored);
    delete ids[reminderId];
    await AsyncStorage.setItem(NOTIFICATION_IDS_KEY, JSON.stringify(ids));
  } catch (error) {
    console.error('Error removing notification ID:', error);
  }
}

export async function rescheduleAllReminders(reminders: Array<{
  _id: string;
  title: string;
  hour: number;
  minute: number;
  enabled: boolean;
}>): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    const hasPermission = await checkNotificationPermissions();
    if (!hasPermission) {
      return;
    }

    const stored = await AsyncStorage.getItem(NOTIFICATION_IDS_KEY);
    const existingIds = stored ? JSON.parse(stored) : {};
    const currentReminderIds = new Set(reminders.filter(r => r.enabled).map(r => r._id));

    for (const reminderId in existingIds) {
      if (!currentReminderIds.has(reminderId)) {
        await Notifications.cancelScheduledNotificationAsync(existingIds[reminderId]);
      }
    }

    const newIds: Record<string, string> = {};
    for (const reminder of reminders) {
      if (reminder.enabled) {
        const existingId = existingIds[reminder._id];
        if (existingId) {
          newIds[reminder._id] = existingId;
        } else {
          const notificationId = await scheduleReminderNotification(
            reminder._id,
            reminder.hour,
            reminder.minute,
            reminder.title
          );
          if (notificationId) {
            newIds[reminder._id] = notificationId;
          }
        }
      }
    }

    await AsyncStorage.setItem(NOTIFICATION_IDS_KEY, JSON.stringify(newIds));
  } catch (error) {
    console.error('Error rescheduling reminders:', error);
  }
}

