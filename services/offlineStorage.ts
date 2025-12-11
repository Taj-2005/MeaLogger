import AsyncStorage from '@react-native-async-storage/async-storage';

const MEALS_CACHE_KEY = '@meal_logger_meals_cache';
const MEALS_CACHE_TIMESTAMP_KEY = '@meal_logger_meals_cache_timestamp';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface CachedMeal {
  _id: string;
  title: string;
  type: string;
  date: string;
  calories?: number;
  imageUrl: string;
  createdAt: string;
  updatedAt?: string;
  isLocal?: boolean; // True if created offline and not yet synced
  localId?: string; // Temporary ID for offline-created meals
}

export class OfflineStorage {
  // Save meals to cache
  static async saveMeals(meals: CachedMeal[]): Promise<void> {
    try {
      await AsyncStorage.setItem(MEALS_CACHE_KEY, JSON.stringify(meals));
      await AsyncStorage.setItem(MEALS_CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.error('Error saving meals to cache:', error);
    }
  }

  // Get meals from cache
  static async getMeals(): Promise<CachedMeal[]> {
    try {
      const cached = await AsyncStorage.getItem(MEALS_CACHE_KEY);
      if (!cached) return [];
      
      const meals = JSON.parse(cached) as CachedMeal[];
      return meals;
    } catch (error) {
      console.error('Error reading meals from cache:', error);
      return [];
    }
  }

  // Check if cache is still valid
  static async isCacheValid(): Promise<boolean> {
    try {
      const timestamp = await AsyncStorage.getItem(MEALS_CACHE_TIMESTAMP_KEY);
      if (!timestamp) return false;
      
      const cacheAge = Date.now() - parseInt(timestamp, 10);
      return cacheAge < CACHE_EXPIRY_MS;
    } catch (error) {
      return false;
    }
  }

  // Add a meal to cache (for offline-created meals)
  static async addMeal(meal: CachedMeal): Promise<void> {
    try {
      const meals = await this.getMeals();
      meals.push(meal);
      await this.saveMeals(meals);
    } catch (error) {
      console.error('Error adding meal to cache:', error);
    }
  }

  // Update a meal in cache
  static async updateMeal(mealId: string, updates: Partial<CachedMeal>): Promise<void> {
    try {
      const meals = await this.getMeals();
      const index = meals.findIndex(m => m._id === mealId || m.localId === mealId);
      if (index !== -1) {
        meals[index] = { ...meals[index], ...updates };
        await this.saveMeals(meals);
      }
    } catch (error) {
      console.error('Error updating meal in cache:', error);
    }
  }

  // Remove a meal from cache
  static async removeMeal(mealId: string): Promise<void> {
    try {
      const meals = await this.getMeals();
      const filtered = meals.filter(m => m._id !== mealId && m.localId !== mealId);
      await this.saveMeals(filtered);
    } catch (error) {
      console.error('Error removing meal from cache:', error);
    }
  }

  // Clear cache
  static async clearCache(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([MEALS_CACHE_KEY, MEALS_CACHE_TIMESTAMP_KEY]);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // Get offline-created meals (not yet synced)
  static async getOfflineMeals(): Promise<CachedMeal[]> {
    try {
      const meals = await this.getMeals();
      return meals.filter(m => m.isLocal === true);
    } catch (error) {
      console.error('Error getting offline meals:', error);
      return [];
    }
  }
}
