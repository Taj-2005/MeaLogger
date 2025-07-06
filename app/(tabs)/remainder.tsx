import React, { useState, useEffect, useCallback } from 'react';
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
  const [title, setTitle] = useState('');
  const [mealType, setMealType] = useState(MEAL_TYPES[0]);
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const userEmail = auth.currentUser?.email ?? 'guest@example.com';

  // Load reminders live from Firestore for current user
  useEffect(() => {
    const remindersRef = collection(db, 'reminders');
    const q = query(remindersRef, where('userEmail', '==', userEmail));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const rems: Reminder[] = [];
      querySnapshot.forEach((doc) => {
        rems.push({ ...(doc.data() as Reminder) });;
      });
      setReminders(rems);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userEmail]);

  // Schedule notification for reminder
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
      // Save reminder to Firestore
      const newDoc = await addDoc(collection(db, 'reminders'), {
        title,
        mealType,
        hour: time.getHours(),
        minute: time.getMinutes(),
        userEmail,
      });

      // Schedule notification
      await scheduleNotification(time.getHours(), time.getMinutes(), title);

      // Reset form
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
    setShowTimePicker(Platform.OS === 'ios'); // For iOS keep open, for Android close after select
    if (selectedDate) {
      setTime(selectedDate);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View className="flex-1 p-4 bg-white">
      <Text className="text-2xl font-bold mb-4 mt-10">Manage Meal Reminders</Text>

      {/* Title input */}
      <TextInput
        placeholder="Reminder Title"
        value={title}
        onChangeText={setTitle}
        className="border border-gray-400 rounded p-2 mb-4"
      />

      {/* Meal type picker */}
      <View className="border border-gray-400 rounded mb-4">
        <Picker selectedValue={mealType} onValueChange={(value) => setMealType(value)}>
          {MEAL_TYPES.map((type) => (
            <Picker.Item label={type} value={type} key={type} />
          ))}
        </Picker>
      </View>

      {/* Time picker */}
      <TouchableOpacity
        onPress={() => setShowTimePicker(true)}
        className="border border-gray-400 rounded p-3 mb-4"
      >
        <Text className="text-gray-800">
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
        />
      )}

      {/* Add reminder button */}
      <TouchableOpacity
        onPress={handleAddReminder}
        className="bg-blue-600 rounded p-3 mb-6"
      >
        <Text className="text-white text-center font-semibold">Add Reminder</Text>
      </TouchableOpacity>

      {/* List reminders */}
      {reminders.length === 0 ? (
        <Text className="text-center text-gray-600">No reminders set yet.</Text>
      ) : (
        <FlatList
          data={reminders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="flex-row justify-between items-center border-b border-gray-300 py-3">
              <View>
                <Text className="font-semibold text-lg">{item.title}</Text>
                <Text>
                  {item.mealType} at{' '}
                  {item.hour.toString().padStart(2, '0')}:
                  {item.minute.toString().padStart(2, '0')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteReminder(item.id)}
                className="bg-red-100 px-3 py-1 rounded"
              >
                <Text className="text-red-600 font-semibold">Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}
