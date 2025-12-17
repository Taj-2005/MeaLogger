# MealLogger

A modern, full-stack meal tracking application built with React Native (Expo) and Node.js. Track your meals effortlessly with photo-based logging, daily reminders, and streak tracking.

## Features

### Core Features
- 📸 **Photo-based Meal Logging** - Capture and log meals with your camera
- 📊 **Meal Timeline** - View your meal history in a beautiful timeline
- 🔥 **Streak Tracking** - Build daily meal logging streaks
- 🔔 **Smart Reminders** - Set reminders to stay consistent
- 📱 **Cross-Platform** - Works on iOS, Android, and Web
- ☁️ **Cloud Sync** - All data synced to the cloud
- 🎨 **Modern UI** - Clean, minimal, premium design with NativeWind

### Authentication & Security
- 🔐 Secure JWT-based authentication
- 🔄 Automatic token refresh
- 👤 User profiles with avatar support
- ⚙️ Customizable settings

## Tech Stack

### Frontend
- **Framework**: React Native (Expo)
- **Navigation**: Expo Router
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: React Context API
- **Icons**: Ionicons
- **Image Handling**: Expo Image Picker, Cloudinary
- **Notifications**: Expo Notifications
- **Storage**: AsyncStorage

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Image Storage**: Cloudinary
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate Limiting

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- MongoDB (local or Atlas)
- Cloudinary account
- iOS Simulator (for iOS) or Android Emulator (for Android)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd MeaLogger
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Set Up Backend

Navigate to the server directory and follow the backend setup:

```bash
cd server
npm install
cp .env.example .env
```

Configure your `.env` file with:
- MongoDB connection string
- Cloudinary credentials
- JWT secrets
- CORS origins

See [server/README.md](./server/README.md) for detailed backend setup instructions.

### 4. Start Backend Server

```bash
cd server
npm run dev
```

The server will run on `http://115.244.141.202:4000` (or your configured PORT).

### 5. Configure API Endpoint

The app automatically detects the correct API URL based on your platform:

- **Android Emulator**: Uses `10.0.2.2` (automatic)
- **Android Physical Device**: **Requires LAN IP configuration** (see below)
- **iOS Simulator**: Uses `localhost` (automatic)
- **Web**: Uses `localhost` (automatic)

#### For Android Physical Devices (Expo Go):

Android physical devices **cannot** access `localhost` - it refers to the device itself, not your development machine.

**To fix:**

1. Find your machine's LAN IP address:
   ```bash
   # Windows
   ipconfig
   # Look for "IPv4 Address" (e.g., 192.168.1.100)
   
   # Mac/Linux
   ifconfig
   # Look for "inet" under en0 or wlan0 (e.g., 192.168.1.100)
   ```

2. Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```

3. Add your LAN IP to `.env`:
   ```env
   EXPO_PUBLIC_LAN_IP=192.168.1.100
   ```

4. Restart Expo server:
   ```bash
   npm start
   ```

#### For Production:

Set the full API URL in `.env`:
```env
EXPO_PUBLIC_API_BASE_URL=https://your-backend.vercel.app
```

This overrides all platform-specific logic.

## Running the App

### Development Mode

```bash
# Start Expo development server
npm start

# Or run on specific platform
npm run ios      # iOS Simulator
npm run android  # Android Emulator
npm run web      # Web browser
```

### Build for Production

```bash
# iOS
expo build:ios

# Android
expo build:android

# Web
expo build:web
```

## Project Structure

```
MeaLogger/
├── app/                      # Expo Router app directory
│   ├── (auth)/              # Authentication screens
│   │   ├── index.tsx        # Landing/Onboarding screen
│   │   ├── login.tsx        # Login screen
│   │   └── signup.tsx       # Sign up screen
│   ├── (tabs)/              # Main app screens (tab navigation)
│   │   ├── index.tsx        # Home/Dashboard
│   │   ├── timeline.tsx     # Meal timeline
│   │   ├── meal-logging.tsx # Add meal screen
│   │   ├── remainder.tsx    # Reminders screen
│   │   ├── settings.tsx     # Settings screen
│   │   └── profile.tsx      # Profile screen
│   ├── components/          # Reusable components
│   │   ├── GreetingHeader.tsx
│   │   ├── StreakTracker.tsx
│   │   ├── QuickActions.tsx
│   │   ├── TodaySummary.tsx
│   │   ├── MealCard.tsx
│   │   └── PrimaryButton.tsx
│   └── _layout.tsx          # Root layout
├── contexts/                # React Context providers
│   ├── AuthContext.tsx      # Authentication state
│   └── ThemeContext.tsx     # Theme/colors
├── services/                # API services
│   └── api.ts               # API client
├── utils/                   # Utility functions
│   └── notifications.ts     # Notification helpers
├── assets/                  # Images, fonts, etc.
├── server/                  # Backend API (see server/README.md)
├── app.json                 # Expo configuration
├── package.json             # Frontend dependencies
└── README.md                # This file
```

## Environment Variables

### Frontend
No environment variables required for frontend. API URL is configured in `services/api.ts`.

### Backend
See [server/README.md](./server/README.md) for backend environment variables.

## Key Features Explained

### Landing Screen
Beautiful onboarding experience that appears when users are not logged in, explaining the app's features and guiding users to sign up or log in.

### Dashboard
- Personalized greeting based on time of day
- Daily meal streak tracker
- Quick action buttons
- Today's meal summary
- Motivational messages

### Meal Logging
- Camera integration for photo capture
- Meal type selection (Breakfast, Lunch, Dinner, Snack)
- Date and calorie tracking
- Instant upload to Cloudinary

### Timeline
- Chronological view of all meals
- Image thumbnails
- Meal details and calories
- Delete functionality
- Pull-to-refresh

### Reminders
- Create custom meal reminders
- Set specific times for each meal type
- Enable/disable reminders
- Local notifications (mobile only)

### Settings
- Notification preferences
- Profile management
- App information

## API Integration

The app uses a centralized API client (`services/api.ts`) that handles:
- Authentication token management
- Automatic token refresh
- Error handling
- Request/response interceptors

All API calls are made to the backend server. See [server/README.md](./server/README.md) for API documentation.

## Notifications

### Mobile (iOS/Android)
- Local notifications for meal reminders
- Permission requests handled automatically
- Notifications scheduled based on reminder settings

### Web
- Notifications are not available on web
- Settings screen shows "Mobile only" for notification toggle

## Styling

The app uses **NativeWind** (Tailwind CSS for React Native) for styling:
- Consistent color palette
- Responsive design
- Modern, minimal UI
- Light theme only

### Color Palette
- Primary: `#4A6CF7` (Brand Blue)
- Accent: `#7C3AED` (Modern Purple)
- Success: `#10B981`
- Warning: `#F59E0B`
- Error: `#EF4444`
- Background: `#F9FAFB`
- Surface: `#FFFFFF`

## Deployment

### Frontend (Web)
Deploy to Vercel, Netlify, or any static hosting:

```bash
npm run build:web
# Deploy the web-build/ directory
```

### Mobile Apps
- **iOS**: Submit to App Store via Expo Application Services (EAS)
- **Android**: Build APK or submit to Google Play Store

### Backend
Deploy to Vercel (recommended) or any Node.js hosting. See [server/DEPLOY_VERCEL.md](./server/DEPLOY_VERCEL.md).

## Development

### Code Quality
```bash
# Lint
npm run lint

# Format (if configured)
npm run format
```

### Testing
Backend tests are in `server/src/tests/`. Frontend testing can be added as needed.

## Troubleshooting

### Common Issues

**App won't start:**
- Ensure backend server is running
- Check API URL in `services/api.ts`
- Verify all dependencies are installed

**Images not uploading:**
- Check Cloudinary credentials in backend `.env`
- Verify network connectivity
- Check image file size limits

**Notifications not working:**
- Ensure permissions are granted (mobile only)
- Check notification settings in app
- Verify reminder is enabled

**Authentication issues:**
- Check backend server is running
- Verify JWT_SECRET is set in backend
- Clear app storage and try again

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

ISC

## Support

For issues and questions:
- Open an issue in the repository
- Check [server/README.md](./server/README.md) for backend-specific questions

## Acknowledgments

Built with:
- [Expo](https://expo.dev/)
- [React Native](https://reactnative.dev/)
- [NativeWind](https://www.nativewind.dev/)
- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Cloudinary](https://cloudinary.com/)

---

**Made with ❤️ for better meal tracking**
