import { Slot, useRouter, useSegments } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import './global.css';

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

      if (!isAuthenticated && inTabsGroup) {
        // Redirect to login if not authenticated and trying to access protected routes
        router.replace('/(auth)/login');
      } else if (isAuthenticated && inAuthGroup) {
        // Redirect to main app if authenticated and on auth screens
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View className='flex-1 justify-center items-center bg-gray-100'>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className='mt-4 text-gray-600'>Loading...</Text>
      </View>
    );
  }

  return children;
};

// Main App Layout
export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProtectedRoute>
          <Slot />
        </ProtectedRoute>
      </AuthProvider>
    </ThemeProvider>
  );
}