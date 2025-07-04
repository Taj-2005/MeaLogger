import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import {useRouter } from 'expo-router';
import { Link } from 'expo-router';
import { auth } from '../firebaseConfig';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setSuccess('Login successful!');
      router.push('./(tabs)');
    } catch (error : any) {
      setError(error.message);
    }
  };

  return (
    <View className='flex flex-col justify-center items-center min-h-screen'>
      <View className='flex flex-col justify-center items-center border-2 border-gray-300 gap-2 rounded-xl px-4 py-10'>
        <Text className='text-2xl font-bold pb-4'>Login</Text>
        <View className='flex flex-col justify-center items-center gap-3'>
          <View className='border-2 rounded-xl w-64 border-gray-200'>
            <TextInput placeholder="Email" value={email} onChangeText={setEmail} />
          </View>
          <View className='border-2 rounded-xl w-64 border-gray-200'>
            <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
          </View>
          <View className='w-32'><Button title="Login" onPress={handleLogin} /></View>
        </View>
        {error && <Text className='text-red-600'>{error}</Text>}
        {success && <Text className='text-green-600'>{success}</Text>}
        <Text className='pt-2'>Don't have an acount? <Link href="./signup" className='underline text-blue-700'>Sign Up</Link></Text>
      </View>
    </View>
  );
}
