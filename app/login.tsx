import { Text, View } from 'react-native'
import React from 'react'
import { Link } from 'expo-router'

const backPage = () => {
  return (
    <View className='min-h-screen flex-col flex justify-center items-center'>
      <Text className='text-center'>Login Page</Text>
      <Link className="text-blue-700" href="./signup">Sign Up</Link>
    </View>
  )
}

export default backPage
