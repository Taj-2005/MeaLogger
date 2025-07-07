import { Text, View, ScrollView, Switch } from "react-native";
import { Link } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import SettingsButton from "../components/SettingsBtn";

export default function Index() {
  const { colors, toggleTheme, isDark } = useTheme();

  return (
    <ScrollView
      contentContainerStyle={{
        paddingVertical: 60,
        paddingHorizontal: 24,
        alignItems: "center",
        minHeight: "100%",
        backgroundColor: colors.primaryBackground, // dynamic background
      }}
    >
      <View className="flex sticky flex-col justify-end items-end w-full">
        <SettingsButton />
      </View>
      <View className="w-full max-w-[600px] mb-12 items-center">
        <Text
          className="text-4xl font-bold mb-3"
          style={{ color: colors.accent }} // dynamic text color
        >
          MealLogger
        </Text>
        <Text
          className="text-lg font-semibold mb-6 text-center"
          style={{ color: colors.icon }}
        >
          Track Your Meals. Master Your Health.
        </Text>
        <Text
          className="text-base text-center leading-6 mb-8"
          style={{ color: colors.textMuted }}
        >
          MealLogger is a professional-grade app designed to help you log meals, monitor eating
          patterns, and improve nutrition with ease and precision.
        </Text>
        <Link
          href="/meal-logging"
          className="py-3.5 rounded-lg w-full"
          style={{ backgroundColor: colors.accent }}
        >
          <Text className="text-white font-bold text-lg text-center">Start Logging Your Meals</Text>
        </Link>
      </View>

      {/* Features Section */}
      <View className="w-full max-w-[600px] mb-12">
        <Text
          className="text-2xl font-semibold mb-4"
          style={{ color: colors.accent }}
        >
          Features
        </Text>
        <View className="ml-4">
          {[
            "Effortless meal logging with accurate timestamps",
            "Organized meal history sorted by date",
            "Secure authentication for privacy and data protection",
            "Insightful visualization of your eating patterns",
          ].map((feature, i) => (
            <Text
              key={i}
              className="text-base mb-2"
              style={{ color: colors.textMuted }}
            >
              • {feature}
            </Text>
          ))}
        </View>
      </View>

      {/* Benefits Section */}
      <View
        className="w-full max-w-[600px] p-6 rounded-xl shadow mb-12"
        style={{ backgroundColor: colors.cardBackground }}
      >
        <Text
          className="text-2xl font-semibold mb-4"
          style={{ color: colors.accent }}
        >
          Benefits
        </Text>
        <View className="ml-4">
          {[
            "Gain clear insights into your eating habits",
            "Support your wellness and nutrition goals",
            "Track progress over time with confidence",
            "Make informed, data-driven dietary choices",
          ].map((benefit, i) => (
            <Text
              key={i}
              className="text-base mb-2"
              style={{ color: colors.textMuted }}
            >
              • {benefit}
            </Text>
          ))}
        </View>
      </View>

      {/* Why Choose Us Section */}
      <View className="w-full max-w-[600px] mb-14">
        <Text
          className="text-2xl font-semibold mb-4 text-center"
          style={{ color: colors.accent }}
        >
          Why Choose MealLogger?
        </Text>
        <View className="ml-4">
          {[
            "Intuitive, fast, and reliable experience",
            "Robust privacy and security measures",
            "Designed to meet real-world needs",
            "Constantly improved based on user feedback",
          ].map((reason, i) => (
            <Text
              key={i}
              className="text-base font-medium mb-2 text-left"
              style={{ color: colors.textMuted }}
            >
              • {reason}
            </Text>
          ))}
        </View>
      </View>

      {/* Actions */}
      <View className="w-full max-w-[400px] space-y-4">
        <Link
          href="/meal-logging"
          className="py-3.5 rounded-lg"
          style={{ backgroundColor: colors.accent }}
        >
          <Text className="text-white font-bold text-base text-center">
            Log Your First Meal
          </Text>
        </Link>
      </View>
    </ScrollView>
  );
}
