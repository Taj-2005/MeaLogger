import * as FileSystem from 'expo-file-system';
import { subscribeToNetworkChanges, isOnline } from '../utils/network';
import { api } from './api';
import { OfflineQueue, QueuedRequest } from './offlineQueue';
import { OfflineStorage, CachedMeal } from './offlineStorage';

const SYNC_LOCK_KEY = '@meal_logger_sync_lock';
const SYNC_LOCK_TIMEOUT = 60000; // 1 minute

interface SyncResult {
  synced: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

class SyncService {
  private isSyncing = false;
  private syncLockTimestamp = 0;
  private networkUnsubscribe: (() => void) | null = null;
  private syncInterval: NodeJS.Timeout | null = null;

  async acquireLock(): Promise<boolean> {
    try {
      const now = Date.now();
      if (this.isSyncing) {
        if (now - this.syncLockTimestamp < SYNC_LOCK_TIMEOUT) {
          return false;
        }
        this.releaseLock();
      }
      this.isSyncing = true;
      this.syncLockTimestamp = now;
      return true;
    } catch (error) {
      console.error('Error acquiring sync lock:', error);
      return false;
    }
  }

  releaseLock(): void {
    this.isSyncing = false;
    this.syncLockTimestamp = 0;
  }

  async copyImageToPersistentStorage(imageUri: string, localId: string): Promise<string> {
    try {
      const fileName = `meal_${localId}_${Date.now()}.jpg`;
      const persistentUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.copyAsync({
        from: imageUri,
        to: persistentUri,
      });
      
      return persistentUri;
    } catch (error) {
      console.error('Error copying image to persistent storage:', error);
      throw error;
    }
  }

  async uploadImage(imageUri: string): Promise<string> {
    try {
      const formData = new FormData();
      
      const isWeb = typeof window !== 'undefined';
      if (isWeb) {
        const imageResponse = await fetch(imageUri);
        const blob = await imageResponse.blob();
        const file = new File([blob], 'meal.jpg', { type: 'image/jpeg' });
        formData.append('image', file);
      } else {
        formData.append('image', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'meal.jpg',
        } as any);
      }

      const token = await (api as any).getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const API_BASE_URL = 'https://mea-logger.vercel.app/api/v1';
      const response = await fetch(`${API_BASE_URL}/meals`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to upload image' }));
        throw new Error(error.message || 'Failed to upload image');
      }

      const result = await response.json();
      if (result.success && result.data?.meal?.imageUrl) {
        return result.data.meal.imageUrl;
      }
      throw new Error('No image URL returned from server');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  async syncQueuedRequest(request: QueuedRequest): Promise<boolean> {
    try {
      if (request.type === 'CREATE_MEAL') {
        const localId = request.localId || request.data.localId;
        const imageUri = request.imageUri || request.data.imageUri;
        
        // Update status to syncing
        if (localId) {
          await OfflineStorage.updateMeal(localId, {
            syncStatus: 'syncing',
          });
          // Trigger UI update by emitting event or using a callback
          this.notifyStatusChange?.();
        }

        // Create FormData for direct upload (bypassing offline check)
        const formData = new FormData();
        const isWeb = typeof window !== 'undefined';
        
        if (isWeb && imageUri) {
          try {
            const imageResponse = await fetch(imageUri);
            const blob = await imageResponse.blob();
            const file = new File([blob], 'meal.jpg', { type: 'image/jpeg' });
            formData.append('image', file);
          } catch (error) {
            console.error('Error converting image to blob:', error);
            throw new Error('Failed to process image');
          }
        } else if (imageUri) {
          formData.append('image', {
            uri: imageUri,
            type: 'image/jpeg',
            name: 'meal.jpg',
          } as any);
        }
        
        formData.append('title', request.data.title);
        formData.append('type', request.data.type);
        formData.append('date', new Date(request.data.date).toISOString());
        if (request.data.calories) {
          formData.append('calories', request.data.calories.toString());
        }

        const token = await (api as any).getToken();
        if (!token) {
          throw new Error('Not authenticated');
        }

        const API_BASE_URL = 'https://mea-logger.vercel.app/api/v1';
        
        // Use AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        try {
          const response = await fetch(`${API_BASE_URL}/meals`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);

          if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Failed to create meal' }));
            throw new Error(error.message || 'Failed to create meal');
          }

          const result = await response.json();
          
          if (result.success && localId) {
            await OfflineStorage.updateMeal(localId, {
              isLocal: false,
              pending: false,
              syncStatus: 'synced',
              imageUrl: result.data?.meal?.imageUrl || imageUri,
              _id: result.data?.meal?._id || result.data?.meal?.id,
            });
            this.notifyStatusChange?.();
            return true;
          }
          
          return false;
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          console.error('Fetch error in sync:', fetchError);
          
          // Re-throw network errors to be handled by retry logic
          const errorMessage = fetchError?.message?.toLowerCase() || '';
          if (errorMessage.includes('network') || errorMessage.includes('request failed') || fetchError.name === 'TypeError') {
            throw fetchError;
          }
          
          // For other errors, mark as failed
          if (localId) {
            await OfflineStorage.updateMeal(localId, {
              syncStatus: 'failed',
            });
            this.notifyStatusChange?.();
          }
          throw fetchError;
        }
      } else if (request.type === 'UPDATE_MEAL') {
        const result = await api.updateMeal(request.data.id, request.data);
        return result.success;
      } else if (request.type === 'DELETE_MEAL') {
        const result = await api.deleteMeal(request.data.id);
        return result.success;
      }

      return false;
    } catch (error: any) {
      console.error('Error syncing request:', error);
      
      // Update status to failed if localId exists (only if not a network error that should retry)
      const errorMessage = error?.message?.toLowerCase() || '';
      const shouldMarkFailed = !errorMessage.includes('network') && !errorMessage.includes('request failed');
      
      if (shouldMarkFailed && (request.localId || request.data?.localId)) {
        const localId = request.localId || request.data.localId;
        await OfflineStorage.updateMeal(localId, {
          syncStatus: 'failed',
        });
        this.notifyStatusChange?.();
      }
      
      throw error;
    }
  }

  async syncQueue(): Promise<SyncResult> {
    const result: SyncResult = {
      synced: 0,
      failed: 0,
      errors: [],
    };

    if (!(await this.acquireLock())) {
      console.log('Sync already in progress, skipping...');
      return result;
    }

    try {
      const online = await isOnline();
      if (!online) {
        console.log('Device is offline, skipping sync');
        return result;
      }

      const queue = await OfflineQueue.getQueue();
      if (queue.length === 0) {
        return result;
      }

      console.log(`Starting sync for ${queue.length} queued requests...`);

      for (const request of queue) {
        try {
          const success = await this.syncQueuedRequest(request);
          
          if (success) {
            await OfflineQueue.dequeue(request.id);
            result.synced++;
            console.log(`Synced request ${request.id}`);
          } else {
            const shouldRetry = await OfflineQueue.incrementRetry(request.id);
            if (!shouldRetry) {
              result.failed++;
              result.errors.push({
                id: request.id,
                error: 'Max retries reached',
              });
              console.log(`Request ${request.id} failed after max retries`);
            } else {
              console.log(`Request ${request.id} will be retried`);
            }
          }
        } catch (error: any) {
          console.error(`Error syncing request ${request.id}:`, error);
          
          const shouldRetry = await OfflineQueue.incrementRetry(request.id);
          if (!shouldRetry) {
            result.failed++;
            result.errors.push({
              id: request.id,
              error: error.message || 'Unknown error',
            });
          }
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log('Sync completed:', result);
      return result;
    } catch (error) {
      console.error('Error in sync queue:', error);
      return result;
    } finally {
      this.releaseLock();
    }
  }

  async syncWithBackoff(maxRetries: number = 5): Promise<SyncResult> {
    let attempt = 0;
    let baseDelay = 1000;

    while (attempt < maxRetries) {
      try {
        const result = await this.syncQueue();
        if (result.synced > 0 || result.failed > 0) {
          return result;
        }
        
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          console.log(`Sync attempt ${attempt + 1} completed, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        attempt++;
      } catch (error) {
        console.error(`Sync attempt ${attempt + 1} failed:`, error);
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        attempt++;
      }
    }

    return { synced: 0, failed: 0, errors: [] };
  }

  start(): void {
    console.log('Starting sync service...');
    
    // Listen for network changes
    this.networkUnsubscribe = subscribeToNetworkChanges(async (networkState) => {
      if (networkState.isConnected && networkState.isInternetReachable) {
        console.log('Network restored, triggering sync...');
        await this.syncWithBackoff();
      }
    });

    // Periodic sync check (every 30 seconds when online)
    this.syncInterval = setInterval(async () => {
      const online = await isOnline();
      if (online) {
        await this.syncWithBackoff();
      }
    }, 30000);

    // Initial sync attempt
    setTimeout(async () => {
      const online = await isOnline();
      if (online) {
        await this.syncWithBackoff();
      }
    }, 2000);
  }

  stop(): void {
    console.log('Stopping sync service...');
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
      this.networkUnsubscribe = null;
    }
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async triggerSync(): Promise<SyncResult> {
    return await this.syncWithBackoff();
  }
}

export const syncService = new SyncService();
