import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { api } from '../../services/api';
import LoadingScreen from '../components/LoadingScreen';
import HeroWelcome from '../components/HeroWelcome';
import MotivationBanner from '../components/MotivationBanner';
import PrimaryActionButton from '../components/PrimaryActionButton';
import TodayActivityCard from '../components/TodayActivityCard';
import TodayMealsGrid from '../components/TodayMealsGrid';
import QuickActionsGrid from '../components/QuickActionsGrid';

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
    if (user) {
    loadDashboardData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadDashboardData = async (showLoading = true) => {
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

  const insets = useSafeAreaInsets();

  const todayMeals = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return meals
      .filter((meal: any) => {
        const mealDate = new Date(meal.date).toISOString().split('T')[0];
        return mealDate === today;
      })
      .sort((a: any, b: any) => {
        const timeA = a.time ? new Date(a.time).getTime() : new Date(a.date).getTime();
        const timeB = b.time ? new Date(b.time).getTime() : new Date(b.date).getTime();
        return timeB - timeA;
      });
  }, [meals]);

  if (loading) {
    return <LoadingScreen message="Loading your dashboard..." variant="minimal" />;
  }

  return (
    <View
      style={{ 
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          paddingBottom: Math.max(insets.bottom, 32),
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <HeroWelcome 
          streak={stats.streak}
          todayMeals={stats.todayMeals}
        />

        <MotivationBanner 
          streak={stats.streak}
          todayMeals={stats.todayMeals}
        />

        <PrimaryActionButton />

        <TodayActivityCard
          todayMeals={stats.todayMeals}
          todayCalories={stats.todayCalories}
          remindersActive={stats.remindersActive}
        />

        <TodayMealsGrid meals={todayMeals} />

        <QuickActionsGrid />
      </ScrollView>
    </View>
  );
}
