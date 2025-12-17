import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getApiBaseURL } from '../utils/apiConfig';

// Get platform-aware API base URL
// This handles:
// - Android emulator: 10.0.2.2 (host machine alias)
// - Android physical device: LAN IP (must be configured)
// - iOS simulator: localhost (works)
// - Web: localhost (works)
const API_BASE_URL = getApiBaseURL();

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

class ApiClient {
  private baseURL: string;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<boolean> | null = null;
  private refreshAttempts: number = 0;
  private maxRefreshAttempts: number = 2;
  private pendingRequests: Array<{
    resolve: (value: ApiResponse<unknown>) => void;
    reject: (error: Error) => void;
    endpoint: string;
    options: RequestInit;
  }> = [];

  constructor() {
    this.baseURL = API_BASE_URL;
    // Log the API URL being used (helpful for debugging)
    console.log('🌐 API Base URL:', this.baseURL);
    
    // Warn if using localhost on Android (will fail on physical devices)
    if (Platform.OS === 'android' && this.baseURL.includes('localhost')) {
      console.warn(
        '⚠️ WARNING: Using localhost on Android. This will FAIL on physical devices.\n' +
        'Set EXPO_PUBLIC_LAN_IP in .env file and restart Expo server.'
      );
    }
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
    // Prevent infinite refresh loops
    if (this.refreshAttempts >= this.maxRefreshAttempts) {
      console.error('Max refresh attempts reached. Clearing tokens.');
      await this.clearTokens();
      this.refreshAttempts = 0;
      return false;
    }

    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshAttempts += 1;
    
    this.refreshPromise = (async () => {
      try {
        const refreshToken = await this.getRefreshToken();
        if (!refreshToken) {
          console.error('No refresh token available');
          this.refreshAttempts = 0; // Reset on clear failure
          return false;
        }

        console.log(`Attempting to refresh access token (attempt ${this.refreshAttempts}/${this.maxRefreshAttempts})...`);
        const response = await fetch(`${this.baseURL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorCode = errorData.code;
          
          console.error('Token refresh failed:', {
            status: response.status,
            message: errorData.message || 'Unknown error',
            code: errorCode,
          });
          
          // If refresh token is expired or invalid, clear tokens and reset attempts
          if (errorCode === 'REFRESH_TOKEN_EXPIRED' || errorCode === 'INVALID_REFRESH_TOKEN' || response.status === 401) {
            console.log('Refresh token expired or invalid. Clearing tokens.');
            await this.clearTokens();
            this.refreshAttempts = 0;
          }
          
          return false;
        }

        const result: ApiResponse<{ tokens: { accessToken: string; refreshToken: string } }> =
          await response.json();

        if (result.success && result.data?.tokens) {
          if (!result.data.tokens.accessToken || !result.data.tokens.refreshToken) {
            console.error('Token refresh returned empty tokens');
            return false;
          }
          
          await this.setTokens(
            result.data.tokens.accessToken,
            result.data.tokens.refreshToken
          );
          
          // Reset attempts on successful refresh
          this.refreshAttempts = 0;
          console.log('Token refreshed successfully');
          return true;
        }

        console.error('Token refresh response invalid:', result);
        return false;
      } catch (error: unknown) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        console.error('Token refresh error:', {
          message: errorObj.message,
          name: errorObj.name,
        });
        
        // On network errors, don't increment attempts (might be temporary)
        if (!errorObj.message.includes('Network') && !errorObj.message.includes('fetch')) {
          // Only increment on non-network errors
        }
        
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
          const result = await response.json().catch(() => ({ success: false })) as ApiResponse<unknown>;
          request.resolve(result);
        } catch (error: unknown) {
          const errorObj = error instanceof Error ? error : new Error(String(error));
          request.reject(errorObj);
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
      // Ensure body is properly formatted
      const fetchOptions: RequestInit = {
        method: options.method || 'GET',
        headers,
      };

      // Only add body if it exists and method allows it
      if (options.body && ['POST', 'PUT', 'PATCH'].includes(fetchOptions.method || '')) {
        // Ensure body is a string for JSON requests
        if (typeof options.body === 'string') {
          fetchOptions.body = options.body;
        } else {
          // If body is not a string, stringify it (shouldn't happen, but defensive)
          console.warn('Body is not a string, stringifying:', typeof options.body);
          fetchOptions.body = JSON.stringify(options.body);
        }
      }

      // Add other options (but don't override body/headers/method)
      if (options.signal) fetchOptions.signal = options.signal;
      if (options.credentials) fetchOptions.credentials = options.credentials;
      if (options.cache) fetchOptions.cache = options.cache;
      if (options.redirect) fetchOptions.redirect = options.redirect;
      if (options.referrer) fetchOptions.referrer = options.referrer;
      if (options.integrity) fetchOptions.integrity = options.integrity;
      if (options.keepalive) fetchOptions.keepalive = options.keepalive;
      if (options.mode) fetchOptions.mode = options.mode;

      // Log request details (but truncate body if it's JSON to avoid log spam)
      const bodyPreview = fetchOptions.body 
        ? (typeof fetchOptions.body === 'string' 
            ? (fetchOptions.body.length > 200 
                ? fetchOptions.body.substring(0, 200) + '...' 
                : fetchOptions.body)
            : '[Non-string body]')
        : null;
      
      // Convert headers to record for logging
      const headersRecord = headers as Record<string, string>;
      
      console.log('Making fetch request:', {
        method: fetchOptions.method,
        url,
        hasBody: !!fetchOptions.body,
        bodyLength: fetchOptions.body ? String(fetchOptions.body).length : 0,
        bodyPreview: bodyPreview,
        headers: Object.keys(headers),
        headerValues: {
          'Content-Type': headersRecord['Content-Type'],
          'Authorization': headersRecord['Authorization'] ? 'Bearer ***' : undefined,
        },
      });

      // Add timeout for requests - longer timeout for initial connection attempts
      // Note: setTimeout returns number in browser/RN, NodeJS.Timeout in Node
      let timeoutId: number | ReturnType<typeof setTimeout> | null = null;
      let controller: AbortController | null = null;
      
      // Use longer timeout (60 seconds) for slow networks or public IPs
      const timeoutDuration = 60000;
      
      try {
        if (typeof AbortController !== 'undefined') {
          controller = new AbortController();
          timeoutId = setTimeout(() => {
            if (controller) {
              console.warn(`Request timeout after ${timeoutDuration}ms:`, url);
              controller.abort();
            }
          }, timeoutDuration);
          
          if (fetchOptions.signal) {
            // If there's already a signal, we need to combine them
            const originalSignal = fetchOptions.signal;
            originalSignal.addEventListener('abort', () => {
              if (controller) controller.abort();
            });
          } else {
            fetchOptions.signal = controller.signal;
          }
        }
      } catch (timeoutError) {
        // AbortController not available, continue without timeout
        console.warn('AbortController not available, proceeding without timeout');
      }

      const requestStartTime = Date.now();
      let response: Response;
      try {
        response = await fetch(url, fetchOptions);
        if (timeoutId) clearTimeout(timeoutId);
        const requestDuration = Date.now() - requestStartTime;
        
        // Log response details for debugging
        console.log(`✅ Request completed in ${requestDuration}ms:`, {
          url,
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        });
      } catch (fetchError: unknown) {
        if (timeoutId) clearTimeout(timeoutId);
        const requestDuration = Date.now() - requestStartTime;
        const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
        const errorName = fetchError instanceof Error ? fetchError.name : 'Unknown';
        
        console.error(`❌ Request failed after ${requestDuration}ms:`, {
          url,
          error: errorMessage,
          name: errorName,
        });
        
        if (errorName === 'AbortError' || errorMessage.includes('aborted')) {
          // Check if it was a timeout or manual abort
          if (requestDuration >= timeoutDuration - 1000) {
            // Likely a timeout
            throw new Error(
              `Request timeout after ${Math.round(requestDuration / 1000)}s. ` +
              `The server at ${url} may be unreachable. ` +
              `Check: 1) Server is running, 2) Correct IP address, 3) Firewall settings, 4) Same network.`
            );
          } else {
            // Manual abort
            throw new Error('Request was cancelled.');
          }
        }
        
        if (errorMessage.includes('Network request failed') || errorMessage.includes('Failed to fetch')) {
          // Provide helpful error message based on IP type
          const host = new URL(url).hostname;
          const isPublicIP = !host.match(/^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|127\.|localhost)/);
          
          let errorMsg = 'Network error. ';
          if (isPublicIP && !host.includes('localhost')) {
            errorMsg += `Cannot reach server at ${host}. ` +
              `If this is a public IP, ensure: 1) Server is bound to 0.0.0.0 (not just localhost), ` +
              `2) Firewall allows port ${new URL(url).port}, 3) Server is accessible from your network. ` +
              `For local development, use your LAN IP (192.168.x.x) instead.`;
          } else {
            errorMsg += 'Please check your internet connection and ensure the server is running.';
          }
          
          throw new Error(errorMsg);
        }
        
        throw fetchError;
      }
      
      console.log('API Response:', { status: response.status, statusText: response.statusText, url });

      if (response.status === 401) {
        const errorData = await response.json().catch(() => ({}));
        const errorCode = errorData.code;

        if (this.isRefreshing) {
          return new Promise<ApiResponse<T>>((resolve, reject) => {
            this.pendingRequests.push({ 
              resolve: resolve as unknown as (value: ApiResponse<unknown>) => void, 
              reject, 
              endpoint, 
              options 
            });
          });
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
    } catch (error: unknown) {
      throw error;
    }
  }

  async register(name: string, email: string, password: string) {
    try {
      const result = await this.request<{
        user: { id: string; name: string; email: string; avatarUrl: string | null };
        tokens: { accessToken: string; refreshToken: string };
      }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      }, true); // Skip offline check for auth

      if (result.success && result.data) {
        if (!result.data.tokens?.accessToken || !result.data.tokens?.refreshToken) {
          throw new Error('Registration response missing tokens. Please try again.');
        }
        
        await this.setTokens(result.data.tokens.accessToken, result.data.tokens.refreshToken);
        
        // Verify tokens were saved
        const savedAccessToken = await this.getToken();
        const savedRefreshToken = await this.getRefreshToken();
        
        if (!savedAccessToken || !savedRefreshToken) {
          throw new Error('Failed to save authentication tokens. Please try again.');
        }
        
        // Reset refresh attempts on successful registration
        this.refreshAttempts = 0;
        
        return result.data;
      }

      throw new Error(result.message || 'Registration failed. Please try again.');
    } catch (error: unknown) {
      // Enhance error message for network errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Network request failed') || errorMessage.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      throw error;
    }
  }

  async login(email: string, password: string) {
    try {
      const result = await this.request<{
        user: { id: string; name: string; email: string; avatarUrl: string | null };
        tokens: { accessToken: string; refreshToken: string };
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }, true); // Skip offline check for auth

      if (result.success && result.data) {
        if (!result.data.tokens?.accessToken || !result.data.tokens?.refreshToken) {
          throw new Error('Login response missing tokens. Please try again.');
        }
        
        await this.setTokens(result.data.tokens.accessToken, result.data.tokens.refreshToken);
        
        // Verify tokens were saved
        const savedAccessToken = await this.getToken();
        const savedRefreshToken = await this.getRefreshToken();
        
        if (!savedAccessToken || !savedRefreshToken) {
          throw new Error('Failed to save authentication tokens. Please try again.');
        }
        
        // Reset refresh attempts on successful login
        this.refreshAttempts = 0;
        
        return result.data;
      }

      throw new Error(result.message || 'Login failed. Please try again.');
    } catch (error: unknown) {
      // Enhance error message for network errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Network request failed') || errorMessage.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      throw error;
    }
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
    // Reset refresh attempts on logout
    this.refreshAttempts = 0;
    this.isRefreshing = false;
    this.refreshPromise = null;
  }

  async createMeal(mealData: {
    title: string;
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    date: string;
    calories?: number;
    imageUri: string;
  }) {
    console.log('🍽️ Starting meal creation process...');
    const token = await this.getToken();
    if (!token) {
      throw new Error('Not authenticated. Please login again.');
    }

    try {
      console.log('🍽️ Starting meal creation process...');
      console.log('Step 1: Getting upload signature...');
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

      console.log('✅ Step 1 complete: Upload signature received');
      const { signature, timestamp, folder, publicId, cloudName, apiKey, uploadUrl, eagerTransformation } = signatureResponse.data;

      // Step 2: Prepare image for upload
      console.log('Step 2: Preparing image for upload...');
      const isWeb = Platform.OS === 'web';
      let imageFile: Blob | File | { uri: string; type: string; name: string };

      if (isWeb) {
        try {
          // Optimize image for web: compress and resize before upload
          const optimizedBlob = await this.optimizeImageForWeb(mealData.imageUri);
          imageFile = new File([optimizedBlob], 'meal.jpg', { type: 'image/jpeg' });
        } catch (error: unknown) {
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
        // React Native - use file URI directly with proper FormData format
        // React Native FormData requires { uri, type, name } format for files
        console.log('Preparing React Native file format...', {
          uri: mealData.imageUri,
        });
        imageFile = {
          uri: mealData.imageUri,
          type: 'image/jpeg',
          name: 'meal.jpg',
        };
      }

      // Step 3: Upload directly to Cloudinary (bypasses Vercel timeout)
      console.log('✅ Step 2 complete: Image prepared', {
        platform: Platform.OS,
        isWeb,
        imageFileType: isWeb ? (imageFile instanceof File ? 'File' : 'Blob') : 'ReactNativeObject',
      });
      console.log('Step 3: Uploading to Cloudinary...');
      const cloudinaryFormData = new FormData();
      
      // In React Native, FormData.append for files expects { uri, type, name }
      // In Web, it expects File or Blob
      cloudinaryFormData.append('file', imageFile as any);
      cloudinaryFormData.append('api_key', apiKey);
      cloudinaryFormData.append('timestamp', timestamp.toString());
      cloudinaryFormData.append('signature', signature);
      cloudinaryFormData.append('folder', folder);
      cloudinaryFormData.append('public_id', publicId);
      if (eagerTransformation) {
        cloudinaryFormData.append('eager', eagerTransformation);
      }

      console.log('📤 Step 3: Uploading image directly to Cloudinary...', {
        uploadUrl: uploadUrl.substring(0, 50) + '...', // Truncate for logging
        platform: Platform.OS,
        hasFormData: !!cloudinaryFormData,
        imageFileInfo: isWeb 
          ? { type: imageFile instanceof File ? imageFile.type : 'blob', size: imageFile instanceof File ? imageFile.size : 'unknown' }
          : { uri: (imageFile as { uri: string }).uri.substring(0, 50) + '...', type: (imageFile as { type: string }).type },
      });
      const uploadStartTime = Date.now();

      let cloudinaryResponse: Response;
      try {
        // Add timeout for Cloudinary upload (60 seconds)
        let cloudinaryController: AbortController | null = null;
        let cloudinaryTimeout: ReturnType<typeof setTimeout> | null = null;
        
        try {
          if (typeof AbortController !== 'undefined') {
            cloudinaryController = new AbortController();
            cloudinaryTimeout = setTimeout(() => {
              console.warn('⏱️ Cloudinary upload timeout after 60s, aborting...');
              if (cloudinaryController) cloudinaryController.abort();
            }, 60000);
          }

          console.log('Making fetch request to Cloudinary...');
          cloudinaryResponse = await fetch(uploadUrl, {
            method: 'POST',
            body: cloudinaryFormData,
            signal: cloudinaryController?.signal,
          });
          
          if (cloudinaryTimeout) clearTimeout(cloudinaryTimeout);
          
          const cloudinaryFetchDuration = Date.now() - uploadStartTime;
          console.log(`✅ Cloudinary response received in ${cloudinaryFetchDuration}ms:`, {
            status: cloudinaryResponse.status,
            statusText: cloudinaryResponse.statusText,
            ok: cloudinaryResponse.ok,
          });
        } catch (fetchErr: unknown) {
          if (cloudinaryTimeout) clearTimeout(cloudinaryTimeout);
          const fetchErrorMsg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
          const fetchErrorName = fetchErr instanceof Error ? fetchErr.name : 'Unknown';
          console.error('❌ Cloudinary fetch error:', {
            error: fetchErrorMsg,
            name: fetchErrorName,
          });
          throw fetchErr;
        }
      } catch (cloudinaryFetchError: unknown) {
        const errorMsg = cloudinaryFetchError instanceof Error ? cloudinaryFetchError.message : String(cloudinaryFetchError);
        const errorName = cloudinaryFetchError instanceof Error ? cloudinaryFetchError.name : 'Unknown';
        console.error('❌ Cloudinary fetch failed:', {
          error: errorMsg,
          name: errorName,
          uploadUrl,
        });
        
        if (errorName === 'AbortError' || errorMsg.includes('aborted')) {
          throw new Error('Cloudinary upload timed out. Please try again with a smaller image.');
        }
        
        // If it's a network error, provide helpful message
        if (errorMsg.includes('Network request failed') || errorMsg.includes('Failed to fetch')) {
          throw new Error(
            `Network error uploading to Cloudinary: ${errorMsg}. ` +
            `Check your internet connection and try again.`
          );
        }
        
        throw new Error(`Failed to upload image to Cloudinary: ${errorMsg}`);
      }

      if (!cloudinaryResponse.ok) {
        const error = await cloudinaryResponse.json().catch(() => ({ message: 'Cloudinary upload failed' }));
        console.error('❌ Cloudinary upload failed:', {
          status: cloudinaryResponse.status,
          error: error.message || 'Unknown error',
        });
        throw new Error(error.message || 'Failed to upload image to Cloudinary');
      }

      let cloudinaryResult: any;
      try {
        const responseText = await cloudinaryResponse.text();
        console.log('Cloudinary response text length:', responseText.length);
        cloudinaryResult = JSON.parse(responseText);
        console.log('Cloudinary result parsed:', {
          hasSecureUrl: !!cloudinaryResult.secure_url,
          hasPublicId: !!cloudinaryResult.public_id,
          urlLength: cloudinaryResult.secure_url?.length,
        });
      } catch (parseError: unknown) {
        const parseErrorMsg = parseError instanceof Error ? parseError.message : String(parseError);
        console.error('❌ Failed to parse Cloudinary response:', parseErrorMsg);
        throw new Error(`Failed to parse Cloudinary response: ${parseErrorMsg}`);
      }

      if (!cloudinaryResult || !cloudinaryResult.secure_url) {
        console.error('❌ Cloudinary response missing secure_url:', cloudinaryResult);
        throw new Error('Cloudinary upload succeeded but response is invalid');
      }

      const uploadDuration = Date.now() - uploadStartTime;
      console.log(`✅ Image uploaded to Cloudinary in ${uploadDuration}ms`, {
        url: cloudinaryResult.secure_url,
        publicId: cloudinaryResult.public_id,
        urlLength: cloudinaryResult.secure_url.length,
      });

      // Step 4: Save meal with Cloudinary URL (fast, <1s)
      console.log('Preparing meal payload after Cloudinary upload...');
      
      const mealPayload = {
        title: mealData.title,
        type: mealData.type,
        date: new Date(mealData.date).toISOString(),
        calories: mealData.calories,
        imageUrl: cloudinaryResult.secure_url,
      };

      console.log('Meal payload created:', {
        title: mealPayload.title,
        type: mealPayload.type,
        date: mealPayload.date,
        hasImageUrl: !!mealPayload.imageUrl,
        imageUrlLength: mealPayload.imageUrl?.length,
      });

      // Validate payload before sending
      if (!mealPayload.title || !mealPayload.type || !mealPayload.imageUrl) {
        console.error('❌ Missing required fields:', {
          hasTitle: !!mealPayload.title,
          hasType: !!mealPayload.type,
          hasImageUrl: !!mealPayload.imageUrl,
        });
        throw new Error('Missing required fields: title, type, or imageUrl');
      }

      const payloadString = JSON.stringify(mealPayload);
      console.log('Creating meal with payload:', {
        title: mealPayload.title,
        type: mealPayload.type,
        date: mealPayload.date,
        hasImageUrl: !!mealPayload.imageUrl,
        imageUrlLength: mealPayload.imageUrl?.length,
        payloadSize: payloadString.length,
      });

      // Ensure imageUrl is not too long (sanity check)
      if (mealPayload.imageUrl && mealPayload.imageUrl.length > 2000) {
        console.warn('⚠️ Image URL is very long:', mealPayload.imageUrl.length, 'characters');
      }

      // Stringify payload once and reuse
      const bodyString = payloadString;
      
      console.log('📤 About to send POST request to /meals:', {
        payloadSize: bodyString.length,
        title: mealPayload.title,
        type: mealPayload.type,
        imageUrlLength: mealPayload.imageUrl?.length,
        endpoint: '/meals',
        method: 'POST',
      });

      try {
        // First, test if POST works at all with a simple test
        console.log('Testing POST endpoint connectivity...');
        try {
          const testResult = await this.request('/test-post', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ test: 'data' }),
          });
          console.log('✅ Test POST successful:', testResult);
        } catch (testError: unknown) {
          const testErrorMsg = testError instanceof Error ? testError.message : String(testError);
          console.error('❌ Test POST failed:', testErrorMsg);
          // Continue anyway - test endpoint might not exist
        }

        console.log('Sending meal creation request...');
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
          body: bodyString,
        });

        console.log('✅ Meal created successfully:', mealResult);
        return mealResult;
      } catch (requestError: unknown) {
        const errorMessage = requestError instanceof Error ? requestError.message : String(requestError);
        const errorName = requestError instanceof Error ? requestError.name : 'Unknown';
        
        console.error('❌ Meal creation request failed:', {
          error: errorMessage,
          errorName,
          payload: {
            title: mealPayload.title,
            type: mealPayload.type,
            hasImageUrl: !!mealPayload.imageUrl,
            imageUrlPreview: mealPayload.imageUrl?.substring(0, 100),
            payloadSize: bodyString.length,
          },
        });
        
        // Re-throw with more context if it's a network error
        if (errorMessage.includes('Network request failed') || errorMessage.includes('Failed to fetch')) {
          throw new Error(
            `Failed to create meal: ${errorMessage}. ` +
            `The request may not be reaching the server. ` +
            `Check: 1) Server is running, 2) Server logs for incoming requests, ` +
            `3) Network connectivity. Payload size: ${bodyString.length} bytes.`
          );
        }
        
        throw requestError;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorName = error instanceof Error ? error.name : 'Unknown';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      console.error('❌ Create meal API error:', {
        error: errorMessage,
        name: errorName,
        stack: errorStack,
        mealData: {
          title: mealData.title,
          type: mealData.type,
          hasImageUri: !!mealData.imageUri,
        },
      });
      
      // Re-throw with better context for network errors
      if (errorMessage.includes('Network request failed') || errorMessage.includes('Failed to fetch')) {
        throw new Error(
          `Network error during meal creation: ${errorMessage}. ` +
          `This may indicate: 1) Server is unreachable, 2) Request was blocked, ` +
          `3) Server crashed while processing. Check server logs for details.`
        );
      }
      
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

