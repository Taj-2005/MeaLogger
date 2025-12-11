import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = '@meal_logger_offline_queue';

export interface QueuedRequest {
  id: string;
  type: 'CREATE_MEAL' | 'UPDATE_MEAL' | 'DELETE_MEAL';
  endpoint: string;
  method: string;
  data: any;
  imageUri?: string;
  localId?: string;
  timestamp: number;
  retries: number;
  status?: 'pending' | 'syncing' | 'synced' | 'failed';
}

export class OfflineQueue {
  private static maxRetries = 5;

  // Add request to queue
  static async enqueue(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retries' | 'status'>): Promise<string> {
    try {
      const queue = await this.getQueue();
      const queuedRequest: QueuedRequest = {
        ...request,
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retries: 0,
        status: 'pending',
      };
      queue.push(queuedRequest);
      await this.saveQueue(queue);
      return queuedRequest.id;
    } catch (error) {
      console.error('Error enqueueing request:', error);
      throw error;
    }
  }

  // Get all queued requests
  static async getQueue(): Promise<QueuedRequest[]> {
    try {
      const queueData = await AsyncStorage.getItem(QUEUE_KEY);
      if (!queueData) return [];
      return JSON.parse(queueData) as QueuedRequest[];
    } catch (error) {
      console.error('Error reading queue:', error);
      return [];
    }
  }

  // Save queue
  static async saveQueue(queue: QueuedRequest[]): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Error saving queue:', error);
    }
  }

  // Remove request from queue
  static async dequeue(requestId: string): Promise<void> {
    try {
      const queue = await this.getQueue();
      const filtered = queue.filter(req => req.id !== requestId);
      await this.saveQueue(filtered);
    } catch (error) {
      console.error('Error dequeuing request:', error);
    }
  }

  // Increment retry count for a request
  static async incrementRetry(requestId: string): Promise<boolean> {
    try {
      const queue = await this.getQueue();
      const request = queue.find(req => req.id === requestId);
      if (request) {
        request.retries += 1;
        if (request.retries >= this.maxRetries) {
          // Remove if max retries reached
          await this.dequeue(requestId);
          return false;
        }
        await this.saveQueue(queue);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error incrementing retry:', error);
      return false;
    }
  }

  // Clear queue
  static async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(QUEUE_KEY);
    } catch (error) {
      console.error('Error clearing queue:', error);
    }
  }

  // Get queue size
  static async getQueueSize(): Promise<number> {
    try {
      const queue = await this.getQueue();
      return queue.length;
    } catch (error) {
      return 0;
    }
  }
}
