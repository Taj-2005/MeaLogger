import AsyncStorage from '@react-native-async-storage/async-storage';

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
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = await this.getToken();
    const url = `${this.baseURL}${endpoint}`;
    console.log('API Request:', { method: options.method || 'GET', url, hasToken: !!token });
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

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
  }

  async register(name: string, email: string, password: string) {
    const result = await this.request<{
      user: { id: string; name: string; email: string; avatarUrl: string | null };
      tokens: { accessToken: string; refreshToken: string };
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });

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
    });

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

    const response = await fetch(`${this.baseURL}/meals`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create meal' }));
      throw new Error(error.message || 'Failed to create meal');
    }

    return response.json();
  }

  async getMeals(page: number = 1, limit: number = 50) {
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
    
    return result;
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
    const result = await this.request(`/meals/${mealId}`, { method: 'DELETE' });
    console.log('deleteMeal result:', result);
    return result;
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
}

export const api = new ApiClient();

