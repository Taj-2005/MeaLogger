# Repository Analysis Report - Meal Logger App

## Overview
This is an Expo React Native application (with web support) that implements a meal logging system. The app currently uses Firebase for authentication and data storage.

## Technology Stack

### Frontend
- **Framework**: Expo ~53.0.17 with React Native 0.79.5
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: React Context (AuthContext, ThemeContext)
- **Local Storage**: AsyncStorage (@react-native-async-storage/async-storage)

### Current Backend Services
- **Authentication**: Firebase Auth (email/password)
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage (configured but not actively used - images stored locally)
- **Notifications**: expo-notifications (local notifications)

### Key Dependencies
- expo-camera, expo-image-picker (image capture)
- expo-notifications (local reminders)
- expo-haptics (haptic feedback)
- firebase (auth, firestore, storage)

## Application Structure

### Entry Points
- **Mobile**: `expo-router/entry` (Expo Router entry point)
- **Web**: Same entry, served via `expo start --web`

### Navigation Structure
```
app/
├── _layout.tsx              # Root layout
├── (auth)/                  # Auth screens
│   ├── login.tsx           # Login screen (lines 1-225)
│   └── signup.tsx          # Signup screen
└── (tabs)/                  # Main app screens
    ├── _layout.tsx          # Tab navigation
    ├── index.tsx            # Home/Dashboard
    ├── meal-logging.tsx     # Meal entry form (lines 1-245)
    ├── timeline.tsx         # Meal timeline view (lines 1-323)
    ├── profile.tsx          # User profile
    ├── remainder.tsx        # Reminders management (lines 1-263)
    └── settings.tsx         # App settings (lines 1-278)
```

## Current Data Flow

### Authentication Flow
**File**: `contexts/AuthContext.tsx` (lines 1-144)
- Uses Firebase `signInWithEmailAndPassword` and `createUserWithEmailAndPassword`
- Stores "remember me" credentials in AsyncStorage (lines 76-80)
- Listens to `onAuthStateChanged` for auth state
- User object: Firebase User with `email`, `displayName`, `uid`

**Integration Points**:
- `app/(auth)/login.tsx` (line 61): Calls `login(email, password)`
- `app/(auth)/signup.tsx`: Calls `register(name, email, password)`
- `app/(tabs)/settings.tsx` (line 18): Calls `logout()`

### Meal Logging Flow
**File**: `app/(tabs)/meal-logging.tsx` (lines 52-108)
1. User captures image via `expo-image-picker` (line 40-49)
2. Image stored locally (URI saved in state)
3. Meal data saved to Firestore via `saveMealToFirestore()` (line 79)
4. Image URI stored in AsyncStorage with key `meal_image_${mealId}` (line 80)
5. Meal also cached locally in AsyncStorage (lines 82-85)

**Firebase Helper**: `firebaseHelpers.ts`
- `saveMealToFirestore(mealId, mealData)` - Saves to Firestore collection 'meals'
- `fetchMealsFromFirestore(userEmail)` - Queries meals by userEmail

**Meal Data Structure**:
```typescript
{
  id: string,
  title: string,
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  date: string (YYYY-MM-DD),
  calories?: number,
  timestamp: string (ISO),
  userEmail: string
}
```

### Timeline/Meal Listing Flow
**File**: `app/(tabs)/timeline.tsx` (lines 62-99)
1. Fetches meals from Firestore by `userEmail` (line 67)
2. Enriches each meal with local image URI from AsyncStorage (lines 69-84)
3. Falls back to placeholder image if local image not found (line 82)
4. Sorts by timestamp descending (lines 87-89)
5. Supports pull-to-refresh (lines 101-104)

**Delete Flow** (lines 131-149):
1. Deletes from Firestore (line 134)
2. Removes image URI from AsyncStorage (line 137)
3. Updates local state

### Reminders Flow
**File**: `app/(tabs)/remainder.tsx` (lines 50-126)
- Stores reminders in Firestore collection 'reminders'
- Queries by `userEmail` (line 52)
- Schedules local notifications via `expo-notifications` (lines 65-79)
- Reminder structure: `{ title, mealType, hour, minute, userEmail }`

### Settings Flow
**File**: `app/(tabs)/settings.tsx`
- Theme toggle (local state via ThemeContext)
- Profile management (placeholder)
- Notification preferences (placeholder)
- Logout functionality (line 20-30)

## Data Layer Approach

### Current Storage Strategy
1. **Firestore**: Meal metadata, reminders, user data
2. **AsyncStorage**: 
   - Auth credentials (if "remember me")
   - Local image URIs (`meal_image_${mealId}`)
   - Cached meals array
3. **Local Filesystem**: Images stored via expo-file-system (not explicitly shown but implied)

### Offline Considerations
- Currently minimal offline support
- Images stored locally but not synced to cloud
- Firestore has offline persistence but not explicitly configured
- No conflict resolution strategy

## Integration Points for Backend Migration

### 1. Authentication Replacement
**Files to Modify**:
- `contexts/AuthContext.tsx` (lines 72-88, 90-101, 103-112)
  - Replace `signInWithEmailAndPassword` → `POST /api/v1/auth/login`
  - Replace `createUserWithEmailAndPassword` → `POST /api/v1/auth/register`
  - Replace `signOut` → `POST /api/v1/auth/logout`
  - Store JWT tokens in AsyncStorage instead of Firebase User
  - Add token refresh logic

- `app/(auth)/login.tsx` (line 61)
  - Update to use new API endpoint
  - Store `accessToken` and `refreshToken` in AsyncStorage

- `app/(auth)/signup.tsx`
  - Update to use `POST /api/v1/auth/register`

### 2. Meal Logging Replacement
**Files to Modify**:
- `app/(tabs)/meal-logging.tsx` (lines 52-108)
  - Upload image to Cloudinary first (via backend endpoint)
  - Replace `saveMealToFirestore` → `POST /api/v1/meals` with imageUrl
  - Remove AsyncStorage image storage (images now in Cloudinary)

- `firebaseHelpers.ts`
  - Replace with API service functions:
    - `uploadMealImage(imageUri)` → `POST /api/v1/meals/upload` or direct Cloudinary
    - `saveMeal(mealData)` → `POST /api/v1/meals`

### 3. Timeline Replacement
**Files to Modify**:
- `app/(tabs)/timeline.tsx` (lines 62-99)
  - Replace `fetchMealsFromFirestore` → `GET /api/v1/meals?limit=20&page=1`
  - Remove AsyncStorage image lookup (images now in Cloudinary URLs)
  - Update delete to use `DELETE /api/v1/meals/:id`

### 4. Reminders Replacement
**Files to Modify**:
- `app/(tabs)/remainder.tsx` (lines 50-126)
  - Replace Firestore operations with:
    - `GET /api/v1/reminders`
    - `POST /api/v1/reminders`
    - `DELETE /api/v1/reminders/:id`
  - Keep local notification scheduling (expo-notifications)

### 5. Profile & Settings Replacement
**Files to Modify**:
- `app/(tabs)/profile.tsx`
  - `GET /api/v1/profile`
  - `PUT /api/v1/profile`
  - Avatar upload via `POST /api/v1/profile/avatar`

- `app/(tabs)/settings.tsx`
  - `GET /api/v1/settings`
  - `PUT /api/v1/settings`

## API Client Setup Recommendation

Create a new file: `services/api.ts`
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

class ApiClient {
  private async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('accessToken');
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const token = await this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Try refresh token
      await this.refreshToken();
      return this.request(endpoint, options);
    }

    return response.json();
  }

  // Implement auth methods, meal methods, etc.
}

export const api = new ApiClient();
```

## Assumptions & Recommendations

1. **Image Upload Strategy**: 
   - Current: Images stored locally, only URIs in Firestore
   - Recommended: Upload to Cloudinary via backend, store Cloudinary URL in MongoDB
   - Client should upload image first, then create meal with returned URL

2. **Offline Support**:
   - Implement queue system in AsyncStorage for offline actions
   - Sync when online using `POST /api/v1/meals/bulk`
   - Use `updatedAt` timestamps for conflict resolution

3. **Token Management**:
   - Store `accessToken` and `refreshToken` in AsyncStorage
   - Implement automatic token refresh before expiry
   - Clear tokens on logout

4. **Error Handling**:
   - Add retry logic for network failures
   - Show user-friendly error messages
   - Handle 401/403 errors with re-authentication flow

5. **Environment Variables**:
   - Add `EXPO_PUBLIC_API_URL` for API base URL
   - Keep sensitive keys server-side only

## File Paths Summary

| Component | File Path | Key Lines |
|-----------|-----------|-----------|
| Auth Context | `contexts/AuthContext.tsx` | 72-144 |
| Login Screen | `app/(auth)/login.tsx` | 55-103 |
| Meal Logging | `app/(tabs)/meal-logging.tsx` | 52-108 |
| Timeline | `app/(tabs)/timeline.tsx` | 62-149 |
| Reminders | `app/(tabs)/remainder.tsx` | 50-126 |
| Settings | `app/(tabs)/settings.tsx` | 20-30 |
| Firebase Helpers | `firebaseHelpers.ts` | 8-17 |
| Firebase Config | `firebaseConfig.ts` | 1-20 |

