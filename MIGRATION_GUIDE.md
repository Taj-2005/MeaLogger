# Frontend Migration Guide

This guide provides step-by-step instructions to migrate the React Native app from Firebase to the new backend API.

## Overview

The migration involves:
1. Replacing Firebase Auth with JWT-based authentication
2. Replacing Firestore with REST API calls
3. Replacing local image storage with Cloudinary URLs
4. Implementing token management and refresh logic

## Step 1: Install Dependencies

Add axios (or use fetch) for API calls:

```bash
npm install axios
# or use built-in fetch (already available in React Native)
```

## Step 2: Create API Service

Create `services/api.ts`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('accessToken');
  }

  private async getRefreshToken(): Promise<string | null> {
    return await AsyncStorage.getItem('refreshToken');
  }

  private async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await AsyncStorage.multiSet([
      ['accessToken', accessToken],
      ['refreshToken', refreshToken],
    ]);
  }

  private async clearTokens(): Promise<void> {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
  }

  private async refreshAccessToken(): Promise<boolean> {
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) return false;

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const result: ApiResponse<{ tokens: { accessToken: string; refreshToken: string } }> =
        await response.json();

      if (result.success && result.data) {
        await this.setTokens(result.data.tokens.accessToken, result.data.tokens.refreshToken);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = await this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    let response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle token expiration
    if (response.status === 401) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        // Retry request with new token
        const newToken = await this.getToken();
        headers.Authorization = `Bearer ${newToken}`;
        response = await fetch(`${this.baseURL}${endpoint}`, {
          ...options,
          headers,
        });
      } else {
        // Refresh failed, clear tokens and redirect to login
        await this.clearTokens();
        throw new Error('Session expired. Please login again.');
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  // Auth methods
  async register(name: string, email: string, password: string) {
    const result = await this.request<{
      user: { id: string; name: string; email: string; avatarUrl: string | null };
      tokens: { accessToken: string; refreshToken: string };
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });

    if (result.success && result.data) {
      await this.setTokens(result.data.tokens.accessToken, result.data.tokens.refreshToken);
      return result.data;
    }

    throw new Error(result.message || 'Registration failed');
  }

  async login(email: string, password: string) {
    const result = await this.request<{
      user: { id: string; name: string; email: string; avatarUrl: string | null };
      tokens: { accessToken: string; refreshToken: string };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (result.success && result.data) {
      await this.setTokens(result.data.tokens.accessToken, result.data.tokens.refreshToken);
      return result.data;
    }

    throw new Error(result.message || 'Login failed');
  }

  async logout() {
    const refreshToken = await this.getRefreshToken();
    if (refreshToken) {
      try {
        await this.request('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    await this.clearTokens();
  }

  // Meal methods
  async createMeal(mealData: {
    title: string;
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    date: string;
    calories?: number;
    imageUri: string;
  }) {
    // First, upload image to Cloudinary via backend
    const formData = new FormData();
    formData.append('image', {
      uri: mealData.imageUri,
      type: 'image/jpeg',
      name: 'meal.jpg',
    } as any);
    formData.append('title', mealData.title);
    formData.append('type', mealData.type);
    formData.append('date', new Date(mealData.date).toISOString());
    if (mealData.calories) {
      formData.append('calories', mealData.calories.toString());
    }

    const token = await this.getToken();
    const response = await fetch(`${this.baseURL}/meals`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create meal' }));
      throw new Error(error.message || 'Failed to create meal');
    }

    return response.json();
  }

  async getMeals(page: number = 1, limit: number = 20) {
    return this.request<{
      meals: Array<{
        id: string;
        title: string;
        type: string;
        date: string;
        calories?: number;
        imageUrl: string;
        createdAt: string;
        updatedAt: string;
      }>;
      pagination: { page: number; limit: number; total: number; pages: number };
    }>(`/meals?page=${page}&limit=${limit}`);
  }

  async deleteMeal(mealId: string) {
    return this.request(`/meals/${mealId}`, { method: 'DELETE' });
  }

  // Profile methods
  async getProfile() {
    return this.request<{
      user: { id: string; name: string; email: string; avatarUrl: string | null };
    }>('/profile');
  }

  async updateProfile(name?: string, avatarUri?: string) {
    const formData = new FormData();
    if (name) formData.append('name', name);
    if (avatarUri) {
      formData.append('avatar', {
        uri: avatarUri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      } as any);
    }

    const token = await this.getToken();
    const response = await fetch(`${this.baseURL}/profile`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to update profile' }));
      throw new Error(error.message || 'Failed to update profile');
    }

    return response.json();
  }

  // Settings methods
  async getSettings() {
    return this.request<{
      settings: {
        darkMode: boolean;
        reminders: Array<{ time: string; enabled: boolean; mealType?: string }>;
        notificationPermission: boolean;
      };
    }>('/settings');
  }

  async updateSettings(settings: {
    darkMode?: boolean;
    reminders?: Array<{ time: string; enabled: boolean; mealType?: string }>;
    notificationPermission?: boolean;
  }) {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Reminder methods
  async getReminders() {
    return this.request<{
      reminders: Array<{
        id: string;
        title: string;
        mealType?: string;
        hour: number;
        minute: number;
        enabled: boolean;
      }>;
    }>('/reminders');
  }

  async createReminder(reminder: {
    title: string;
    mealType?: string;
    hour: number;
    minute: number;
    enabled?: boolean;
  }) {
    return this.request('/reminders', {
      method: 'POST',
      body: JSON.stringify(reminder),
    });
  }

  async deleteReminder(reminderId: string) {
    return this.request(`/reminders/${reminderId}`, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
```

## Step 3: Update AuthContext

Replace `contexts/AuthContext.tsx`:

```typescript
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      setIsLoading(true);
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          // Verify token by fetching profile
          const result = await api.getProfile();
          if (result.success && result.data) {
            setUser(result.data.user);
          } else {
            await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
          }
        }
      } catch (error) {
        console.error('Error restoring session:', error);
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await api.login(email, password);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await api.register(name, email, password);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateName = async (name: string) => {
    setIsLoading(true);
    try {
      await api.updateProfile(name);
      setUser((prev) => (prev ? { ...prev, name } : null));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
```

## Step 4: Update Meal Logging Screen

Update `app/(tabs)/meal-logging.tsx`:

**Replace the `handleSaveMeal` function (lines 52-108):**

```typescript
const handleSaveMeal = async () => {
  if (!title.trim()) {
    setError('Please enter a meal title');
    return;
  }
  if (!capturedImage) {
    setError('Please capture a meal photo');
    return;
  }

  setIsLoading(true);
  setError('');

  try {
    const result = await api.createMeal({
      title,
      type: mealType,
      date,
      calories: calories ? parseInt(calories) : undefined,
      imageUri: capturedImage,
    });

    if (result.success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Meal logged successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setTitle('');
            setMealType('breakfast');
            setDate(new Date().toISOString().split('T')[0]);
            setCalories('');
            setCapturedImage(null);
            router.push('./timeline');
          },
        },
      ]);
    }
  } catch (error: any) {
    console.error('Error saving meal:', error);
    setError(error.message || 'Failed to save meal. Please try again.');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } finally {
    setIsLoading(false);
  }
};
```

**Add import at top:**
```typescript
import { api } from '../../services/api';
```

**Remove Firebase imports:**
```typescript
// Remove these lines:
// import { auth } from '../../firebaseConfig';
// import { saveMealToFirestore } from '../../firebaseHelpers';
```

## Step 5: Update Timeline Screen

Update `app/(tabs)/timeline.tsx`:

**Replace the `loadMeals` function (lines 62-99):**

```typescript
const loadMeals = async () => {
  try {
    setIsLoading(true);

    const result = await api.getMeals(1, 50);

    if (result.success && result.data) {
      const meals: Meal[] = result.data.meals.map((meal) => ({
        id: meal.id,
        title: meal.title,
        mealType: meal.type,
        date: meal.date,
        calories: meal.calories,
        imageUri: meal.imageUrl, // Now using Cloudinary URL
        timestamp: meal.createdAt,
      }));

      setMeals(meals);
    }
  } catch (error) {
    console.error('Error loading meals:', error);
    Alert.alert('Error', 'Failed to load meals');
  } finally {
    setIsLoading(false);
    setRefreshing(false);
  }
};
```

**Replace the `deleteMeal` function (lines 131-149):**

```typescript
const deleteMeal = async (mealId: string) => {
  try {
    await api.deleteMeal(mealId);

    // Remove from local state
    const updatedMeals = meals.filter((meal) => meal.id !== mealId);
    setMeals(updatedMeals);

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Success', 'Meal deleted successfully');
  } catch (error) {
    console.error('Error deleting meal:', error);
    Alert.alert('Error', 'Failed to delete meal');
  }
};
```

**Add import:**
```typescript
import { api } from '../../services/api';
```

**Remove Firebase imports and AsyncStorage image logic:**
```typescript
// Remove:
// import { auth, db } from '../../firebaseConfig';
// import { fetchMealsFromFirestore } from '../../firebaseHelpers';
// import { doc, deleteDoc } from 'firebase/firestore';
// import * as FileSystem from 'expo-file-system';

// Remove the image enrichment logic (lines 69-84) - images are now URLs
```

## Step 6: Update Reminders Screen

Update `app/(tabs)/remainder.tsx`:

**Replace Firestore operations with API calls:**

```typescript
import { api } from '../../services/api';

// Replace useEffect (lines 50-63):
useEffect(() => {
  const loadReminders = async () => {
    try {
      setLoading(true);
      const result = await api.getReminders();
      if (result.success && result.data) {
        setReminders(result.data.reminders);
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  loadReminders();
}, []);

// Replace handleAddReminder (lines 81-107):
const handleAddReminder = async () => {
  if (!title.trim()) {
    Alert.alert('Validation Error', 'Please enter a title for the reminder.');
    return;
  }

  try {
    const result = await api.createReminder({
      title,
      mealType,
      hour: time.getHours(),
      minute: time.getMinutes(),
    });

    if (result.success) {
      await scheduleNotification(time.getHours(), time.getMinutes(), title);
      setTitle('');
      setMealType(MEAL_TYPES[0]);
      setTime(new Date());
      Alert.alert('Success', 'Reminder added and notification scheduled.');
    }
  } catch (error) {
    console.error('Error adding reminder:', error);
    Alert.alert('Error', 'Failed to add reminder.');
  }
};

// Replace handleDeleteReminder (lines 109-126):
const handleDeleteReminder = (id: string) => {
  Alert.alert('Delete Reminder', 'Are you sure you want to delete this reminder?', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: async () => {
        try {
          await api.deleteReminder(id);
          Alert.alert('Deleted', 'Reminder deleted successfully.');
        } catch (error) {
          console.error('Error deleting reminder:', error);
          Alert.alert('Error', 'Failed to delete reminder.');
        }
      },
    },
  ]);
};
```

**Remove Firebase imports:**
```typescript
// Remove:
// import { auth, db } from '../../firebaseConfig';
// import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
```

## Step 7: Update Login Screen

Update `app/(auth)/login.tsx`:

**Replace the `handleLogin` function (lines 55-103):**

```typescript
const handleLogin = async () => {
  setError('');
  if (!validateInputs()) return;

  setIsLoading(true);
  try {
    await login(email, password);

    // Store remember me preference
    if (rememberMe) {
      await AsyncStorage.setItem('rememberMe', 'true');
      await AsyncStorage.setItem('storedEmail', email);
    } else {
      await AsyncStorage.multiRemove(['rememberMe', 'storedEmail']);
    }

    Alert.alert('Success', 'Logged in successfully!');
    router.push('./(tabs)');
  } catch (error: any) {
    setError(error.message || 'Login failed. Please try again.');
    Alert.alert('Error', error.message || 'Login failed. Please try again.');
  } finally {
    setIsLoading(false);
  }
};
```

**Remove Firebase-specific code:**
```typescript
// Remove:
// import { auth } from '../../firebaseConfig';
// const user = auth.currentUser;
// const token = await user.getIdToken();
```

## Step 8: Environment Configuration

Add to `app.json` or create `.env`:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://localhost:4000/api/v1"
    }
  }
}
```

Or use environment variable:
```bash
EXPO_PUBLIC_API_URL=http://localhost:4000/api/v1
```

For production, use your deployed server URL:
```bash
EXPO_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

## Step 9: Remove Firebase Dependencies (Optional)

After migration is complete and tested:

```bash
npm uninstall firebase
```

Remove `firebaseConfig.ts` and `firebaseHelpers.ts` files.

## Testing Checklist

- [ ] User can register
- [ ] User can login
- [ ] User can logout
- [ ] Token refresh works automatically
- [ ] User can create meal with image
- [ ] User can view meals in timeline
- [ ] User can delete meal
- [ ] User can update profile
- [ ] User can manage settings
- [ ] User can create/delete reminders
- [ ] Offline handling works (if implemented)

## Troubleshooting

### CORS Errors

Ensure your server CORS_ORIGINS includes your Expo dev server URL:
```
CORS_ORIGINS=http://localhost:3000,http://localhost:8081,exp://localhost:8081
```

### Network Errors

- Verify server is running: `http://localhost:4000/api/v1/health`
- Check API_BASE_URL in api.ts
- For physical device, use your computer's IP: `http://192.168.1.X:4000`

### Image Upload Issues

- Ensure FormData is properly formatted
- Check file size limits (10MB max)
- Verify Cloudinary credentials

### Token Expiration

The API client automatically refreshes tokens. If you see 401 errors:
- Check JWT_SECRET is set correctly
- Verify token storage in AsyncStorage
- Check token expiration times

## Next Steps

1. Test all functionality thoroughly
2. Implement offline queue for meal creation
3. Add error boundaries for better error handling
4. Add loading states and skeletons
5. Implement pull-to-refresh on timeline
6. Add optimistic updates for better UX

