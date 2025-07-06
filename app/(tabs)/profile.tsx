import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

interface SessionInfo {
  uid: string;
  email: string;
  displayName?: string;
  loginTime: string;
}

export default function LogoutComponent() {
  const { logout: authLogout, user, getUserSession } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);

  // Load session info when component mounts
  React.useEffect(() => {
    loadSessionInfo();
  }, []);

  const loadSessionInfo = async (): Promise<void> => {
    try {
      const session: SessionInfo = await getUserSession();
      setSessionInfo(session);
    } catch (error) {
      console.error('Error loading session info:', error);
    }
  };

  const handleLogout = async (): Promise<void> => {
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
          onPress: async () => {
            setIsLoading(true);
            try {
              await authLogout();
              Alert.alert('Success', 'Logged out successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
              console.error('Logout error:', error);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View className='flex flex-col min-h-screen justify-center items-center'>
      <View className='px-10 py-10 bg-white rounded-lg shadow-lg'>
        <Text className='text-xl font-bold text-gray-800 mb-4'>Account Information</Text>
        
        {/* User Info */}
        <View className='bg-gray-50 rounded-lg p-4 mb-4'>
          <Text className='text-sm text-gray-600 mb-1'>Name:</Text>
          <Text className='text-base font-medium text-gray-800 mb-3'>{user?.displayName}</Text>
          <Text className='text-sm text-gray-600 mb-1'>Email:</Text>
          <Text className='text-base font-medium text-gray-800 mb-3'>{user?.email}</Text>
          
          <Text className='text-sm text-gray-600 mb-1'>User ID:</Text>
          <Text className='text-base font-medium text-gray-800 mb-3'>{user?.uid}</Text>
          
          {sessionInfo && (
            <>
              <Text className='text-sm text-gray-600 mb-1'>Last Login:</Text>
              <Text className='text-base font-medium text-gray-800'>
                {new Date(sessionInfo.loginTime).toLocaleString()}
              </Text>
            </>
          )}
        </View>

        {/* Session Status */}
        <View className='bg-blue-50 rounded-lg p-4 mb-4'>
          <Text className='text-sm text-blue-600 mb-1'>Session Status:</Text>
          <Text className='text-base font-medium text-blue-800'>
            {sessionInfo ? 'Remembered Session Active' : 'Regular Session'}
          </Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          onPress={handleLogout}
          disabled={isLoading}
          className={`rounded-xl py-3 px-6 ${isLoading ? 'bg-gray-400' : 'bg-red-600'} flex-row justify-center items-center`}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text className='text-white font-semibold text-center'>Logout</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}