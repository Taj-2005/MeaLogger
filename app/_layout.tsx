import * as Notifications from 'expo-notifications';
import { Slot, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { requestNotificationPermissions } from '../utils/notifications';
import LoadingScreen from './components/LoadingScreen';
import './global.css';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading) {
      const inAuthGroup = segments[0] === '(auth)';
      const inTabsGroup = segments[0] === '(tabs)';
      const currentRoute = segments[1];

      if (!isAuthenticated) {
        if (inTabsGroup) {
          router.replace('/(auth)');
        } else if (inAuthGroup && currentRoute && currentRoute !== 'login' && currentRoute !== 'signup') {
          router.replace('/(auth)');
        }
      } else if (isAuthenticated && inAuthGroup && !currentRoute) {
        router.replace('/(tabs)');
      } else if (isAuthenticated && inAuthGroup && (currentRoute === 'login' || currentRoute === 'signup')) {
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return <LoadingScreen message="Loading..." variant="splash" />;
  }

  return children;
};

function NotificationSetup() {
  useEffect(() => {
    const setupNotifications = async () => {
      if (typeof window === 'undefined') {
        await requestNotificationPermissions();
      }
    };
    setupNotifications();
  }, []);

  return null;
}


export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationSetup />
        <ProtectedRoute>
          <Slot />
        </ProtectedRoute>
      </AuthProvider>
    </ThemeProvider>
  );
}