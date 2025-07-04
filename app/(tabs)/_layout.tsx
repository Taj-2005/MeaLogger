import { Tabs } from 'expo-router';
import React from 'react'

const RootLayout= () => {
  return (
    <Tabs>
    <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
        }}
      />
    </Tabs>
  )
}

export default RootLayout;