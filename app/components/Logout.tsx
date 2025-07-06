import React, { useState } from 'react';
import { TouchableOpacity, Text, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

interface LogoutButtonProps {
  style?: string;
  textStyle?: string;
  showConfirmation?: boolean;
  onLogoutStart?: () => void;
  onLogoutSuccess?: () => void;
  onLogoutError?: (error: any) => void;
}

export default function LogoutButton({ 
  style = 'bg-red-600 rounded-xl py-3 px-6 flex-row justify-center items-center',
  textStyle = 'text-white font-semibold text-center',
  showConfirmation = true,
  onLogoutStart,
  onLogoutSuccess,
  onLogoutError
}: LogoutButtonProps) {
  const { logout: authLogout } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleLogout = async (): Promise<void> => {
    if (showConfirmation) {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: performLogout,
          },
        ]
      );
    } else {
      await performLogout();
    }
  };

  const performLogout = async (): Promise<void> => {
    setIsLoading(true);
    onLogoutStart?.();
    
    try {
      await authLogout();
      Alert.alert('Success', 'Logged out successfully!');
      onLogoutSuccess?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to logout. Please try again.');
      console.error('Logout error:', error);
      onLogoutError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity 
      onPress={handleLogout}
      disabled={isLoading}
      className='bg-red-500 px-4 py-2 rounded-lg flex-row justify-center items-center mt-4'
    >
      {isLoading ? (
        <ActivityIndicator color="white" size="small" />
      ) : (
        <Text className={textStyle}>Logout</Text>
      )}
    </TouchableOpacity>
  );
}