import AsyncStorage from '@react-native-async-storage/async-storage';
import { isOnline } from '../utils/network';
import { OfflineQueue } from './offlineQueue';
import { CachedMeal, OfflineStorage } from './offlineStorage';

const API_BASE_URL = 'https://mea-logger.vercel.app/api/v1';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('accessToken');
  }

  private async getRefreshToken(): Promise<string | null> {
    return await AsyncStorage.getItem('refreshToken');
  }

  private async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await AsyncStorage.multiSet([
      ['accessToken', accessToken],
      ['refreshToken', refreshToken],
    ]);
  }

  private async clearTokens(): Promise<void> {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
  }

  private async refreshAccessToken(): Promise<boolean> {
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) return false;

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const result: ApiResponse<{ tokens: { accessToken: string; refreshToken: string } }> =
        await response.json();

      if (result.success && result.data) {
        await this.setTokens(result.data.tokens.accessToken, result.data.tokens.refreshToken);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    skipOfflineCheck: boolean = false
  ): Promise<ApiResponse<T>> {
    // Check if we're online (skip for auth requests)
    const online = skipOfflineCheck || await isOnline();
    
    if (!online && !skipOfflineCheck) {
      // Queue the request for later
      await OfflineQueue.enqueue({
        type: this.getRequestType(endpoint, options.method || 'GET'),
        endpoint,
        method: options.method || 'GET',
        data: options.body ? JSON.parse(options.body as string) : undefined,
      });
      throw new Error('No internet connection. Request queued for sync.');
    }

    const token = await this.getToken();
    const url = `${this.baseURL}${endpoint}`;
    console.log('API Request:', { method: options.method || 'GET', url, hasToken: !!token });
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    try {
      let response = await fetch(url, {
        ...options,
        headers,
      });
      
      console.log('API Response:', { status: response.status, statusText: response.statusText, url });

      if (response.status === 401) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          const newToken = await this.getToken();
          const retryHeaders: HeadersInit = {
            ...(headers as Record<string, string>),
            Authorization: `Bearer ${newToken}`,
          };
          response = await fetch(`${this.baseURL}${endpoint}`, {
            ...options,
            headers: retryHeaders,
          });
        } else {
          await this.clearTokens();
          throw new Error('Session expired. Please login again.');
        }
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || `Request failed with status ${response.status}`);
      }

      try {
        const text = await response.text();
        if (!text || text.trim() === '') {
          return { success: true } as ApiResponse<T>;
        }
        const json = JSON.parse(text);
        return json;
      } catch (parseError) {
        if (response.status >= 200 && response.status < 300) {
          return { success: true } as ApiResponse<T>;
        }
        throw new Error('Failed to parse response');
      }
    } catch (error: any) {
      // If it's a network error and not already queued, queue it
      if (!online && error.message !== 'No internet connection. Request queued for sync.') {
        await OfflineQueue.enqueue({
          type: this.getRequestType(endpoint, options.method || 'GET'),
          endpoint,
          method: options.method || 'GET',
          data: options.body ? JSON.parse(options.body as string) : undefined,
        });
        throw new Error('No internet connection. Request queued for sync.');
      }
      throw error;
    }
  }

  private getRequestType(endpoint: string, method: string): 'CREATE_MEAL' | 'UPDATE_MEAL' | 'DELETE_MEAL' {
    if (endpoint.includes('/meals') && method === 'POST') return 'CREATE_MEAL';
    if (endpoint.includes('/meals') && method === 'PUT') return 'UPDATE_MEAL';
    if (endpoint.includes('/meals') && method === 'DELETE') return 'DELETE_MEAL';
    return 'CREATE_MEAL'; // Default
  }

  async register(name: string, email: string, password: string) {
    const result = await this.request<{
      user: { id: string; name: string; email: string; avatarUrl: string | null };
      tokens: { accessToken: string; refreshToken: string };
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }, true); // Skip offline check for auth

    if (result.success && result.data) {
      await this.setTokens(result.data.tokens.accessToken, result.data.tokens.refreshToken);
      return result.data;
    }

    throw new Error(result.message || 'Registration failed');
  }

  async login(email: string, password: string) {
    const result = await this.request<{
      user: { id: string; name: string; email: string; avatarUrl: string | null };
      tokens: { accessToken: string; refreshToken: string };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, true); // Skip offline check for auth

    if (result.success && result.data) {
      await this.setTokens(result.data.tokens.accessToken, result.data.tokens.refreshToken);
      return result.data;
    }

    throw new Error(result.message || 'Login failed');
  }

  async logout() {
    const refreshToken = await this.getRefreshToken();
    if (refreshToken) {
      try {
        await this.request('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    await this.clearTokens();
  }

  async createMeal(mealData: {
    title: string;
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    date: string;
    calories?: number;
    imageUri: string;
  }) {
    const online = await isOnline();
    
    // If offline, save to local storage and queue for sync
    if (!online) {
      const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const cachedMeal: CachedMeal = {
        _id: localId,
        localId,
        title: mealData.title,
        type: mealData.type,
        date: mealData.date,
        calories: mealData.calories,
        imageUrl: mealData.imageUri, // Store local URI temporarily
        createdAt: new Date().toISOString(),
        isLocal: true,
      };
      
      await OfflineStorage.addMeal(cachedMeal);
      await OfflineQueue.enqueue({
        type: 'CREATE_MEAL',
        endpoint: '/meals',
        method: 'POST',
        data: {
          ...mealData,
          localId,
        },
      });
      
      return {
        success: true,
        data: {
          meal: cachedMeal,
        },
        message: 'Meal saved offline. Will sync when connection is restored.',
      };
    }

    // Online: proceed with normal upload
    const formData = new FormData();
    
    const isWeb = typeof window !== 'undefined';
    
    if (isWeb) {
      try {
        const imageResponse = await fetch(mealData.imageUri);
        const blob = await imageResponse.blob();
        const file = new File([blob], 'meal.jpg', { type: 'image/jpeg' });
        formData.append('image', file);
      } catch (error) {
        console.error('Error converting image to blob:', error);
        throw new Error('Failed to process image. Please try again.');
      }
    } else {
      formData.append('image', {
        uri: mealData.imageUri,
        type: 'image/jpeg',
        name: 'meal.jpg',
      } as any);
    }
    
    formData.append('title', mealData.title);
    formData.append('type', mealData.type);
    formData.append('date', new Date(mealData.date).toISOString());
    if (mealData.calories) {
      formData.append('calories', mealData.calories.toString());
    }

    const token = await this.getToken();
    if (!token) {
      throw new Error('Not authenticated. Please login again.');
    }

    try {
      // Add timeout to fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      let response;
      try {
        // For FormData, don't set Content-Type - let fetch set it with boundary
        const headers: HeadersInit = {
          Authorization: `Bearer ${token}`,
        };
        
        // Only set Content-Type for non-FormData requests
        // FormData will automatically set Content-Type with boundary
        
        response = await fetch(`${this.baseURL}/meals`, {
          method: 'POST',
          headers,
          body: formData,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        console.error('Fetch error details:', {
          message: fetchError.message,
          name: fetchError.name,
          stack: fetchError.stack,
        });
        // Re-throw to be caught by outer catch block
        throw fetchError;
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to create meal' }));
        throw new Error(error.message || 'Failed to create meal');
      }

      const result = await response.json();
      
      // Cache the meal
      if (result.success && result.data?.meal) {
        const meal = result.data.meal;
        const cachedMeal: CachedMeal = {
          _id: meal._id || meal.id,
          title: meal.title,
          type: meal.type,
          date: meal.date,
          calories: meal.calories,
          imageUrl: meal.imageUrl,
          createdAt: meal.createdAt,
          updatedAt: meal.updatedAt,
          isLocal: false,
        };
        await OfflineStorage.addMeal(cachedMeal);
      }
      
      return result;
    } catch (error: any) {
      console.error('Create meal API error:', error);
      
      // Check if it's a network error (various error types and messages)
      const errorMessage = error?.message?.toLowerCase() || '';
      const errorName = error?.name?.toLowerCase() || '';
      const isNetworkError = 
        errorMessage.includes('network') ||
        errorMessage.includes('fetch') ||
        errorMessage.includes('failed') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('request failed') ||
        errorName === 'typeerror' ||
        errorName === 'networkerror' ||
        error instanceof TypeError ||
        !error.response;
      
      // If network error, save offline
      if (isNetworkError) {
        console.log('Network error detected, saving meal offline...');
        try {
          const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const cachedMeal: CachedMeal = {
            _id: localId,
            localId,
            title: mealData.title,
            type: mealData.type,
            date: mealData.date,
            calories: mealData.calories,
            imageUrl: mealData.imageUri,
            createdAt: new Date().toISOString(),
            isLocal: true,
          };
          
          await OfflineStorage.addMeal(cachedMeal);
          await OfflineQueue.enqueue({
            type: 'CREATE_MEAL',
            endpoint: '/meals',
            method: 'POST',
            data: {
              ...mealData,
              localId,
            },
          });
          
          return {
            success: true,
            data: {
              meal: cachedMeal,
            },
            message: 'Meal saved offline. Will sync when connection is restored.',
          };
        } catch (offlineError) {
          console.error('Error saving meal offline:', offlineError);
          throw new Error('Failed to save meal. Please check your connection and try again.');
        }
      }
      
      throw error;
    }
  }

  async getMeals(page: number = 1, limit: number = 50) {
    const online = await isOnline();
    
    // Try to get from cache first
    const cachedMeals = await OfflineStorage.getMeals();
    
    // If offline, return cached meals
    if (!online) {
      return {
        success: true,
        data: {
          meals: cachedMeals,
          pagination: {
            page,
            limit,
            total: cachedMeals.length,
            pages: Math.ceil(cachedMeals.length / limit),
          },
        },
      };
    }
    
    // Online: fetch from server
    try {
      const result = await this.request<{
        meals: Array<{
          _id: string;
          id?: string;
          title: string;
          type: string;
          date: string;
          calories?: number;
          imageUrl: string;
          createdAt: string;
          updatedAt: string;
        }>;
        pagination: { page: number; limit: number; total: number; pages: number };
      }>(`/meals?page=${page}&limit=${limit}`);
      
      // Update cache with fresh data
      if (result.success && result.data?.meals) {
        const mealsToCache: CachedMeal[] = result.data.meals.map(meal => ({
          _id: meal._id || meal.id || '',
          title: meal.title,
          type: meal.type,
          date: meal.date,
          calories: meal.calories,
          imageUrl: meal.imageUrl,
          createdAt: meal.createdAt,
          updatedAt: meal.updatedAt,
          isLocal: false,
        }));
        
        // Merge with offline meals
        const offlineMeals = await OfflineStorage.getOfflineMeals();
        await OfflineStorage.saveMeals([...mealsToCache, ...offlineMeals]);
      }
      
      return result;
    } catch (error) {
      // If request fails, return cached meals
      if (cachedMeals.length > 0) {
        return {
          success: true,
          data: {
            meals: cachedMeals,
            pagination: {
              page,
              limit,
              total: cachedMeals.length,
              pages: Math.ceil(cachedMeals.length / limit),
            },
          },
        };
      }
      throw error;
    }
  }

  async getMeal(mealId: string) {
    return this.request<{
      meal: {
        _id: string;
        title: string;
        type: string;
        date: string;
        calories?: number;
        imageUrl: string;
        createdAt: string;
        updatedAt: string;
      };
    }>(`/meals/${mealId}`);
  }

  async updateMeal(mealId: string, mealData: {
    title?: string;
    type?: string;
    date?: string;
    calories?: number;
  }) {
    return this.request(`/meals/${mealId}`, {
      method: 'PUT',
      body: JSON.stringify(mealData),
    });
  }

  async deleteMeal(mealId: string) {
    console.log('deleteMeal called with mealId:', mealId);
    const online = await isOnline();
    
    // Remove from cache immediately (optimistic update)
    await OfflineStorage.removeMeal(mealId);
    
    if (!online) {
      // Queue for deletion when online
      await OfflineQueue.enqueue({
        type: 'DELETE_MEAL',
        endpoint: `/meals/${mealId}`,
        method: 'DELETE',
        data: { mealId },
      });
      return {
        success: true,
        message: 'Meal deleted. Will sync when connection is restored.',
      };
    }
    
    try {
      const result = await this.request(`/meals/${mealId}`, { method: 'DELETE' });
      console.log('deleteMeal result:', result);
      return result;
    } catch (error: any) {
      // If it fails, the meal is already removed from cache
      // Queue it for deletion when online
      if (error.message.includes('fetch') || error.message.includes('network')) {
        await OfflineQueue.enqueue({
          type: 'DELETE_MEAL',
          endpoint: `/meals/${mealId}`,
          method: 'DELETE',
          data: { mealId },
        });
        return {
          success: true,
          message: 'Meal deleted. Will sync when connection is restored.',
        };
      }
      throw error;
    }
  }

  async getProfile() {
    return this.request<{
      user: { id: string; name: string; email: string; avatarUrl: string | null };
    }>('/profile');
  }

  async updateProfile(name?: string, avatarUri?: string) {
    const formData = new FormData();
    if (name) formData.append('name', name);
    if (avatarUri) {
      formData.append('avatar', {
        uri: avatarUri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      } as any);
    }

    const token = await this.getToken();
    const response = await fetch(`${this.baseURL}/profile`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to update profile' }));
      throw new Error(error.message || 'Failed to update profile');
    }

    return response.json();
  }

  async getSettings() {
    return this.request<{
      settings: {
        darkMode: boolean;
        reminders: Array<{ time: string; enabled: boolean; mealType?: string }>;
        notificationPermission: boolean;
      };
    }>('/settings');
  }

  async updateSettings(settings: {
    darkMode?: boolean;
    reminders?: Array<{ time: string; enabled: boolean; mealType?: string }>;
    notificationPermission?: boolean;
  }) {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async getReminders() {
    const result = await this.request<{
      reminders: Array<{
        _id: string;
        title: string;
        mealType?: string;
        hour: number;
        minute: number;
        enabled: boolean;
      }>;
    }>('/reminders');
    
    return result;
  }

  async createReminder(reminder: {
    title: string;
    mealType?: string;
    hour: number;
    minute: number;
    enabled?: boolean;
  }) {
    return this.request('/reminders', {
      method: 'POST',
      body: JSON.stringify(reminder),
    });
  }

  async updateReminder(reminderId: string, reminder: {
    title?: string;
    mealType?: string;
    hour?: number;
    minute?: number;
    enabled?: boolean;
  }) {
    return this.request(`/reminders/${reminderId}`, {
      method: 'PUT',
      body: JSON.stringify(reminder),
    });
  }

  async deleteReminder(reminderId: string) {
    return this.request(`/reminders/${reminderId}`, { method: 'DELETE' });
  }

  // Sync offline queue when connection is restored
  async syncOfflineQueue(): Promise<{ synced: number; failed: number }> {
    const online = await isOnline();
    if (!online) {
      return { synced: 0, failed: 0 };
    }

    const queue = await OfflineQueue.getQueue();
    let synced = 0;
    let failed = 0;

    for (const request of queue) {
      try {
        if (request.type === 'CREATE_MEAL') {
          // Re-upload meal
          const mealData = request.data;
          if (mealData.imageUri) {
            const formData = new FormData();
            const isWeb = typeof window !== 'undefined';
            
            if (isWeb) {
              const imageResponse = await fetch(mealData.imageUri);
              const blob = await imageResponse.blob();
              const file = new File([blob], 'meal.jpg', { type: 'image/jpeg' });
              formData.append('image', file);
            } else {
              formData.append('image', {
                uri: mealData.imageUri,
                type: 'image/jpeg',
                name: 'meal.jpg',
              } as any);
            }
            
            formData.append('title', mealData.title);
            formData.append('type', mealData.type);
            formData.append('date', new Date(mealData.date).toISOString());
            if (mealData.calories) {
              formData.append('calories', mealData.calories.toString());
            }

            const token = await this.getToken();
            if (token) {
              const response = await fetch(`${this.baseURL}/meals`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                body: formData,
              });

              if (response.ok) {
                const result = await response.json();
                // Update local meal with server ID
                if (mealData.localId && result.data?.meal) {
                  await OfflineStorage.removeMeal(mealData.localId);
                  const cachedMeal: CachedMeal = {
                    _id: result.data.meal._id || result.data.meal.id,
                    title: result.data.meal.title,
                    type: result.data.meal.type,
                    date: result.data.meal.date,
                    calories: result.data.meal.calories,
                    imageUrl: result.data.meal.imageUrl,
                    createdAt: result.data.meal.createdAt,
                    updatedAt: result.data.meal.updatedAt,
                    isLocal: false,
                  };
                  await OfflineStorage.addMeal(cachedMeal);
                }
                await OfflineQueue.dequeue(request.id);
                synced++;
              } else {
                const shouldRetry = await OfflineQueue.incrementRetry(request.id);
                if (!shouldRetry) failed++;
              }
            }
          }
        } else if (request.type === 'DELETE_MEAL') {
          const result = await this.request(request.endpoint, { method: 'DELETE' });
          if (result.success) {
            await OfflineQueue.dequeue(request.id);
            synced++;
          } else {
            const shouldRetry = await OfflineQueue.incrementRetry(request.id);
            if (!shouldRetry) failed++;
          }
        }
      } catch (error) {
        console.error('Error syncing request:', error);
        const shouldRetry = await OfflineQueue.incrementRetry(request.id);
        if (!shouldRetry) failed++;
      }
    }

    return { synced, failed };
  }
}

export const api = new ApiClient();

