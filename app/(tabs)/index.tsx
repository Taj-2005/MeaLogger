import { Text, View, ScrollView, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import LogoutComponent from "../components/Logout";

export default function Index() {
  return (
    <ScrollView
      contentContainerStyle={{
        paddingVertical: 40,
        paddingHorizontal: 24,
        alignItems: "center",
        backgroundColor: "#f9fafb",
        minHeight: "100%",
      }}
    >
      {/* Hero Section */}
      <View style={{ maxWidth: 600, width: "100%", marginBottom: 48, alignItems: "center" }}>
        <Text
          style={{
            fontSize: 36,
            fontWeight: "700",
            color: "#1e3a8a", // Indigo-800
            marginBottom: 12,
          }}
        >
          MealLogger
        </Text>
        <Text
          style={{
            fontSize: 18,
            color: "#3b82f6", // Blue-500
            fontWeight: "600",
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          Track Your Meals. Master Your Health.
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: "#374151", // Gray-700
            textAlign: "center",
            lineHeight: 22,
            marginBottom: 32,
          }}
        >
          MealLogger is a professional-grade app designed to help you log meals, monitor eating patterns, and improve nutrition with ease and precision.
        </Text>
        <Link
          href="/meal-logging"
          style={{
            backgroundColor: "#2563eb", // Blue-600
            paddingVertical: 14,
            borderRadius: 8,
            width: "100%",
          }}
        >
          <Text
            style={{
              color: "#ffffff",
              fontWeight: "700",
              fontSize: 18,
              textAlign: "center",
            }}
          >
            Start Logging Your Meals
          </Text>
        </Link>
      </View>

      {/* Features Section */}
      <View style={{ maxWidth: 600, width: "100%", marginBottom: 48 }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "600",
            color: "#1e40af", // Indigo-900
            marginBottom: 16,
          }}
        >
          Features
        </Text>
        <View style={{ marginLeft: 16 }}>
          <Text style={{ fontSize: 16, color: "#4b5563", marginBottom: 8 }}>
            • Effortless meal logging with accurate timestamps
          </Text>
          <Text style={{ fontSize: 16, color: "#4b5563", marginBottom: 8 }}>
            • Organized meal history sorted by date
          </Text>
          <Text style={{ fontSize: 16, color: "#4b5563", marginBottom: 8 }}>
            • Secure authentication for privacy and data protection
          </Text>
          <Text style={{ fontSize: 16, color: "#4b5563" }}>
            • Insightful visualization of your eating patterns
          </Text>
        </View>
      </View>

      {/* Benefits Section */}
      <View
        style={{
          maxWidth: 600,
          width: "100%",
          backgroundColor: "#ffffff",
          padding: 24,
          borderRadius: 12,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 5 },
          marginBottom: 48,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "600",
            color: "#1e40af",
            marginBottom: 16,
          }}
        >
          Benefits
        </Text>
        <View style={{ marginLeft: 16 }}>
          <Text style={{ fontSize: 16, color: "#4b5563", marginBottom: 8 }}>
            • Gain clear insights into your eating habits
          </Text>
          <Text style={{ fontSize: 16, color: "#4b5563", marginBottom: 8 }}>
            • Support your wellness and nutrition goals
          </Text>
          <Text style={{ fontSize: 16, color: "#4b5563", marginBottom: 8 }}>
            • Track progress over time with confidence
          </Text>
          <Text style={{ fontSize: 16, color: "#4b5563" }}>
            • Make informed, data-driven dietary choices
          </Text>
        </View>
      </View>

      {/* Why Choose Us Section */}
      <View style={{ maxWidth: 600, width: "100%", marginBottom: 56 }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "600",
            color: "#1e40af",
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          Why Choose MealLogger?
        </Text>
        <View style={{ marginLeft: 16 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "500",
              color: "#4b5563",
              marginBottom: 8,
              textAlign: "left",
            }}
          >
            • Intuitive, fast, and reliable experience
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "500",
              color: "#4b5563",
              marginBottom: 8,
              textAlign: "left",
            }}
          >
            • Robust privacy and security measures
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "500",
              color: "#4b5563",
              marginBottom: 8,
              textAlign: "left",
            }}
          >
            • Designed to meet real-world needs
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "500",
              color: "#4b5563",
              textAlign: "left",
            }}
          >
            • Constantly improved based on user feedback
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={{ maxWidth: 400, width: "100%", gap: 16 }}>
        <Link
          href="/meal-logging"
          style={{
            backgroundColor: "#2563eb",
            paddingVertical: 14,
            borderRadius: 8,
          }}
        >
          <Text
            style={{
              color: "white",
              fontWeight: "700",
              fontSize: 16,
              textAlign: "center",
            }}
          >
            Log Your First Meal
          </Text>
        </Link>

        <TouchableOpacity
          onPress={() => alert("More information coming soon!")}
          style={{
            paddingVertical: 14,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "#2563eb",
            backgroundColor: "white",
          }}
        >
          <Text
            style={{
              color: "#2563eb",
              fontWeight: "700",
              fontSize: 16,
              textAlign: "center",
            }}
          >
            Learn More
          </Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <View style={{ marginTop: 40, width: "100%", maxWidth: 400 }}>
        <LogoutComponent />
      </View>
    </ScrollView>
  );
}
