import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface StreakTrackerProps {
  streak: number;
  todayMeals: number;
}

export default function StreakTracker({ streak, todayMeals }: StreakTrackerProps) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [streak]);

  const progress = Math.min(streak / 7, 1);

  return (
    <Animated.View
      className="bg-white rounded-2xl shadow-md px-6 py-6 mx-5 mb-6"
      style={{
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim,
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pl-6">
          <View className="flex-row items-center mb-2">
            <Ionicons name="flame" size={28} color={colors.warning} />
            <Text
              className="text-5xl font-bold ml-3 tracking-tight"
              style={{ color: colors.textPrimary }}
            >
              {streak}
            </Text>
          </View>
          <Text
            className="text-sm font-semibold mb-1"
            style={{ color: colors.textSecondary }}
          >
            Day Streak
          </Text>
          {todayMeals > 0 && (
            <Text
              className="text-xs leading-snug"
              style={{ color: colors.textSecondary }}
            >
              {todayMeals} meal{todayMeals > 1 ? 's' : ''} logged today
            </Text>
          )}
        </View>

        <View style={{ width: 100, height: 100, alignItems: 'center', justifyContent: 'center' }}>
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              borderWidth: 6,
              borderColor: `${colors.warning}20`,
              position: 'absolute',
            }}
          />
          {streak > 0 && (
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                borderWidth: 6,
                borderColor: colors.warning,
                borderTopColor: progress > 0.5 ? colors.warning : 'transparent',
                borderRightColor: progress > 0.25 ? colors.warning : 'transparent',
                borderBottomColor: progress > 0.75 ? colors.warning : 'transparent',
                borderLeftColor: progress > 0 ? colors.warning : 'transparent',
                position: 'absolute',
                transform: [{ rotate: '-90deg' }],
              }}
            />
          )}
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: `${colors.warning}10`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {streak > 0 ? (
              <Ionicons name="checkmark-circle" size={32} color={colors.success} />
            ) : (
              <Ionicons name="flame-outline" size={28} color={colors.warning} />
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

