import { Text, View, ScrollView, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { useTheme } from '../../contexts/ThemeContext';

export default function Index() {
    const { theme, toggleTheme, isDark} = useTheme();
  return (
    <ScrollView
      contentContainerStyle={{
        paddingVertical: 60,
        paddingHorizontal: 24,
        alignItems: "center",
        backgroundColor: "#f9fafb",
        minHeight: "100%",
      }}
    >
      {/* Hero Section */}
      <View className="w-full max-w-[600px] mb-12 items-center">
        <Text className="text-4xl font-bold text-indigo-800 mb-3">
          MealLogger
        </Text>
        <Text className="text-lg text-blue-500 font-semibold mb-6 text-center">
          Track Your Meals. Master Your Health.
        </Text>
        <Text className="text-base text-gray-700 text-center leading-6 mb-8">
          MealLogger is a professional-grade app designed to help you log meals, monitor eating patterns, and improve nutrition with ease and precision.
        </Text>
        <Link
          href="/meal-logging"
          className="bg-blue-600 py-3.5 rounded-lg w-full"
        >
          <Text className="text-white font-bold text-lg text-center">
            Start Logging Your Meals
          </Text>
        </Link>
      </View>

      {/* Features Section */}
      <View className="w-full max-w-[600px] mb-12">
        <Text className="text-2xl font-semibold text-indigo-900 mb-4">
          Features
        </Text>
        <View className="ml-4">
          <Text className="text-base text-gray-600 mb-2">• Effortless meal logging with accurate timestamps</Text>
          <Text className="text-base text-gray-600 mb-2">• Organized meal history sorted by date</Text>
          <Text className="text-base text-gray-600 mb-2">• Secure authentication for privacy and data protection</Text>
          <Text className="text-base text-gray-600">• Insightful visualization of your eating patterns</Text>
        </View>
      </View>

      {/* Benefits Section */}
      <View className="w-full max-w-[600px] bg-white p-6 rounded-xl shadow mb-12">
        <Text className="text-2xl font-semibold text-indigo-900 mb-4">
          Benefits
        </Text>
        <View className="ml-4">
          <Text className="text-base text-gray-600 mb-2">• Gain clear insights into your eating habits</Text>
          <Text className="text-base text-gray-600 mb-2">• Support your wellness and nutrition goals</Text>
          <Text className="text-base text-gray-600 mb-2">• Track progress over time with confidence</Text>
          <Text className="text-base text-gray-600">• Make informed, data-driven dietary choices</Text>
        </View>
      </View>

      {/* Why Choose Us Section */}
      <View className="w-full max-w-[600px] mb-14">
        <Text className="text-2xl font-semibold text-indigo-900 mb-4 text-center">
          Why Choose MealLogger?
        </Text>
        <View className="ml-4">
          <Text className="text-base font-medium text-gray-600 mb-2 text-left">• Intuitive, fast, and reliable experience</Text>
          <Text className="text-base font-medium text-gray-600 mb-2 text-left">• Robust privacy and security measures</Text>
          <Text className="text-base font-medium text-gray-600 mb-2 text-left">• Designed to meet real-world needs</Text>
          <Text className="text-base font-medium text-gray-600 text-left">• Constantly improved based on user feedback</Text>
        </View>
      </View>

      {/* Actions */}
      <View className="w-full max-w-[400px] space-y-4">
        <Link
          href="/meal-logging"
          className="bg-blue-600 py-3.5 rounded-lg"
        >
          <Text className="text-white font-bold text-base text-center">
            Log Your First Meal
          </Text>
        </Link>
      </View>

    </ScrollView>
  );
}
