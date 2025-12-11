import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_BASE_URL = 'https://mea-logger.vercel.app/api/v1';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

class ApiClient {
  private baseURL: string;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<boolean> | null = null;
  private pendingRequests: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
    endpoint: string;
    options: RequestInit;
  }> = [];

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async optimizeImageForWeb(imageUri: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof Image === 'undefined' || typeof HTMLCanvasElement === 'undefined') {
        // Fallback for non-browser environments
        fetch(imageUri)
          .then(res => res.blob())
          .then(resolve)
          .catch(reject);
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          const QUALITY = 0.75; // 75% quality for faster upload
          
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions maintaining aspect ratio
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to blob with compression
          canvas.toBlob(
            (blob) => {
              if (blob) {
                console.log(`Image optimized: ${img.width}x${img.height} -> ${width}x${height}, size: ${(blob.size / 1024).toFixed(2)}KB`);
                resolve(blob);
              } else {
                reject(new Error('Failed to create blob from canvas'));
              }
            },
            'image/jpeg',
            QUALITY
          );
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        // Fallback: try direct fetch
        fetch(imageUri)
          .then(res => res.blob())
          .then(resolve)
          .catch(reject);
      };
      
      img.src = imageUri;
    });
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

  async refreshAccessToken(): Promise<boolean> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const refreshToken = await this.getRefreshToken();
        if (!refreshToken) {
          console.log('No refresh token available');
          return false;
        }

        console.log('Attempting to refresh access token...');
        const response = await fetch(`${this.baseURL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Token refresh failed:', {
            status: response.status,
            message: errorData.message || 'Unknown error',
          });
          return false;
        }

        const result: ApiResponse<{ tokens: { accessToken: string; refreshToken: string } }> =
          await response.json();

        if (result.success && result.data?.tokens) {
          await this.setTokens(
            result.data.tokens.accessToken,
            result.data.tokens.refreshToken
          );
          console.log('Token refreshed successfully');
          return true;
        }

        console.error('Token refresh response invalid:', result);
        return false;
      } catch (error: any) {
        console.error('Token refresh error:', {
          message: error.message,
          name: error.name,
        });
        return false;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async processPendingRequests(success: boolean) {
    const requests = [...this.pendingRequests];
    this.pendingRequests = [];

    if (success) {
      const newToken = await this.getToken();
      for (const request of requests) {
        try {
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(newToken && { Authorization: `Bearer ${newToken}` }),
            ...(request.options.headers as Record<string, string>),
          };
          const response = await fetch(`${this.baseURL}${request.endpoint}`, {
            ...request.options,
            headers,
          });
          const result = await response.json().catch(() => ({ success: false }));
          request.resolve(result);
        } catch (error) {
          request.reject(error);
        }
      }
    } else {
      for (const request of requests) {
        request.reject(new Error('Session expired. Please login again.'));
      }
    }
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    skipOfflineCheck: boolean = false
  ): Promise<ApiResponse<T>> {
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
        const errorData = await response.json().catch(() => ({}));
        const errorCode = errorData.code;

        if (this.isRefreshing) {
          return new Promise((resolve, reject) => {
            this.pendingRequests.push({ resolve, reject, endpoint, options });
          }) as Promise<ApiResponse<T>>;
        }

        if (errorCode === 'TOKEN_EXPIRED' || !errorCode) {
          const refreshed = await this.refreshAccessToken();
          await this.processPendingRequests(refreshed);

          if (refreshed) {
            const newToken = await this.getToken();
            if (!newToken) {
              await this.clearTokens();
              throw new Error('Session expired. Please login again.');
            }

            const retryHeaders: HeadersInit = {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${newToken}`,
              ...(options.headers as Record<string, string>),
            };

            const retryResponse = await fetch(`${this.baseURL}${endpoint}`, {
              ...options,
              headers: retryHeaders,
            });

            if (retryResponse.status === 401) {
              await this.clearTokens();
              throw new Error('Session expired. Please login again.');
            }

            response = retryResponse;
            console.log('API Response (after refresh):', {
              status: response.status,
              statusText: response.statusText,
              url: response.url,
            });
          } else {
            await this.clearTokens();
            throw new Error('Session expired. Please login again.');
          }
        } else {
          await this.clearTokens();
          throw new Error(errorData.message || 'Authentication failed. Please login again.');
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
      throw error;
    }
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
    const token = await this.getToken();
    if (!token) {
      throw new Error('Not authenticated. Please login again.');
    }

    try {
      // Step 1: Get upload signature from backend (fast, <1s)
      const signatureResponse = await this.request<{
        signature: string;
        timestamp: number;
        folder: string;
        publicId: string;
        cloudName: string;
        apiKey: string;
        uploadUrl: string;
        eagerTransformation?: string;
      }>('/meals/upload-signature', {
        method: 'GET',
      });

      if (!signatureResponse.success || !signatureResponse.data) {
        throw new Error('Failed to get upload signature');
      }

      const { signature, timestamp, folder, publicId, cloudName, apiKey, uploadUrl, eagerTransformation } = signatureResponse.data;

      // Step 2: Prepare image for upload
      const isWeb = Platform.OS === 'web';
      let imageFile: Blob | File;

      if (isWeb) {
        try {
          // Optimize image for web: compress and resize before upload
          const optimizedBlob = await this.optimizeImageForWeb(mealData.imageUri);
          imageFile = new File([optimizedBlob], 'meal.jpg', { type: 'image/jpeg' });
        } catch (error: any) {
          console.error('Error optimizing image:', error);
          // Fallback: try to use image as-is
          let blob: Blob;
          if (mealData.imageUri.startsWith('data:')) {
            const response = await fetch(mealData.imageUri);
            blob = await response.blob();
          } else if (mealData.imageUri.startsWith('blob:')) {
            const response = await fetch(mealData.imageUri);
            blob = await response.blob();
          } else {
            const response = await fetch(mealData.imageUri);
            if (!response.ok) {
              throw new Error(`Failed to fetch image: ${response.statusText}`);
            }
            blob = await response.blob();
          }
          imageFile = new File([blob], 'meal.jpg', { type: blob.type || 'image/jpeg' });
        }
      } else {
        // React Native - convert URI to blob for direct upload
        const response = await fetch(mealData.imageUri);
        imageFile = await response.blob();
      }

      // Step 3: Upload directly to Cloudinary (bypasses Vercel timeout)
      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append('file', imageFile);
      cloudinaryFormData.append('api_key', apiKey);
      cloudinaryFormData.append('timestamp', timestamp.toString());
      cloudinaryFormData.append('signature', signature);
      cloudinaryFormData.append('folder', folder);
      cloudinaryFormData.append('public_id', publicId);
      if (eagerTransformation) {
        cloudinaryFormData.append('eager', eagerTransformation);
      }

      console.log('Uploading image directly to Cloudinary...');
      const uploadStartTime = Date.now();

      const cloudinaryResponse = await fetch(uploadUrl, {
        method: 'POST',
        body: cloudinaryFormData,
      });

      if (!cloudinaryResponse.ok) {
        const error = await cloudinaryResponse.json().catch(() => ({ message: 'Cloudinary upload failed' }));
        throw new Error(error.message || 'Failed to upload image to Cloudinary');
      }

      const cloudinaryResult = await cloudinaryResponse.json();
      const uploadDuration = Date.now() - uploadStartTime;
      console.log(`Image uploaded to Cloudinary in ${uploadDuration}ms`, {
        url: cloudinaryResult.secure_url,
        publicId: cloudinaryResult.public_id,
      });

      // Step 4: Save meal with Cloudinary URL (fast, <1s)
      const mealResult = await this.request<{
        meal: {
          id: string;
          title: string;
          type: string;
          date: string;
          calories: number | null;
          imageUrl: string;
          createdAt: string;
          updatedAt: string;
        };
      }>('/meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: mealData.title,
          type: mealData.type,
          date: new Date(mealData.date).toISOString(),
          calories: mealData.calories,
          imageUrl: cloudinaryResult.secure_url,
        }),
      });

      return mealResult;
    } catch (error: any) {
      console.error('Create meal API error:', error);
      throw error;
    }
  }

  async getMeals(page: number = 1, limit: number = 50) {
    return this.request<{
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
    return this.request(`/meals/${mealId}`, { method: 'DELETE' });
  }

  async getProfile() {
    return this.request<{
      user: { id: string; name: string; email: string; avatarUrl: string | null };
    }>('/profile');
  }

  async healthCheck() {
    return this.request<{
      database: { status: string; test: boolean };
      jwt: { secretPresent: boolean; expiresIn: string; refreshExpiresIn: string };
      cloudinary: { configured: boolean };
      timestamp: string;
    }>('/auth/health', { method: 'GET' }, true);
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

