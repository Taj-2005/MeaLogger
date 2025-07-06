import { Text, View } from "react-native";
import { Link } from "expo-router";
import LogoutComponent from "../components/Logout";

export default function Index() {
  return (
    <View className='min-h-screen flex-col flex justify-center items-center'>
      <Text >Edit app/index.tsx to edit this screen.</Text>
      <LogoutComponent />
    </View>
  );
}
