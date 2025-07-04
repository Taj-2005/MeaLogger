import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { Link, router } from 'expo-router';
import { auth } from '../firebaseConfig';

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setSuccess('Login successful!');
      router.push('./login');
    } catch (error : any) {
      setError(error.message);
    }
  };

  return (
    <View className='flex flex-col justify-center items-center min-h-screen gap-2'>
      <View className='flex flex-col justify-center items-center border-2 border-gray-300 gap-4 rounded-xl px-4 py-10'>
        <Text className='text-2xl font-bold pb-4'>Sign Up</Text>
        <View className='flex flex-col justify-center items-center gap-2'>
          <View className='border-2 rounded-xl w-64 border-gray-200'>
            <TextInput placeholder="Email" value={email} onChangeText={setEmail} />
          </View>
          <View className='border-2 rounded-xl w-64 border-gray-200'>
            <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
          </View>
          <View className='w-32'><Button title="Sign Up" onPress={handleRegister} /></View>
        </View>
        {error && <Text className='text-red-600'>{error}</Text>}
        {success && <Text className='text-green-600'>{success}</Text>}
        <Text>Already have an account? <Link href="./login" className='underline text-blue-700'>Login</Link></Text>
      </View>
    </View>
  );
}
