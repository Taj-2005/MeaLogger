import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ScrollView,
  Dimensions,
} from "react-native";
import {
  getAuth,
  updateProfile,
  updateEmail,
  sendPasswordResetEmail,
  signOut,
  User,
} from "firebase/auth";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import SettingsButton from "../components/SettingsBtn";

const windowWidth = Dimensions.get("window").width;

export default function Profile() {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const { colors } = useTheme();

  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [changed, setChanged] = useState(false);
  const [message, setMessage] = useState<
    { type: "error" | "success"; text: string } | null
  >(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
      setName(currentUser.displayName ?? "");
      setEmail(currentUser.email ?? "");
    }
  }, [currentUser]);

  useEffect(() => {
    if (message) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setMessage(null));
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  const isEmailValid = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const showMessage = (type: "error" | "success", text: string) =>
    setMessage({ type, text });

  const handleUpdateProfile = async () => {
    setMessage(null);

    if (!name.trim()) {
      showMessage("error", "Name cannot be empty");
      return;
    }
    if (!email.trim() || !isEmailValid(email)) {
      showMessage("error", "Please enter a valid email");
      return;
    }
    if (!user) {
      showMessage("error", "No authenticated user");
      return;
    }

    setLoading(true);
    try {
      if (name !== user.displayName) {
        await updateProfile(user, { displayName: name });
      }
      if (email !== user.email) {
        await updateEmail(user, email);
      }
      setUser(auth.currentUser);
      showMessage("success", "Profile updated successfully");
      setChanged(false);
    } catch (e: any) {
      console.error(e);
      showMessage("error", e.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = () => {
    if (!email) {
      showMessage("error", "Email is required to reset password");
      return;
    }
    Alert.alert(
      "Change Password",
      "A password reset email will be sent to your email address. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send Email",
          onPress: async () => {
            try {
              await sendPasswordResetEmail(auth, email);
              Alert.alert("Success", "Password reset email sent!");
            } catch (e: any) {
              console.error(e);
              Alert.alert(
                "Error",
                e.message || "Failed to send password reset email"
              );
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      Alert.alert("Logged out", "You have been logged out.");
      setUser(null);
      setName("");
      setEmail("");
    } catch (e) {
      Alert.alert("Error", "Failed to logout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const avatarText = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1"
      style={{ backgroundColor: colors.primaryBackground }}
    >
      <View className="flex sticky flex-col justify-end items-end w-full pt-10 pr-2">
        <SettingsButton />
      </View>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100%",
          padding: 24,
        }}
        keyboardShouldPersistTaps="handled"
      >

        {/* Avatar & Basic Info */}
        <View
          className={`rounded-3xl mb-8 items-center shadow-lg`}
          style={{
            backgroundColor: colors.cardBackground,
            width: windowWidth > 500 ? 480 : "100%",
            paddingVertical: 32,
            paddingHorizontal: 24,
            shadowColor: 'bg-black',
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 6,
          }}
        >
          <View
            className="rounded-full mb-5 justify-center items-center"
            style={{
              backgroundColor: colors.accent,
              width: 96,
              height: 96,
              shadowColor: 'bg-black',
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Text
              className="text-white font-extrabold"
              style={{
                fontSize: 48,
                letterSpacing: 6,
              }}
            >
              {avatarText}
            </Text>
          </View>
          <Text
            className="font-bold"
            style={{ fontSize: 28, color: colors.textPrimary }}
          >
            {name || "User"}
          </Text>
          <Text
            className="text-center mt-1"
            style={{ color: colors.textMuted, fontSize: 16 }}
          >
            {email || "No email set"}
          </Text>
        </View>

        {/* Inputs Card */}
        <View
          className={`rounded-3xl shadow-md`}
          style={{
            backgroundColor: colors.cardBackground,
            width: windowWidth > 500 ? 480 : "100%",
            paddingVertical: 28,
            paddingHorizontal: 24,
            shadowColor: 'bg-black',
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 6,
          }}
        >
          {/* Name Input */}
          <View className="mb-6">
            <Text
              className="text-sm font-semibold mb-1"
              style={{ color: colors.textMuted }}
            >
              Full Name
            </Text>
            <TextInput
              value={name}
              onChangeText={(text) => {
                setName(text);
                setChanged(true);
                setMessage(null);
              }}
              placeholder="Enter your full name"
              autoCapitalize="words"
              className="border rounded-lg px-4 py-3 text-base"
              style={{
                borderColor: colors.border,
                color: colors.textPrimary,
                backgroundColor: colors.surface,
              }}
            />
          </View>

          {/* Email Input */}
          <View className="mb-6">
            <Text
              className="text-sm font-semibold mb-1"
              style={{ color: colors.textMuted }}
            >
              Email Address
            </Text>
            <TextInput
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setChanged(true);
                setMessage(null);
              }}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              className="border rounded-lg px-4 py-3 text-base"
              style={{
                borderColor: colors.border,
                color: colors.textPrimary,
                backgroundColor: colors.surface,
              }}
            />
          </View>

          {/* Message */}
          {message && (
            <Animated.View
              style={{ opacity: fadeAnim }}
              className={`mb-5 rounded-lg py-2 px-4 ${
                message.type === "error"
                  ? "bg-red-100"
                  : "bg-green-100"
              }`}
            >
              <Text
                className={`text-center font-semibold text-sm ${
                  message.type === "error"
                    ? "text-red-700"
                    : "text-green-700"
                }`}
              >
                {message.text}
              </Text>
            </Animated.View>
          )}

          {/* Buttons */}
          <View className="space-y-4 flex flex-col gap-4">
            <TouchableOpacity
              disabled={!changed || loading}
              onPress={handleUpdateProfile}
              activeOpacity={0.8}
              className={`flex-row justify-center items-center rounded-lg py-4 ${
                !changed || loading ? "bg-gray-400" : "bg-blue-600 shadow-md"
              }`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <MaterialIcons name="update" size={20} color="white" />
                  <Text className="text-white font-semibold text-lg ml-2">
                    Update Profile
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleChangePassword}
              activeOpacity={0.8}
              className="flex-row justify-center items-center rounded-lg py-4 bg-yellow-500 shadow-md"
            >
              <Feather name="key" size={20} color="white" />
              <Text className="text-white font-semibold text-lg ml-2">
                Change Password
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogout}
              disabled={loading}
              activeOpacity={0.8}
              className={`flex-row justify-center items-center rounded-lg py-4 ${
                loading ? "bg-gray-400" : "bg-red-600 shadow-md"
              }`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <MaterialIcons name="logout" size={20} color="white" />
                  <Text className="text-white font-semibold text-lg ml-2">
                    Sign Out
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
