import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { auth, db } from '../../firebaseConfig';
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import * as Notifications from 'expo-notifications';
import { useTheme } from '../../contexts/ThemeContext';
import SettingsButton from '../components/SettingsBtn';

type Reminder = {
  id: string;
  title: string;
  mealType: string;
  hour: number;
  minute: number;
  userEmail: string;
};

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function RemindersScreen() {
  const { colors, isDark } = useTheme();

  const [title, setTitle] = useState('');
  const [mealType, setMealType] = useState(MEAL_TYPES[0]);
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const userEmail = auth.currentUser?.email ?? 'guest@example.com';

  useEffect(() => {
    const remindersRef = collection(db, 'reminders');
    const q = query(remindersRef, where('userEmail', '==', userEmail));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const rems: Reminder[] = [];
      querySnapshot.forEach((doc) => {
        rems.push({ ...(doc.data() as Reminder), id: doc.id });
      });
      setReminders(rems);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userEmail]);

  const scheduleNotification = async (hour: number, minute: number, title: string) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Meal Reminder',
        body: `Time for your ${title}`,
        sound: true,
      },
      trigger: {
        type: 'calendar',
        hour,
        minute,
        repeats: true,
      } as any,
    });
  };

  const handleAddReminder = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title for the reminder.');
      return;
    }

    try {
      await addDoc(collection(db, 'reminders'), {
        title,
        mealType,
        hour: time.getHours(),
        minute: time.getMinutes(),
        userEmail,
      });

      await scheduleNotification(time.getHours(), time.getMinutes(), title);

      setTitle('');
      setMealType(MEAL_TYPES[0]);
      setTime(new Date());

      Alert.alert('Success', 'Reminder added and notification scheduled.');
    } catch (error) {
      console.error('Error adding reminder:', error);
      Alert.alert('Error', 'Failed to add reminder.');
    }
  };

  const handleDeleteReminder = (id: string) => {
    Alert.alert('Delete Reminder', 'Are you sure you want to delete this reminder?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'reminders', id));
            Alert.alert('Deleted', 'Reminder deleted successfully.');
          } catch (error) {
            console.error('Error deleting reminder:', error);
            Alert.alert('Error', 'Failed to delete reminder.');
          }
        },
      },
    ]);
  };

  const onChangeTime = (event: any, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios'); // keep open on iOS
    if (selectedDate) {
      setTime(selectedDate);
    }
  };

  if (loading) {
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: colors.primaryBackground }}
      >
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View className="flex-1 p-4" style={{ backgroundColor: colors.primaryBackground }}>
      <View className="flex-row justify-between items-center mb-4 mt-10">
        <Text className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
          Manage Meal Reminders
        </Text>
        <SettingsButton />
      </View>

      {/* Title input */}
      <TextInput
        placeholder="Reminder Title"
        placeholderTextColor={colors.textMuted}
        value={title}
        onChangeText={setTitle}
        className="border rounded p-2 mb-4"
        style={{
          borderColor: colors.border,
          color: colors.textPrimary,
          backgroundColor: colors.surface,
        }}
      />

      {/* Meal type picker */}
      <View
        className="border rounded mb-4"
        style={{ borderColor: colors.border, backgroundColor: colors.surface }}
      >
        <Picker
          selectedValue={mealType}
          onValueChange={(value) => setMealType(value)}
          style={{ color: colors.textPrimary }}
          dropdownIconColor={colors.textPrimary}
        >
          {MEAL_TYPES.map((type) => (
            <Picker.Item label={type} value={type} key={type} color={colors.textPrimary} />
          ))}
        </Picker>
      </View>

      {/* Time picker */}
      <TouchableOpacity
        onPress={() => setShowTimePicker(true)}
        className="border rounded p-3 mb-4"
        style={{ borderColor: colors.border, backgroundColor: colors.surface }}
      >
        <Text style={{ color: colors.textPrimary }}>
          Set Time: {time.getHours().toString().padStart(2, '0')}:
          {time.getMinutes().toString().padStart(2, '0')}
        </Text>
      </TouchableOpacity>

      {showTimePicker && (
        <DateTimePicker
          value={time}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={onChangeTime}
          textColor={colors.textPrimary} // For iOS picker text color
          style={{ backgroundColor: colors.primaryBackground }}
        />
      )}

      {/* Add reminder button */}
      <TouchableOpacity
        onPress={handleAddReminder}
        className="rounded p-3 mb-6"
        style={{ backgroundColor: colors.accent }}
      >
        <Text className="text-center font-semibold" style={{ color: colors.switchThumb }}>
          Add Reminder
        </Text>
      </TouchableOpacity>

      {/* List reminders */}
      {reminders.length === 0 ? (
        <Text className="text-center" style={{ color: colors.textMuted }}>
          No reminders set yet.
        </Text>
      ) : (
        <FlatList
          data={reminders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              className="flex-row justify-between items-center border-b py-3"
              style={{ borderColor: colors.border }}
            >
              <View>
                <Text className="font-semibold text-lg" style={{ color: colors.textPrimary }}>
                  {item.title}
                </Text>
                <Text style={{ color: colors.textMuted }}>
                  {item.mealType} at {item.hour.toString().padStart(2, '0')}:
                  {item.minute.toString().padStart(2, '0')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteReminder(item.id)}
                className="px-3 py-1 rounded"
                style={{ backgroundColor: isDark ? '#7f1d1d' : '#fee2e2' }} // red-900 / red-100
              >
                <Text
                  className="font-semibold"
                  style={{ color: isDark ? '#fecaca' : '#b91c1c' }} // red-300 / red-700
                >
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </View>
  );
}
