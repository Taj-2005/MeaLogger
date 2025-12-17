import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { api } from '../../services/api';
import GreetingHeader from '../components/GreetingHeader';
import MotivationBanner from '../components/MotivationBanner';
import QuickActions from '../components/QuickActions';
import StreakTracker from '../components/StreakTracker';
import TodaySummary from '../components/TodaySummary';

export default function Dashboard() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [meals, setMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    todayMeals: 0,
    todayCalories: 0,
    totalMeals: 0,
    streak: 0,
    remindersActive: true,
  });

  useEffect(() => {
    // Only load data if user is authenticated
    if (user) {
      loadDashboardData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadDashboardData = async (showLoading = true) => {
    // Don't load if user is not authenticated
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (showLoading) setLoading(true);

      const result = await api.getMeals(1, 50);
      if (result.success && result.data) {
        const mealsData = result.data.meals || [];
        setMeals(mealsData);

        const today = new Date().toISOString().split('T')[0];
        const todayMeals = mealsData.filter(
          (meal: any) => new Date(meal.date).toISOString().split('T')[0] === today
        );
        const todayCalories = todayMeals.reduce(
          (sum: number, meal: any) => sum + (meal.calories || 0),
          0
        );

        const streak = calculateStreak(mealsData);

        const remindersResult = await api.getReminders().catch(() => null);
        const remindersActive = remindersResult?.success && 
          remindersResult?.data?.reminders && 
          remindersResult.data.reminders.length > 0;

        setStats({
          todayMeals: todayMeals.length,
          todayCalories,
          totalMeals: mealsData.length,
          streak,
          remindersActive: remindersActive || false,
        });
      }
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      // If it's an authentication error, the ProtectedRoute should handle navigation
      // But we'll still log it for debugging
      if (error?.message?.includes('Session expired') || error?.message?.includes('401')) {
        console.error('Authentication error in dashboard - user should be redirected to login');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStreak = (meals: any[]): number => {
    if (meals.length === 0) return 0;

    const mealDates = new Set(
      meals.map((meal) => new Date(meal.date).toISOString().split('T')[0])
    );
    const sortedDates = Array.from(mealDates).sort().reverse();

    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let currentDate = new Date(today);

    for (const dateStr of sortedDates) {
      const date = new Date(dateStr);
      const daysDiff = Math.floor(
        (currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === streak) {
        streak++;
        currentDate = new Date(date);
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboardData(false);
  }, []);

  if (loading) {
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <GreetingHeader />

        <StreakTracker 
          streak={stats.streak} 
          todayMeals={stats.todayMeals}
        />

        <MotivationBanner 
          streak={stats.streak}
          todayMeals={stats.todayMeals}
        />

        <QuickActions />

        <TodaySummary
          todayMeals={stats.todayMeals}
          todayCalories={stats.todayCalories}
          remindersActive={stats.remindersActive}
        />
      </ScrollView>
    </View>
  );
}
