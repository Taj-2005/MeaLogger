import { StyleSheet, Text, View } from 'react-native'
import { Link } from 'expo-router'
import React from 'react'

const signup = () => {
  return (
    <View className='min-h-screen flex-col flex justify-center items-center'>
      <Text>Sign Up Page</Text>
      <Link className="text-blue-700" href="./login">Login</Link>
    </View>
  )
}

export default signup

const styles = StyleSheet.create({})